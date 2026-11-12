// 概念三分类：初高中课内 / 大学先修 / 库外原型
// - 初高中课内：概念的任一关键词命中人教版知识库（207 条）的 name 或 note
// - 大学先修：命中下方人工维护的提示词表（phase-2 接入大学知识库后替换）
// - 库外原型：两者都未命中

const UNIVERSITY_HINTS = [
  ['卷积', '信号与系统 / 数字图像处理 / 深度学习（CNN）'],
  ['梯度下降', '机器学习 / 最优化'],
  ['神经网络', '机器学习 / 深度学习'],
  ['神经元', '机器学习 / 深度学习（神经网络）'],
  ['权重', '机器学习 / 深度学习（神经网络）'],
  ['监督学习', '机器学习'],
  ['无监督学习', '机器学习'],
  ['强化学习', '机器学习'],
  ['傅里叶变换', '信号与系统'],
  ['特征向量', '线性代数'],
  ['奇异值分解', '线性代数'],
  ['支持向量机', '机器学习'],
  ['决策树', '机器学习'],
  ['贝叶斯网络', '机器学习 / 概率图模型'],
];

// 太泛、不代表任何学科概念的词，拆分后不参与匹配。
const STOPWORDS = new Set([
  '学习', '概念', '初步', '认识', '边界', '应用', '及其', '原理', '基础', '技术',
]);

// 同义/中英文别名，先替换再分词，使"AI"能命中中文"人工智能"。
const ALIASES = [
  ['AI', '人工智能'],
  ['卷积神经网络', '卷积'],
  ['CNN', '卷积'],
];

// 把"数据、特征、标签"拆成 ['数据','特征','标签']；长度 < 2 或停用词剔除。
function tokenize(concept) {
  let s = concept;
  for (const [from, to] of ALIASES) s = s.replaceAll(from, to);
  return s
    .split(/[、，,/\s与及和]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function classify(concept, entries) {
  const raw = (concept ?? '').trim();
  if (!raw) {
    return { concept, classification: '库外原型', matched: [], reason: '空概念名' };
  }

  const tokens = tokenize(raw);
  const matched = entries.filter((e) =>
    tokens.some((t) => (e.name && e.name.includes(t)) || (e.note && e.note.includes(t))),
  );

  if (matched.length > 0) {
    return {
      concept,
      classification: '初高中课内',
      matched: matched.map((e) => ({
        id: e.concept_id,
        name: e.name,
        subject: e.subject,
        stage: e.stage,
        grade: e.grade,
        module: e.module,
      })),
      reason: `命中人教版初高中知识库 ${matched.length} 条`,
    };
  }

  const uni = UNIVERSITY_HINTS.find(([c]) => raw.includes(c) || c.includes(raw));
  if (uni) {
    return {
      concept,
      classification: '大学先修',
      matched: [],
      reason: `命中大学先修提示词表：${uni[1]}（phase-2 用大学知识库替换该提示表）`,
    };
  }

  return {
    concept,
    classification: '库外原型',
    matched: [],
    reason: '未命中初高中知识库，也未命中大学先修提示词表；可人工判定是否作为可视化原型入库',
  };
}
