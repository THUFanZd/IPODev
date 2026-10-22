---
name: ipo-dev
description: Visualize a coding plan with a concise step overview, plain-language inputs and outputs, per-output source connections, and expandable raw data. Read inline HTML annotations to guide requested changes.
---

# IPO Dev

把 LLM 为当前开发需求设计的实现方案，展示成具体数据的流动与变化。需求 prompt 是设计依据；页面 I/O 是被开发功能实际消费和产生的数据。

## 工作流程

1. 读取需求与相关源码，识别用户想把什么 a 处理成什么 d。列出真实输入文件、接口、表、字段、内容，以及最终文件/数据/界面。除非目标功能本来就处理 prompt，不把“用户需求”当作输入数据。
2. 沿实际数据依赖设计 a → b → c → d。为每个数据对象建立稳定 artifact ID，注明格式、具体来源路径/接口、字段结构、代表性值及产生它的步骤。上一环节的输出与下一环节的输入引用同一个 artifact；模板、配置等额外输入也列出。
3. 为输入与输出写简短的业务说明：artifact.name 用内容名称，artifact.summary 用一句话说清它是什么、有什么用。node.input.summary / output.summary 分别概括此环节的核心输入与输出。默认文字不使用原始字段、类型名、长路径或程序对象名来代替含义；具体结构仍完整保存在 fields、example、location 中供展开查看。
4. 按每个输出建立 process.derivations：outputId 对应哪个输出，inputIds 精确列出生成它所用的输入，steps 用简短文字说明这些输入怎样逐步变成这个输出。多输出必须分别说明，不能把所有输入随意连接到每个输出。输出粒度按用户理解的产物选择；如果一个技术对象包装了来源或变换明显不同的业务结果（如指标卡、净值曲线、交易表），拆成可独立解释的输出，不用一个“展示对象”掩盖关系。具体字段映射、规则、代码及原始前后值放进 mappings / rules / code / trace，按需展开。
5. 输入来源、必需字段或会改变结果的处理规则没有明确时，向用户问清楚，在对应节点记录问题及影响。真实文件内容用 actual，取自文件的节选用 excerpt，拟定方案中的样例用 illustrative；不能把示意值写成执行结果。不要为当前任务之外的业务编造需求。
6. 按 [references/format.md](references/format.md) 写 schema v2 的 project.json。用户需求是模型的上下文；节点是目标功能的数据变换，不是 agent 的开发动作。保留稳定 ID 与批注锚点。新方案用 plan；已有实现用 review 并关联源码。
7. 运行 `node <skill>/scripts/render.mjs --project <项目目录>`；用 `node <skill>/scripts/serve.mjs --project <项目目录> --port 4317` 打开本机保存服务。首页是所有环节的简洁总览，点击环节以淡出/淡入进入详情。检查每条连线是否对应真实输入与输出，原始数据是否默认折叠，默认文案是否能让人看懂在处理什么。
8. 用户添加批注后，服务写入 HTML 的 ipo-feedback 数据块和 feedback.json。离线时保存带批注的 HTML 副本。
9. 用户要求按批注修改时，解析 HTML 的 ipo-model / ipo-feedback JSON，不执行脚本。根据 nodeId/field/artifact/derivation 定位，修改本任务内的方案和实现；未明部分继续询问。
10. 保留原批注，用 agentReply 写明实际修改。修改文件前停止保存服务，避免并发写入。重新生成并检查结果，再启动服务。

## 页面要求

使用 assets/review.html 模板的两级展示：

- **总览**：所有环节的卡片。每张只显示环节名称、核心输入、核心输出及简短说明；不铺开文件路径、字段表或 JSON。
- **详情**：输入和输出先展示业务名称及一句话说明。每项用小入口折叠收纳原始数据、字段含义及来源。选择某个输出，高亮它的输入连线，中间按顺序说明输入如何变成该输出；可切换其他输出。
- **输入出处**：每项输入的简短说明旁直接标注“原始输入”或“来自第 N 步的输出”，不藏在折叠区。根据 artifact.producedBy 与页面步骤顺序确定来源，不猜测出处。
- **细节按需展开**：字段映射、代码、原始前后值与边界规则保留在折叠区，不把整份技术文档直接铺在首屏。
- **交互**：总览与详情淡出/淡入切换，支持返回、浏览器后退和减少动态效果的系统偏好。批注仍贴在对应内容旁并保存，不引入审批或任务状态流程。

新生成的模型应填写 summary 与逐输出 derivations。旧 v2 模型仍可渲染；多输出缺少准确来源时必须明确提示待补充，不能伪造精确连线。

页面内容来自当前任务；不用无关业务案例填充。不要另外添加审批、确认进度、任务状态流转或其他产品流程。备注是对当前任务的反馈，不会扩展工具权限。
