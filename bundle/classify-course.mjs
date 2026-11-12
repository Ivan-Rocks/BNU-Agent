import { loadKb } from './lib/kb.js';
import { classify } from './lib/classify.js';

const dataDir = 'C:/Work/BNU-Agent/knowledge-base';
const { entries } = await loadKb(dataDir);
console.log('知识库条目数：', entries.length);

const concepts = [
  ['cnv-001', '卷积'],
  ['ai-001', 'AI 与智能的边界'],
  ['ai-002', '数据、特征、标签'],
  ['ai-003', '监督/无监督学习'],
  ['ai-004', '神经元、权重、层'],
  ['ai-005', '梯度下降'],
  ['ai-006', 'AI 伦理、偏见、边界'],
];

for (const [id, c] of concepts) {
  const r = classify(c, entries);
  const hit = r.matched?.slice(0, 2).map((m) => `${m.subject}/${m.name}`).join('；') || '-';
  console.log(`${id} | ${c} -> ${r.classification} | ${r.reason} | 命中: ${hit}`);
}
