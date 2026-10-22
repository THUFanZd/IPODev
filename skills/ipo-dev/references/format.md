# IPO 具体数据流（schema v2）

`project.json`：`schemaVersion: 2`、`id`、`revision`、`title`、`subtitle`、`goal`、`scope`、`mode`（plan 或 review）、`artifacts`、`flow` 和 `nodes`。title 描述被开发的功能；需求 prompt 不作为业务 I/O，除非功能本身处理 prompt。

`artifacts` 是稳定 ID 的数据对象列表：

```json
{
  "id": "parsed-data",
  "name": "内存中的模型对象",
  "summary": "已经读取并整理好的页面内容，供后续生成步骤使用。",
  "kind": "data",
  "location": "render.mjs → model 变量",
  "format": "JavaScript Object",
  "sampleKind": "excerpt",
  "producedBy": "parse-model",
  "fields": [{"path": "title", "type": "string", "meaning": "页面标题"}],
  "example": {"title": "具体功能名称"}
}
```

name 是简短的内容名称，例如“整理后的回测结果”，不写成 BacktestResult。summary 是默认展示的一句话业务说明；不要列字段或重复类型。location、format、fields、example 仅在“查看原始数据与字段”折叠区显示。kind：file / data / html / dom / request。外部输入不填 producedBy；中间结果填产生它的节点 ID。sampleKind：actual（完整实际内容）、excerpt（实际内容节选）、illustrative（拟定或交互样例）。

`flow` 是主链路的 artifact ID 数组，用于结构核对；模板、配置等侧输入仍放在相应节点 input 中。新版首页以 nodes 展示环节，详情中的准确来源连线由 process.derivations 决定。

每个 node 使用稳定的 `id`，包含 `revision`、`title`、`summary`、`dependsOn` 和以下字段：

- `input` / `output`：`{ summary, description, artifactIds: ["具体数据对象 ID"] }`。summary 是总览卡片上的一行核心输入/输出说明，推荐 15—40 个中文字符；description 为补充细节。同一对象使用同一 ID。input 中每个中间结果的 producedBy 必须出现在 dependsOn；output 中每个对象的 producedBy 必须是本节点。
- `process`：`{ description, code?, mappings?, rules: [{ id, text, state }], errors: string[] }`。state 可以是 proposed / observed / unresolved。可用短 code 展示关键操作；mappings 为 `[{from, operation, to}]`，逐字段说明转换。
- `trace`：`[{ id, label, before, operation, after }]`，逐次列出中间数据如何改变。
- `questions`：`[{ id, field, text, impact }]`，只记录影响当前实现的真实未定问题。
- `evidence`：可选的源码位置 `[{ path, line, description }]`。用于 agent 追踪实现，不另设界面模式。

## 每个输出的来源与处理步骤

新模型的 process.derivations 应覆盖全部输出，每个输出恰好一项：

```json
{
  "id": "build-nav-chart",
  "outputId": "nav-chart",
  "inputIds": ["daily-account", "backtest-settings"],
  "steps": [
    "取出每个交易日的账户金额和原始投入资金。",
    "将每日金额除以投入资金，得到可比较的单位净值。",
    "按交易日顺序连接这些值，形成净值曲线。"
  ],
  "traceIds": ["unit-nav"]
}
```

outputId 必须在本环节 output.artifactIds 中，inputIds 必须是本环节真实使用的输入。steps 默认展示，推荐 2—5 个简短步骤，不堆叠多个处理动作或原始字段。traceIds 指向该输出相关的原始值变化，折叠查看。

默认页先展示环节概览，点击进入详情后按所选输出绘制准确连线。输入输出默认只显示 name / summary，字段表和 JSON 默认折叠。原有 v2 模型不强制迁移；单输出可使用节点级说明，多输出缺少 derivations 时标记来源未拆分，不猜测连线。

批注使用 nodeId 和 field 定位。field 可为 input / process / output / artifact:<id> / derivation:<id> / trace:<id> / rule:<id> / question:<id>。artifact 必须在该节点输入或输出中。切换视图与输出不能丢失其他位置的批注和未提交草稿。

```json
{
  "schemaVersion": 1,
  "projectId": "ipo-dev",
  "projectRevision": 3,
  "version": 0,
  "comments": [
    {
      "id": "unique-note-id",
      "nodeId": "render-dom",
      "field": "artifact:embedded-html",
      "body": "把两个 JSON 数据块都展开显示。",
      "createdAt": "2026-10-19T08:00:00Z",
      "agentReply": ""
    }
  ]
}
```

HTML 中 `ipo-model` 与 `ipo-feedback` 两个 application/json script 元素分别嵌入模型和备注。解析 textContent 为 JSON；不要执行页面脚本。JSON 内的 `<` 应编码为 `\u003c`。

`feedback.json` 是本机保存服务的同步文件。`version` 用于避免旧窗口覆盖新备注；它不是用户审批状态。保留旧备注；锚点已不存在的备注显示在页面末尾，不能静默丢弃。

PUT `/api/feedback` 使用本机服务返回的 `x-ipo-token`，请求体为 `{ baseVersion, feedback }`。保存成功后，JSON 和 HTML 都含有同一份备注。重新生成也必须保留已有备注。
