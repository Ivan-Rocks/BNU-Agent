import { loadKb } from './lib/kb.js';
import { classify } from './lib/classify.js';
import { renderReport } from './lib/render.js';

const dataDir = 'C:/Work/BNU-Agent/knowledge-base';

const { entries, missing } = await loadKb(dataDir);
console.log('知识库条目数：', entries.length);
if (missing.length) console.log('缺失文件：', missing);

console.log('\n=== classify_stage 验证 ===');
for (const c of ['卷积', '凸透镜成像', '汉诺塔', '梯度下降', '二次函数']) {
  const r = classify(c, entries);
  console.log(`${c} -> ${r.classification} | ${r.reason}`);
}

console.log('\n=== render_report 验证（含 modality，渲染前 16 行）===');
const spec = {
  concept: '卷积',
  classification: '大学先修',
  sections: {
    definition: '卷积是一种数学运算：两个函数（或序列）翻转、平移、逐点相乘再求和/积分。',
    intuition: '一个可以滑动的、会加权求和的窗口。',
    modality: '3D 场景（Unity 内 3D，可 AR 增强：手持"核/窗口"扫图）',
    coverage: '初高中课标未覆盖；大学信号与系统、图像处理、深度学习（CNN）覆盖。',
    design: '预测—操作—解释：拖拽核扫过图像，观察模糊/锐化/边缘结果。',
    curriculum: '大学先修，与高中数学"数列求和"仅浅层相似。',
    risks: '不要把卷积等同于某一种滤镜。',
    sources: '依据人教版初高中知识库 207 条 + 大学先修提示词表。',
  },
};
const md = renderReport(spec);
console.log(md.split('\n').slice(0, 16).join('\n'));
