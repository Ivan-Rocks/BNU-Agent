// 按标准模板把概念策划规格渲染成 markdown 报告。
// 内容由调用方（agent/skill）决定，本函数只做确定性格式化。
// 前两节（概念定义、可视化形式）是人工复核的必看项。

export function renderReport(spec) {
  const { concept, classification, sections = {} } = spec;
  const s = (key) => (sections[key] && sections[key].trim() ? sections[key].trim() : '_待补充_');
  return [
    `# ${concept} 可视化课件策划报告`,
    '',
    `> 分类结论：**${classification}**（由 bnu-course-agent 最小闭环生成）`,
    '',
    '## 一 概念定义',
    '',
    '### 1.1 准确定义',
    '',
    s('definition'),
    '',
    '### 1.2 直觉定义',
    '',
    s('intuition'),
    '',
    '## 二 可视化形式',
    '',
    s('modality'),
    '',
    '## 三 课程覆盖定位',
    '',
    s('coverage'),
    '',
    '## 四 可视化课件设计',
    '',
    s('design'),
    '',
    '## 五 与教材的衔接',
    '',
    s('curriculum'),
    '',
    '## 六 验收与风险',
    '',
    s('risks'),
    '',
    '## 七 来源与判断边界',
    '',
    s('sources'),
    '',
  ].join('\n');
}
