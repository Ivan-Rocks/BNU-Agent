# BNU Course Agent — 概念可视化课件工作流

把一个学科概念（如"卷积"）变成一份带课程定位、带课件设计的标准 md 报告，并且这套流程可复用于任意概念。这是 BNU 教育技术实验室 AR 课件生产线的**最小可运行闭环**。

## 一 这个仓库里有什么

| 目录 | 内容 | 性质 |
| --- | --- | --- |
| `bundle/` | 可安装的 DSH bundle（工具 + skill） | 可执行插件 |
| `knowledge-base/` | 人教版知识库（6 科，207 条） | 版本化数据 |
| `inventory/` | 概念库存登记表 | 版本化数据 |
| `reports/` | 已产出的概念课件策划报告 | 版本化数据 |
| `courses/` | 课程大纲 | 版本化数据 |
| `docs/` | 选型、工作流设计、项目总结、给导师的汇报 | 阅读材料 |
| `raw-sources/` | 课标原文 PDF/OCR（知识库的原始依据） | 参考材料 |

**核心原则：数据与编排解耦。** 知识库、库存、模板是数据；bundle 是可执行代码；skill 是"怎么用这些工具"的方法。三者分开，别人才能分别升级、分别复用。

## 二 另一个工程师如何复现

```bash
# 1. 拿到代码和数据
git clone <repo-url>
cd BNU-Agent

# 2. 把 bundle 装进自己的 DSH profile（用 plugin_manager 工具）
#    install_bundle 目标填 <repo>/bundle 目录

# 3. 改配置指向自己的知识库路径（cordis.patch.yml 里的 dataDir/reportDir）
```

装好后，在任何 DSH 会话里就能调用三个工具 + 一个 skill：

- `classify_stage(concept)` → 读 `knowledge-base/04-*.md`，返回三分类（初高中课内 / 大学先修 / 库外原型）。
- `request_review(spec)` → 渲染前的人工复核门，批准后才放行。
- `render_report(spec)` → 套标准七节模板，把策划规格渲染成 md 报告落盘（未经批准会被 guard 拒绝）。
- `concept-ingestion` skill → 随 bundle 自动注册，指导 agent 按固定五步走完入库流程。

## 三 最小闭环（已跑通 + 已装进 profile 验证）

```
输入概念 → classify_stage（确定性代码）→ 三分类
         → 策划生成（agent/skill 判断）  → 七节内容
         → request_review（人工批准，硬门）
         → render_report（确定性代码，guard 拒绝未批准）→ 落盘 md
         → 登记 inventory
```

已验证（`bundle/smoke.mjs`，读 207 条知识库）：

```
卷积     -> 大学先修
凸透镜成像 -> 初高中课内（命中 1 条）
汉诺塔   -> 库外原型
梯度下降  -> 大学先修
二次函数  -> 初高中课内（命中 2 条）
```

## 四 为什么这样"打包"就能复用

1. **工具是代码**：`classify_stage`、`render_report` 是确定性函数，可单测、可复现。
2. **方法是 skill**：`concept-ingestion` 随 bundle 注册，别的 agent 装了就自动获得同一套流程。
3. **人工复核是硬门**：`request_review` + guard 保证"不批准就不渲染"，不依赖 agent 自觉。
4. **数据是数据**：知识库、库存、模板版本化存放，换学科、换概念、换底座都不动代码。

## 五 尚未完成（下一步）

- [ ] 实现 `search_curriculum`（当前 classify 是关键词匹配，不是语义检索）。
- [ ] 二期大学知识库（信号与系统、深度学习等），替代 classify 里的临时提示词表。
- [ ] 接入 RAG 向量检索 + MCP 暴露。
- [ ] 报告学科审阅、Unity 课件实现、真机验证。
- [ ] 把《人工智能入门》7 个概念全部走完复核，产出完整课程策划。

详见 `docs/13-项目总结.md`。
