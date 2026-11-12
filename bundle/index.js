import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKb } from './lib/kb.js';
import { classify } from './lib/classify.js';
import { renderReport } from './lib/render.js';

export const inject = ['tools', 'userQuestions', 'skills'];
export const name = 'bnu-course-agent';

const text = (t) => [{ type: 'text', text: t }];

const __dirname = dirname(fileURLToPath(import.meta.url));

// 从 SKILL.md 读取 name/description/content（frontmatter + 正文），随 bundle 注册为 runtime skill。
function loadConceptIngestionSkill() {
  const raw = readFileSync(join(__dirname, 'skills', 'concept-ingestion', 'SKILL.md'), 'utf8');
  const m = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('concept-ingestion SKILL.md frontmatter missing');
  const meta = m[1];
  const content = m[2].trim();
  const name = (meta.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const description = (meta.match(/^description:\s*(.+)$/m) || [])[1]?.trim();
  if (!name || !description) throw new Error('concept-ingestion SKILL.md frontmatter incomplete');
  return { name, description, content };
}

export function apply(ctx, config = {}) {
  const dataDir = config.dataDir ?? '';
  const reportDir = config.reportDir ?? join(dataDir, 'reports');

  // 批准状态：按"会话 + 概念"记录。渲染成功后清除，使每次渲染都需要新的批准。
  const approved = new Map();
  const approvalKey = (sessionId, concept) => `${sessionId}\u0000${concept}`;

  ctx.effect(() => {
    const skill = loadConceptIngestionSkill();
    const disposeSkill = ctx.skills.register({
      name: skill.name,
      description: skill.description,
      content: skill.content,
      source: 'bundled',
    });

    const d1 = ctx.tools.register({
      name: 'classify_stage',
      description:
        '对给定概念做三分类：初高中课内 / 大学先修 / 库外原型。基于人教版初高中知识库（184 条章/单元级条目）判定；大学先修当前用人工提示词表（phase-2 接入大学知识库）。',
      parameters: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: '概念名，如"卷积"、"凸透镜成像"、"汉诺塔"' },
        },
        required: ['concept'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            concept: { type: 'string' },
            classification: { type: 'string', enum: ['初高中课内', '大学先修', '库外原型'] },
            matched: { type: 'array', items: { type: 'object' } },
            reason: { type: 'string' },
          },
          required: ['concept', 'classification', 'reason'],
        },
        render(args, value) {
          const summary = value.matched?.length
            ? value.matched.map((m) => `  - [${m.subject}] ${m.name}（${m.grade} / ${m.module}）`).join('\n')
            : '  - 无命中条目';
          return text(`分类：${value.classification}\n原因：${value.reason}\n命中：\n${summary}`);
        },
      },
      async execute(args) {
        const data = await loadKb(dataDir);
        return classify(args.concept, data.entries);
      },
    });

    const d2 = ctx.tools.register({
      name: 'request_review',
      description:
        '渲染前的人工复核门：向用户呈现概念定义与可视化形式，等待批准。批准后记录该概念的可渲染状态，之后 render_report 才可执行。',
      parameters: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: '概念名' },
          classification: { type: 'string', description: '三分类结论' },
          definition: { type: 'string', description: '准确定义' },
          intuition: { type: 'string', description: '直觉定义' },
          modality: { type: 'string', description: '可视化形式（2D交互/3D场景/AR/讨论）' },
        },
        required: ['concept', 'classification', 'definition', 'intuition', 'modality'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            concept: { type: 'string' },
            approved: { type: 'boolean' },
          },
          required: ['concept', 'approved'],
        },
        render(args, value) {
          return text(value.approved ? `已批准「${value.concept}」，可以渲染。` : `未批准「${value.concept}」，请按反馈修改后重新请求复核。`);
        },
      },
      async execute(args, exec) {
        const question = {
          questions: [
            {
              id: 'review',
              header: `课件策划复核：${args.concept}`,
              question: `概念「${args.concept}」的策划如下，是否批准渲染？`,
              detail: [
                `分类：${args.classification}`,
                `定义（准确）：${args.definition}`,
                `直觉：${args.intuition}`,
                `可视化形式：${args.modality}`,
              ].join('\n\n'),
              options: [
                { label: '批准渲染', description: '内容无误，可以调用 render_report 落盘' },
                { label: '需要修改', description: '指出要改的地方，回到策划步骤' },
              ],
            },
          ],
          agent: exec.agent,
          signal: exec.signal,
        };
        const answer = await ctx.userQuestions.ask(question);
        const selected = answer.answers?.[0]?.selected ?? [];
        const ok = selected.includes('批准渲染');
        if (ok && exec.agent?.id) {
          approved.set(approvalKey(exec.agent.id, args.concept), true);
        }
        return { concept: args.concept, approved: ok };
      },
    });

    const d3 = ctx.tools.register({
      name: 'render_report',
      description:
        '按标准七节模板把概念策划规格渲染成 markdown 报告并写入文件。sections 字段：definition/intuition/modality/coverage/design/curriculum/risks/sources。必须先经 request_review 获人工批准，否则拒绝执行。',
      parameters: {
        type: 'object',
        properties: {
          concept: { type: 'string', description: '概念名' },
          classification: { type: 'string', description: '三分类结论' },
          sections: { type: 'object', description: '各章节内容（definition/intuition/modality/coverage/design/curriculum/risks/sources）' },
          filename: { type: 'string', description: '输出文件名，默认 `${concept}-可视化课件策划报告.md`' },
        },
        required: ['concept', 'classification', 'sections'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            title: { type: 'string' },
          },
          required: ['path', 'title'],
        },
        render(args, value) {
          return text(`报告已写入：${value.path}`);
        },
      },
      async execute(args, exec) {
        const key = approvalKey(exec.agent?.id, args.concept);
        if (!approved.get(key)) {
          const err = new Error(`未经人工复核批准：请先调用 request_review 获批准后再渲染「${args.concept}」。`);
          err.name = 'approval-required';
          throw err;
        }
        const md = renderReport(args);
        const filename = args.filename ?? `${args.concept}-可视化课件策划报告.md`;
        await mkdir(reportDir, { recursive: true });
        const path = join(reportDir, filename);
        await writeFile(path, md, 'utf8');
        approved.delete(key);
        return { path, title: `${args.concept} 可视化课件策划报告` };
      },
    });

    // 同步 guard：render_report 无批准状态即拒绝（硬门，独立于 skill 是否被遵守）。
    const disposeGuard = ctx.tools.guard((execution) => {
      if (execution.name !== 'render_report') return undefined;
      const concept = execution.arguments?.concept;
      const sid = execution.agent?.id;
      if (!sid || !concept) return '缺少会话或概念，无法校验批准状态';
      if (!approved.get(approvalKey(sid, concept))) {
        return 'render_report 需要先经 request_review 人工批准';
      }
      return undefined;
    });

    return () => {
      disposeSkill();
      d1();
      d2();
      d3();
      disposeGuard();
    };
  });
}
