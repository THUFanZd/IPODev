# 自由设计 P 的图解与演示

> 旧版维护说明。这里的“只在 P 内设计”和 I/O 布局要求仅适用于旧 IPO 页面；新任务使用 running-example.md 的自由画布和时间线。

只在 P 内设计。I/O 的布局、内容、输入出处和批注逻辑沿用现有模板。

## 先选表达，再写画面

先明确这个输出中最值得看见的变化，再决定画什么。筛选可以是对象离开集合，聚合可以是多个量汇入结果，字段映射可以是对应位置的变化；算法也可以用坐标、矩阵、树、代码片段或其他适合内容的表达。这些是创作提示，不是内置图形枚举。

说明视图解释处理关系；具体示例视图用同一组具体值演示。每一帧只突出当前动作，旁边保留一句动作／结果含义。涉及术语先解释。不要为了播放拉长简单过程；一个静态画面足够时用一帧。

## 接入方式

在 `process.derivations[]` 与具体示例的 `runningExample.steps[].outputs[]` 上分别添加 `visual`：

```json
{
  "css": "[data-scene]{height:260px}.item{position:absolute;padding:12px;background:#e5eddf;border-radius:7px}",
  "frames": [
    {"id":"before","title":"检查付款状态","caption":"已取消的订单不参与付款金额汇总。","html":"<div data-key=\"paid\" class=\"item\" style=\"left:10%;top:50px\">已付款 120 元</div><div data-key=\"cancelled\" class=\"item\" style=\"left:10%;top:140px\">已取消 50 元</div>"},
    {"id":"after","title":"保留有效订单","caption":"留下 120 元，下一环节只对留下的金额求和。","html":"<div data-key=\"paid\" class=\"item\" style=\"left:25%;top:95px\">已付款 120 元</div>","holdMs":3000}
  ]
}
```

- `css` 是该演示内部的样式字符串，运行在 Shadow DOM 中，不改页面或 I/O。画面根为 `[data-scene]`；显式设置适当高度，内部用百分比、viewBox 或响应式布局适应约 280—480px 宽的 P 区域。
- `frames` 至少一项，每项有稳定且唯一的 `id`、简短 `title`、可读 `caption` 和自由创作的 `html`。支持常见文本、表格和内联 SVG 图形。模板只提供画布与控件，不规定图形排版。
- `data-key` 标识同一数据对象；相邻帧同名对象会平滑移动／缩放，并过渡颜色与透明度。对象名称、含义应保持连续。在每帧内唯一，标在最合适的一层；避免同时给父子元素加 key。不要给 keyed 元素自己加 CSS transform／animation，必要时加一个 wrapper。
- 新对象淡入，消失对象淡出。动画约 650ms，使用缓出曲线；画面落定后保持静止。它表达数据关系，不承担阅读时间。
- `holdMs` 是点击播放后的停留时长，默认 2800ms，可设 1200—30000ms；文字稍长时增加。默认不播放；上一步／下一步／进度标记可跳转，播放可暂停，最终帧停住；重播从头开始。不自动循环。
- 新增批注定位到帧：说明为 `visual:<derivationId>:<frameId>`，示例为 `example:visual:<outputId>:<frameId>`。打开批注时暂停；切换帧保留草稿。原 derivation / change 批注保留在折叠文字中，有旧批注时默认展开。
- 只使用本地 HTML / SVG / CSS。脚本、事件处理器、外部资源和嵌套网页不会作为图解执行；无需新框架、视频服务或登录。SVG paint server 使用本地 `url(#id)`。静态或减少动态效果模式仍须可读。

`steps`、`changes` 和原始 trace 仍保留可解析的处理依据，与画面、数值和最终输出一致。不要把示意计算标成实际执行。

## 可运行的丝滑转场示例

`assets/process-example.mjs` 是独立、自包含的创作参考：用三笔订单演示筛选、金额提取与汇总、结果写入摘要；说明视图与具体示例各有自己的画面。它演示稳定对象、进出场和版式变化，不要求所有任务套用订单或同一种图形。

```sh
node <skill>/assets/process-example.mjs --project <新的示例目录>
node <skill>/scripts/render.mjs --project <新的示例目录>
node <skill>/scripts/serve.mjs --project <新的示例目录> --port 4331
```

生成器拒绝覆盖已有项目。创作新任务时，阅读示例中的 CSS／frame 写法，再按该任务的数据与机制重做图形。优先让物体的位置、数量、连接或大小表达变化，去掉重复文字和装饰。

交付前在浏览器检查：初始静止、前后跳转、播放／暂停／重播、快速点击和模式／输出切换；批注草稿及保存；桌面与窄屏的文字、图形无溢出。减少动态效果时跳过位移，直接呈现各帧。
