---
name: concept-ingestion
description: Use when ingesting a subject concept into the BNU courseware inventory — classifying it against the PEP K-12 knowledge base, drafting the lesson, and producing a standard report that a human must approve before it is finalized.
---

# 概念入库流水线 (Concept Ingestion)

## Overview

把一个学科概念（如"卷积"）变成一份标准课件策划报告并登记进 inventory 的固定流程。核心原则：**分类和渲染是确定性工具调用，内容判断是 agent 的职责；渲染定稿前必须经人工复核。**

## When to Use

- 用户给了一个新概念，要求"入库 / 出报告 / 策划课件"。
- 需要判断概念属于初高中课内 / 大学先修 / 库外原型。
- 需要按统一模板产出课件策划报告并登记。

## 固定步骤（按顺序，不可跳过）

1. **分类**：调用 `classify_stage` 工具，传入概念名，得到三分类结论。
2. **策划**：根据分类结论，撰写七节内容（见下表），并确定可视化形式（modality）。
3. **人工复核**：把"概念定义 + 可视化形式"呈现给用户，请求批准。**未获批准不得渲染。**
4. **渲染**：调用 `render_report` 工具，传入概念名 + 分类 + 七节内容，得到落盘路径。
5. **登记**：在 `05-概念Inventory.md` 追加一行，concept_id 按学科前缀，report 指向落盘路径，status=prototype。

## 人工复核（渲染前必经，硬门）

在调用 `render_report` 之前，必须向用户呈现以下内容并等待明确批准：

- 概念定义（准确 + 直觉两层）——**这个概念如何被 clarify 出来**；
- 可视化形式（modality）——**用什么形式呈现**：2D 交互 / 3D 场景 / AR / 讨论；
- 三分类结论与理由。

用 `ask_user_question` 或直接在回复中列出上述内容，等用户说"批准/通过/可以渲染"后再调用 `render_report`。用户要求修改时，回到策划步骤，改完再复核。

## 三分类含义

| 分类 | 含义 | 例子 |
| --- | --- | --- |
| 初高中课内 | 命中人教版知识库 184 条 | 凸透镜成像 |
| 大学先修 | 命中大学提示词表（phase-2 换大学知识库） | 卷积 |
| 库外原型 | 两者都未命中，但可视化价值高 | 汉诺塔 |

## 报告七节（render_report 的 sections 字段）

`definition`（准确定义）、`intuition`（直觉定义）、`modality`（可视化形式）、`coverage`（课程覆盖定位）、`design`（可视化课件设计）、`curriculum`（与教材的衔接）、`risks`（验收与风险）、`sources`（来源与判断边界）。

## 铁律

1. **先分类再写报告**：分类结论决定报告"课程覆盖定位"怎么写，不可跳过。
2. **人工复核不可省**：渲染前必须呈现"定义 + 形式"并获批准。未批准直接渲染 = 违规。
3. **待核实不臆断**：拿不准的课标条目、年级、课程，写"待核实"，不编造。
4. **确定性的交给工具**：分类和渲染必须走 `classify_stage` / `render_report`，不手写替代。
5. **登记不可省**：产出报告后必须登记进 inventory，否则概念"丢了"。
6. **不是每个概念都要 AR/VR**：按概念直觉形态选模态（2D 交互 / 3D 场景 / AR / 讨论），课程载体是 demo 选型，非最终结论。

## 常见错误

| 错误 | 正确 |
| --- | --- |
| 不调 classify_stage 直接手写报告 | 先分类，分类结论是报告定位的依据 |
| 未经人工复核就调 render_report | 渲染前呈现"定义 + 形式"等批准 |
| 手写 markdown 不调 render_report | 渲染走工具，保证模板一致 |
| 报告写完不登记 inventory | 登记，report 指向落盘路径 |
| 把"命中关键词"当"课内" | 命中 note 关键词 ≠ 实质课内，需确认 |
