# Unity skills 与工具调研

调研日期 2026-11-12。服务于卷积课件的 Windows Editor Play 开发，以及后续 Android／华为 AR 迁移。

## 建议采用的路径

优先使用本机已有的 Unity 官方 skills 与 Unity CLI，通过项目内 Pipeline 包连接 Editor。UI 采用现有技能覆盖的 uGUI。执行前完成连接与读写场景验证，再锁定实际使用的包版本。此选择基于现有环境与本次课件需求。

| 候选 | 可复用能力 | 本项目处理 |
| --- | --- | --- |
| Unity 官方 `unity-cli` | Editor 操作、场景与资源编辑、测试和构建 | 首选操作入口，技能已在当前会话可用 |
| 官方 `ui` / `ui-ugui` | Canvas、布局、组件检查 | 用于教学面板、像素网格、操作控件 |
| 官方 `unity-package-management` | 包依赖检查与安装 | 实施时配置 Pipeline、测试和 UI 依赖 |
| 官方 `unity-pipeline` | Pipeline 项目内命令与工作流 | 安装项目包后核查并按需使用 |
| Coplay `unity-mcp-orchestrator` 与 Unity MCP | 经 MCP 查询 Editor、编辑场景和脚本、读取 Console、截图与测试 | 备选连接方式，当前环境尚未实测 |

Unity 官方仓库说明了技能与 CLI 的配合方式，发布者为 Unity-Technologies。本次打开页面显示约 1.2k stars。`npx --yes skills find unity` 返回 unity-cli 9.9K、ui-ugui 7.7K、unity-package-management 8.5K、unity-pipeline 2.3K installs，数字为当次目录查询结果。[官方仓库](https://github.com/Unity-Technologies/skills) · [技能目录](https://skills.sh/unity-technologies/skills/unity-cli)

Coplay 仓库当前页面显示约 15.9k stars，说明支持 Unity 2021.3 LTS 至 6.x，依赖 Python 3.10+／uv。已阅读配套 skill，包含先读 Editor 状态、等待编译、检查 Console 和截图的流程。安装量本次未取得。[Unity MCP](https://github.com/CoplayDev/unity-mcp) · [配套 skill](https://github.com/CoplayDev/unity-mcp/blob/beta/unity-mcp-skill/SKILL.md)

以上工具的本项目兼容性需要用实际连接、编译和 Play 验收确认。候选的安装量与 stars 仅作为维护活跃度参考。

## 本机检查结果

| 检查项 | 结果 |
| --- | --- |
| Unity CLI | 已安装，`unity --version` 返回 `1.0.0-beta.17` |
| Editor | `6000.3.23f1` 路径已确认存在，见实施计划 |
| Android 工具链 | CLI 列出 Android、SDK & NDK Tools、OpenJDK 模块 |
| Editor 连接 | `unity status --format json` 返回 `STATUS_NO_INSTANCES`，当前未发现已连接 Pipeline 实例 |
| 原 AR 实验工程 | manifest 有 uGUI 2.0.0，尚无 `com.unity.pipeline` |
| 华为 AR | 历史构建成功，触摸、追踪与恢复等待真机验收 |

`STATUS_NO_INSTANCES` 只描述当前连接结果。实施时需打开目标工程、配置 Pipeline 并再次检查。原工程还记录了新旧输入系统设置差异，迁移时要处理。[现有工程限制](../../Unity-Integration/docs/NOTABLES.md)

## 后续自建 skillset 的边界

| 拟建技能 | 输入与输出 | 需要沉淀的教育业务规则 |
| --- | --- | --- |
| 策划精简 | 原策划 → 短报告 | 学习目标、预测—操作—解释、来源与待核实项 |
| Unity 计划生成 | 短报告 + 工程约束 → 可执行计划 | 教学交互映射到场景、数值约定、任务与验收 |
| 课件实施验收 | 计划 + Unity 工程 → 运行结果与证据 | Windows 全功能先验收，随后 Android 和 AR，回写每阶段结果 |

这些技能在卷积 Pilot 跑通后再编写，用第二个概念验证。实际场景操作复用官方 Unity 技能，BNU 技能承载课件规则与交接信息。

跨机器需要安装时，可参考 `npx skills add Unity-Technologies/skills`。当前会话已有相关官方技能。本次完成了调研与只读环境检查，连接验证列入实施任务。[官方安装说明](https://github.com/Unity-Technologies/skills#install)
