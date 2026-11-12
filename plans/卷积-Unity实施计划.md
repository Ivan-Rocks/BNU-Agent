# 卷积课件 Unity 实施计划

日期 2026-11-12 · 状态为待实施 · 关联概念 `cnv-001`

执行者使用 `executing-plans` 逐项执行并更新复选框，每项记录验证结果。使用 Unity 专项技能操作 Editor，具体命令先按已连接实例的能力发现结果核对。

**目标**　在 Windows 的 Unity Editor 中直接点击 Play，完成一维滑窗、二维滤镜与 CNN 机制演示的全部教学功能和构型调试；桌面功能验收后迁移 Android，再接入华为 AR。

**架构**　纯 C# 数学计算由教学控制器驱动，uGUI 展示输入、权重、计算过程和输出。桌面和移动端共享教学状态与计算，AR 场景负责放置课件板及追踪状态。

**技术栈**　Unity 6000.3.23f1、Built-in、C#、uGUI、Unity CLI／Pipeline。后续 Android 使用 IL2CPP、ARM64、OpenGLES3。

**策划依据**　[精简 Pilot 报告](../reports/03-卷积可视化-Pilot报告.md)。工具来源与本机检查见 [技能调研](../docs/15-Unity技能与工具调研.md)。

## 实施顺序与默认选择

用户已明确 Windows Editor Play 优先，全部功能完成后迁移 Android。以下工程细节是本计划选定的默认值，实施过程中如需改变，应记录原因及影响。

| 阶段 | 交付 | 通过条件 |
| --- | --- | --- |
| W1 | Windows 二维滤镜交互 | 点击或拖动窗口，逐项计算，三种滤镜，预测与解释流程可用 |
| W2 | Windows 全部教学功能 | 一维任务、二维任务、CNN 演示全部完成，布局及交互验收通过 |
| A1 | Android 平面课件 | 同一套任务完成触摸和屏幕适配，安装运行通过 |
| A2 | 华为 AR 课件 | 真机平面放置、追踪、前后台恢复通过，教学功能仍可使用 |

采用独立工程 `D:/BNU-Agent/unity/ConvolutionPilot`。开发从二维任务 B 开始，随后补齐 A、C，课程呈现仍按 A → B → C。桌面默认 1280×720 横屏，同时检查 1920×1080 和 1024×768。操作控件使用 uGUI Pointer 事件与 `StandaloneInputModule`，Input Handling 先采用旧 Input Manager，便于后续复用华为示例的触摸接口。

Windows 阶段以 Editor Play 作为入口，Windows 独立可执行文件按交付需要另行安排。Android SDK 与相机权限在移动阶段处理。

## 场景与学生操作

`ConvolutionDesktop.unity` 包含 Camera、EventSystem、LessonController 和屏幕空间 Canvas。

| 界面区域 | 内容与行为 |
| --- | --- |
| 顶部 | A／B／C 任务切换、当前学习目标 |
| 主体左侧 | 输入数字或灰度网格，可点击和拖动的有效窗口 |
| 主体中间 | 原核、实际运算核、逐项乘积、总和，显示当前坐标 |
| 主体右侧 | 输出网格、当前输出高亮、原始数值及颜色图例 |
| 底部 | 预测输入、揭示结果、单步、播放／暂停、重置、解释输入与提交 |

Canvas 使用 `Scale With Screen Size`，布局通过 anchors 和 Layout Groups 组织。正文采用可覆盖中文的字体资产，实施时核查已有字体和许可，所有任务标题、负号及小数均须可读。选中项同时使用描边与坐标标记。

进入任务或切换输入、核后，先选一个窗口并填写数值预测，再点击“揭示结果”。揭示前隐藏结果网格和乘积总和。揭示后可自由拖动、单步或自动扫描，并提交“我的预测与结果差异来自哪里”的解释。输入至少包含一个非空预测和一段非空解释即可完成本轮，数学误差显示为反馈，解释内容供教师查看。

窗口移动到不同位置时保存原预测对应的坐标和核，方便回看。切换任务、输入、核、窗口大小或 CNN 层／分支会暂停播放并开始新一轮预测，清理旧输出与解释。重置恢复当前任务默认输入、核、坐标及空白回答。课堂回答暂存于本次 Play 会话，退出 Play 后结束该会话。

## 计算约定与验证数据

数组按 `[row, column]` 存储，画面左上角为 `(0,0)`，row 向下、column 向右。核中心与输入中心的显示采用此坐标系。数值以 float 计算，验收误差 `1e-5`，显示可四舍五入至三位小数，比较使用原始值。

任务 B 使用二维数学卷积，运算前将原核旋转 180°。stride 固定为 1，padding 使用 valid，输入 H×W、核 Kh×Kw 的输出为 `(H-Kh+1)×(W-Kw+1)`。只允许完整落在输入中的窗口位置。该模式的边界含义可对照 SciPy 文档。[SciPy convolve2d](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.convolve2d.html)

| 核 | 原始权重 |
| --- | --- |
| 模糊 | 3×3 全为 1/9 |
| 锐化 | `[[0,-1,0],[-1,5,-1],[0,-1,0]]` |
| 竖边响应 | `[[-1,0,1],[-1,0,1],[-1,0,1]]` |

默认输入为 5×5，每行均为 `[0,0,1,1,1]`。三个核的 3×3 输出每行应分别为 `[1/3,2/3,1]`、`[-1,2,1]`、`[-3,-3,0]`。另外提供横边与中心脉冲输入，保持同样的 5×5 尺寸。

模糊和锐化输出颜色使用 `clamp(value,0,1)`，点击格子显示原始数值及截断提示。边缘响应用蓝—白—红表示负—零—正，色域固定为 `[-3,3]`，超范围饱和显示，图例注明范围。原始结果始终保留符号。

任务 A 使用输入 `[0,0,0,1,0,0,0]`，窗口为 3 或 5 点均匀平均，valid 输出。3 点结果应为 `[0,1/3,1/3,1/3,0]`，5 点结果应为 `[1/5,1/5,1/5]`。

任务 C 为两条确定性的特征提取演示分支。输入为 8×8 的竖边、横边或十字图案，原始值为 0 或 1。竖边定义为 `column>=4`，横边为 `row>=4`，十字为 `row==3 || column==3`。

第一层分别使用竖边核和其转置，按互相关计算得到两张 6×6 特征图，随后应用 ReLU。第二层对每张特征图使用 3×3 均匀平均核，得到两张 4×4 特征图。允许逐层查看权重、选中坐标及计算过程，图例按第一层 `[0,3]`、第二层 `[0,3]` 固定。界面标注“人工预设权重的机制演示”，讲解实际 CNN 的权重可通过训练学习。PyTorch 的 Conv2d 文档说明了其使用互相关的计算约定。[PyTorch Conv2d](https://docs.pytorch.org/docs/2.15/generated/torch.nn.Conv2d.html)

为检查翻转规则，输入 3×3 的 1 至 9，原核也为 1 至 9，数学卷积单值结果应为 165，互相关应为 285。

## 文件与职责

下表路径均相对于未来 Unity 工程根目录。Unity 创建资源时一并保存 `.meta`。

| 文件 | 职责 |
| --- | --- |
| `Assets/BNU/Convolution/Runtime/ConvolutionMath.cs` | 一维平均、二维卷积／互相关，生成单窗口乘积明细 |
| `Assets/BNU/Convolution/Runtime/LessonSamples.cs` | 固定输入、核、教学提示和任务 C 两层数据 |
| `Assets/BNU/Convolution/Runtime/LessonController.cs` | 任务状态、坐标、播放、预测、解释和重置 |
| `Assets/BNU/Convolution/Runtime/LessonView.cs` | 绑定 UI、网格绘制、数值与颜色、鼠标／触摸 Pointer 事件 |
| `Assets/BNU/Convolution/Runtime/Bnu.Convolution.asmdef` | 教学运行时程序集 |
| `Assets/BNU/Convolution/Scenes/ConvolutionDesktop.unity` | Windows Play 与后续 Android 平面模式入口 |
| `Assets/BNU/Convolution/Prefabs/LessonPanel.prefab` | 可复用教学面板 |
| `Assets/BNU/Convolution/Tests/EditMode/ConvolutionMathTests.cs` | 手算样例、方向、边界和异常输入 |
| `Assets/BNU/Convolution/Tests/PlayMode/LessonFlowTests.cs` | 预测／揭示／重置／切换中的状态一致性 |
| `Assets/BNU/Convolution/Tests/EditMode/Bnu.Convolution.EditModeTests.asmdef` | EditMode 测试程序集，引用运行时程序集 |
| `Assets/BNU/Convolution/Tests/PlayMode/Bnu.Convolution.PlayModeTests.asmdef` | PlayMode 测试程序集，引用运行时程序集 |
| `Assets/BNU/Convolution/Editor/ConvolutionBuild.cs` | Android 构建入口，移动阶段创建 |
| `Assets/BNU/Convolution/AR/HuaweiLessonPlacement.cs` | AR 命中、锚点与课件板，AR 阶段创建 |
| `Assets/BNU/Convolution/Scenes/ConvolutionAR.unity` | AR 阶段的独立入口 |

运行时核心接口约定如下，具体内部辅助方法由实施者决定。

- `ConvolutionMath.Filter2D(float[,] input, float[,] kernel, bool flipKernel)` 返回 `float[,]`，输出采用 valid。
- `ConvolutionMath.WindowProducts(float[,] input, float[,] kernel, int row, int column, bool flipKernel)` 返回 `float[,]`，与该位置输出共用相同权重顺序。
- `ConvolutionMath.MovingAverage(float[] input, int windowSize)` 返回 `float[]`。
- `LessonController.SelectTask(int taskIndex)`、`SelectKernel(int kernelIndex)`、`SelectSample(int sampleIndex)`、`SelectWindowSize(int size)`、`SelectLayer(int layerIndex, int branchIndex)` 更新任务或显示状态。
- `LessonController.SelectWindow(int row, int column)`、`Step()`、`SetPlaying(bool playing)`、`ResetLesson()` 控制浏览。
- `LessonController.SubmitPrediction(float prediction)`、`Reveal()`、`SubmitExplanation(string explanation)` 驱动教学循环，`LessonView` 只向这些入口传递用户动作。

## 执行 TODO

### T0 建立可直接 Play 的 Windows 工程

- [ ] 创建上述路径的 Built-in 工程，固定 Editor `6000.3.23f1`，当前目标为 Windows Standalone。记录 `ProjectVersion.txt`、Packages manifest 与 lock 文件。
- [ ] 配置项目级 `.gitignore`，忽略 Library、Temp、Obj、Logs、UserSettings 和构建输出，纳入 Assets、Packages、ProjectSettings 与 `.meta`。
- [ ] 核查 uGUI、测试包与字体可用性，安装 Pipeline 并打开此工程，记录包的实际版本。
- [ ] 通过 CLI 查询工程、层级和组件，创建并保存初始场景。重复执行初始化时复用同名目标，避免重复 Camera、Canvas、EventSystem。
- [ ] 点击 Play，确认画面可见、帧数持续推进、Console 无编译错误和运行异常；退出后重新打开场景验证保存结果。

本机已确认的 Editor 路径为 `D:/Program Files/UnityEditors_RootDirectory/6000.3.23f1/Editor/Unity.exe`。当前 CLI 为 `1.0.0-beta.17`，连接状态为 `STATUS_NO_INSTANCES`。以下为实施时的诊断入口。

```powershell
$lessonProject = 'D:/BNU-Agent/unity/ConvolutionPilot'
unity status --format json
unity pipeline install --project-path $lessonProject
unity command --project-path $lessonProject --caller plugin --skill unity-cli --format json
```

最后一条用于发现实际命令。Editor 操作始终传入目标工程路径。连接失败时依次检查工程是否打开、Pipeline 是否加载、Console 编译错误和 Safe Mode，修复具体原因后重试。CLI 连接持续不可用时，可评估调研中的 Coplay 备选并记录切换原因。

### T1 实现并验证数学计算

- [ ] 创建运行时和 EditMode 测试程序集，写入上述固定样例的预期值。
- [ ] 实现三个数学接口，确保返回原始浮点值，颜色处理放在视图层。
- [ ] 验证三种二维核、一维 3／5 点平均、165／285 翻转样例，误差均不超过 `1e-5`。
- [ ] 验证首尾有效窗口，乘积之和等于对应输出。空数组、核大于输入、偶数核尺寸、NaN／Infinity 和窗口越界返回明确参数异常。
- [ ] 运行 EditMode 测试并保存结果，失败项修复后再进入交互任务。

### T2 完成 Windows 二维任务 B

- [ ] 创建场景和 LessonPanel，显示 5×5 输入、3×3 核、3×3 输出和数值明细。
- [ ] 实现鼠标点击与拖动窗口，窗口仅停留于 3×3 个有效位置，输出格同步高亮。实现三种核和三个输入样例切换。
- [ ] 实现单步与每 0.5 秒一步的播放，按行扫描，到最后一格暂停，播放状态在切换和重置时正确清理。
- [ ] 实现预测、揭示、解释和重置流程。无效数值输入提示修改；预测未提交时，揭示动作保持禁用。允许预测错误并显示原始误差。
- [ ] PlayMode 验证未揭示时无结果泄露、重置后无旧状态、播放中切核后无旧核结果、退出再进入 Play 初始化一致。
- [ ] 在三种窗口尺寸下点击 Play 实测鼠标命中、字体、布局、数字、边缘负值和图例，保存预测与揭示状态截图。

T2 完成即达到 W1。截图须包含完整 Canvas，场景相机截图可能遗漏 Overlay UI，采用 Game View 的 screen 捕获并核对内容。

### T3 完成 Windows 一维任务 A

- [ ] 使用相同控制器接入数字序列、3／5 点窗口，显示平均值与逐项贡献。
- [ ] 复用预测、拖动、播放、解释、重置，任务切换后更新有效坐标和输出尺寸。
- [ ] 验证两个平均结果，并手动测试 A → B → A 后窗口大小、输入和选择状态一致，Console 无异常。

### T4 完成 Windows CNN 机制任务 C

- [ ] 按计算约定生成三种 8×8 输入和两条固定权重分支，展示输入 → 第一层 → ReLU → 第二层。
- [ ] 逐层查看 6×6 和 4×4 特征图，点击单元可查看对应局部输入、权重和原始结果，复用预测与解释流程。
- [ ] 显示互相关约定和人工预设权重说明，教学文本交代训练会改变权重。
- [ ] 测试竖边样例的竖边分支在跨边界窗口得到 3，横边分支得到 0；第二层使用第一层 ReLU 的实际结果计算。核对尺寸、ReLU 的负值清零和分支切换。
- [ ] 在 Editor 中完成 C 的预测—观察—解释，再从 C 返回 A／B，确认自动播放、坐标和提示已正确切换。

### T5 验收 Windows 全部功能

- [ ] 用鼠标从初始场景完成 A、B、C，每个任务至少一轮预测和解释，测试错误预测、拖出网格、快速切换任务、暂停、重置和再次 Play。
- [ ] 跑完 EditMode 和 PlayMode 测试，收集 Console、帧数推进证据及关键截图，人工查看布局和交互结果。
- [ ] 在 `D:/BNU-Agent/reports/卷积-Unity验收记录.md` 记录 Editor／包版本、工程路径、测试数量、失败项、截图位置和教学审阅状态。逐项填写 W1／W2／A1／A2 的实际结果。
- [ ] 确认 A、B、C 功能与构型设计都已验收，再进入 Android 迁移。

测试优先通过已连接 Editor 的测试命令或 Test Runner 执行，并等待实际结果。批处理复现时，关闭同一工程的 Editor，以已安装的 Unity Test Framework 为准执行以下命令，检查 XML 中失败数为 0 且实际执行数大于 0。

```powershell
$lessonEditor = 'D:/Program Files/UnityEditors_RootDirectory/6000.3.23f1/Editor/Unity.exe'
$lessonProject = 'D:/BNU-Agent/unity/ConvolutionPilot'
& $lessonEditor -batchmode -projectPath $lessonProject -runTests -testPlatform EditMode -testResults "$lessonProject/EditMode-results.xml" -logFile "$lessonProject/EditMode.log"
& $lessonEditor -batchmode -projectPath $lessonProject -runTests -testPlatform PlayMode -testResults "$lessonProject/PlayMode-results.xml" -logFile "$lessonProject/PlayMode.log"
```

### T6 迁移 Android 平面课件

- [ ] 切换 Android，设置 IL2CPP／ARM64／OpenGLES3 与横屏，建立 `ConvolutionBuild.BuildAndroid()`，应用 ID 为 `com.bnu.convolutionpilot`。
- [ ] 通过相同 Pointer 事件支持触摸点击与拖动，适配安全区域、触控目标及软键盘。检查鼠标代码中是否存在平台专属假设。
- [ ] 输出 `Build/Android/ConvolutionPilot.apk`，安装设备，完整执行 A、B、C，与 Windows 固定样例数值逐项一致。
- [ ] 检查前后台恢复、触摸取消、布局和软键盘遮挡，将实际设备型号、Android 版本及结果写入 A1 验收记录。

### T7 接入华为 AR

- [ ] 在 Android 平面课件通过后，导入 `D:/Unity-Integration/HuaweiAR-Unity6-Experimental.unitypackage`，参照交接文档核查资源与构建依赖。
- [ ] 从已验证的 World AR 场景结构建立 ConvolutionAR，复用已有 AR Session、背景渲染和锚点更新方式。把课件面板放置到平面锚点上，手机屏幕保留任务控制与文本输入。
- [ ] 实现平面点击放置和重新放置，同一时刻保留一块课件板。点击屏幕 UI 时拦截放置事件，释放旧锚点后再放新板。
- [ ] 将空间面板点击坐标映射回相同的窗口选择入口。追踪丢失时提示并暂停空间交互，恢复追踪后保持当前教学状态。
- [ ] 验证 Built-in 相机方向、平面追踪、板上点选、前后台恢复、权限拒绝后的提示与重试，以及重置／重新放置。记录实际设备与 AR Engine 服务版本。
- [ ] 把构建场景入口、APK 路径、数值回归和真机结果写入 A2 验收记录。

现有 Spike 采用旧 Input Manager，CleanValidation 曾采用新版 Input System。AR 迁移需要统一输入设置与 EventSystem，并检查 UI 点击是否误触发世界放置。历史构建结果与运行限制见 [Unity 交接文档](../../Unity-Integration/docs/HANDOFF.md) 和 [已知限制](../../Unity-Integration/docs/NOTABLES.md)。

## 重点回归条件

| 条件 | 预期 | 所属任务 |
| --- | --- | --- |
| 非对称核、边缘负值 | 翻转结果正确，原值可见，图例一致 | T1、T2 |
| 边界格、空输入、非法尺寸 | 有效窗口不越界，非法调用明确报错 | T1 |
| 播放中切任务或切核 | 播放暂停，旧预测和结果清理 | T2—T5 |
| Game View 失焦、不同宽高比 | 帧数与播放按预期推进，UI 可读可点 | T0、T5 |
| 触摸 UI、后台恢复、AR 丢失追踪 | 无误放置与重复事件，恢复后状态一致 | T6、T7 |

## 交接给下一次实施

执行入口为 T0。先阅读精简报告和本计划，在目标工程中使用 Unity CLI 发现工具，按任务保存场景、运行检查、记录证据。Windows W2 验收完成后进入 Android A1，随后推进 AR A2。每项勾选必须有对应结果，设备尚未连接时记录真机待验收状态。
