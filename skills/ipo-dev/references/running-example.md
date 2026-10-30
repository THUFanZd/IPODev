# Running example 页面接口

播放器使用随包 GSAP，不依赖 CDN、构建工具或其他 skill。agent 在输出目录编写下面四个文件，再运行 build-running.mjs。生成的 HTML 可离线打开；本机服务额外把批注写回磁盘。

## story.json：内容与阅读时刻

```json
{
  "schemaVersion": 1,
  "id": "当前流程的稳定ID",
  "revision": 1,
  "title": "用具体内容说明要看什么",
  "subtitle": "一句话交代目标",
  "duration": 24,
  "canvas": {"width": 1080, "height": 500, "mobileWidth": 540, "mobileHeight": 580},
  "example": {
    "sampleKind": "illustrative",
    "summary": "这个具体例子是什么",
    "initial": {"content": "具体输入，任意 JSON 结构"},
    "result": {"content": "具体输出，任意 JSON 结构"},
    "assumptions": ["影响结果的设计假设，可为空数组"]
  },
  "cues": [
    {"id": "start", "time": 0, "label": "原始内容", "title": "眼前有什么", "caption": "关键对象及来源", "details": {"source": "原始材料"}},
    {"id": "finish", "time": 24, "label": "结果", "title": "得到了什么", "caption": "结果含义", "details": {"reason": "处理依据"}}
  ]
}
```

这是接口示例，不是要求只写两个时刻，也没有推荐数量或时长。cues 的 time 严格递增，包含 0 和 duration；label 用简短可读名称。cue 是时间线上的阅读位置，不是进入另一页面的导航。

example.initial/result/details 可用任意领域结构，不要求拆成 IPO 节点。中间数据、完整 Prompt、模型示例响应、计算和来源保存在相关 cue.details；scene.js 可从这些值计算画面。参与当前变化的具体内容仍须在主画面可见，必要时节选呈现；details 用于补充完整原文和技术细节，不能成为关键案例内容的唯一入口。初始与最终数值必须和画面一致。

## 自由场景

`scene.html` 是画布内部 HTML/SVG 片段。用稳定 ID 或 `data-object-id` 标记跨时刻持续存在的对象。对象可用 `data-object-label` 提供可读批注名称。`scene.css` 自由定义排版，选择器限定在 `#world` 内或使用专属类名，不覆盖播放器的 button、input、dialog 全局样式。可用 `:root{--page-bg:...;--accent:...;--ink:...;--muted:...}` 调整外框风格。不要把外部脚本、字体或图片作为必要依赖。

`scene.js` 定义函数：

```js
window.designExample = function ({timeline, gsap, world, story, mobile}) {
  const object = world.querySelector('[data-object-id="piece"]');
  // scene.html 自己定义 piece，其内容应来自当前案例。
  gsap.set(object, {left: mobile ? 30 : 100, top: 100, opacity: 1});
  timeline.to(object, {left: mobile ? 300 : 700, duration: 2, ease: 'power2.inOut'}, 4);
  // 按流程继续编排拆分/筛选/变形/计算等，不只移动文本框。
};
```

播放器创建 paused timeline 并用空动画撑到 story.duration。designExample 只设置初始状态和添加动画。mobile 表示窄画布，可在相同时间点使用不同坐标/字号。canvas 为逻辑尺寸，播放器负责缩放；主内容在最终显示尺寸下应清楚可读，窄屏尤其要核对实际字号，不把桌面画面简单缩小。必要时减少同屏辅助内容、增大字号或调整纵向布局。

场景内可放链接、按钮和详情弹窗；交互元素保留可访问名称和键盘操作，纯装饰元素可单独 aria-hidden。隐藏的交互内容用 autoAlpha/visibility 一并隐藏，避免只设 opacity 后仍可聚焦。不要给整个场景设 aria-hidden。

### 可倒拖的实现要点

- 所有可见状态由 timeline.time(t) 决定。用 gsap.set 给对象初始位置、大小、透明度，用 timeline.to/fromTo 在绝对时刻编排。任意拖动不依赖先播放之前的过程。
- 同一批 DOM 对象保留到底，消失用 opacity/visibility；不要在 onComplete/onStart 中增删 DOM、累加数值或改变内容。不同文字预建元素再控制显隐，或用纯函数 onUpdate 从当前时间计算，并支持反向恢复。
- 尺寸变化的容器中，避免把 top:50% 与后续像素 tween 混用；显式设置各时段坐标，验证倒拖。
- 最后一个变化不超过 duration。不要自行 play、repeat、注册计时器或创建另一套播放头。自定义资源需要清理时可返回清理函数，播放器重建时调用。
- 案例筛选、求和、排序等从同一份数据推导；模型响应注明是否示意，不假装真的执行模型。

## 生成与预览

```sh
node <skill>/scripts/build-running.mjs --project <目录> --output data.html
node <skill>/scripts/serve-running.mjs --project <目录> --output data.html --port 4341
```

构建器只读取四个源文件与随包播放器，输出指定 HTML 和 feedback.json，不调用模型。--output 接受输出目录内的 HTML 文件名，可自行命名；构建和服务使用相同参数，省略时默认 index.html。生成页包含全部脚本样式。本机服务仅监听 127.0.0.1，根路径与指定文件名均可访问，批注写回所选文件。

## 批注与再次修改

用户在当前时间点点击“批注”，可选关联对象。页面暂停，记录 cueId、time、objectId；服务写入 HTML 的 running-feedback JSON 与 feedback.json；离线时点击“保存 HTML 副本”。本地草稿也会保留，但交回 agent 的应是已保存 HTML 或 feedback.json。

running-story 保存 story 原文；running-feedback 格式：

```json
{"schemaVersion":1,"projectId":"流程ID","projectRevision":1,"version":0,"comments":[{"id":"稳定批注ID","cueId":"start","time":0,"objectId":"可选对象ID","body":"用户意见","createdAt":"ISO 时间","agentReply":"agent 后续实际修改说明，可选"}]}
```

重构时保留旧批注，已移除对象/时刻的批注仍显示原位置文字。story.id 不随标题改变，大改后 revision 递增。修改前停服务，重建后重启；服务拒绝覆盖外部已修改的文件。

## 最小验收

浏览器打开生成页：起点有具体内容；中间处理由图形表达；终点准确；任意拖到中间、终点再倒拖，画面一致；播放/暂停/重播可用；完整 Prompt/数据按需查看；在中间时刻添加批注并刷新核对。检查桌面与窄屏截图。未完成验证如实说明。

旧版 schema v2、render.mjs、serve.mjs 仅维护旧产物，format.md / process-visuals.md 的说明不约束新页面。
