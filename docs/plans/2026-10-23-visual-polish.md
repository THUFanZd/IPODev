# IPODev frontend polish implementation plan

**Goal:** 提高现有 IPO 页面可读性与视觉层级，不增加功能、不改变模型和批注协议。

**Architecture:** 只调整独立 HTML 模板的样式和展示文案，保留全部锚点、数据属性和事件处理。无需外部字体、依赖或运行时网络请求。

**Tech Stack:** 现有 HTML/CSS/JavaScript、Node.js 测试、浏览器验证。

## Design

- 继续绿色方向：底色 #f3f5f2、纸面 #ffffff、正文 #1e3028、辅助文字 #58695f、强调 #285b43、边界 #d3ddd5。
- 中文使用本机无衬线字体；标题 28–36px、卡片标题 17–20px、正文 15px、辅助信息 12–13px。数据和路径使用等宽字体。
- 总览：左对齐标题与目标，下方环节卡片体现输入→输出；强调顺序，不增加装饰性英文标签。
- 详情：收紧页头，输入／处理／输出三列。处理区拥有明确标题，与输出选中态、来源连线共同表达当前关系。示例变化使用“变化前／操作／变化后”的连续层级。
- 桌面保留来源连线；窄屏纵向排列，折叠原始数据。只保留用户触发的过渡，尊重减少动态效果偏好。

## Steps

1. 修改 skills/ipo-dev/assets/review.html：统一 CSS tokens 与组件层级，简化说明文案；不改变数据或批注逻辑。
2. 运行 node --test tests/core.test.mjs tests/presentation.test.mjs tests/running-example.test.mjs。
3. 用旧模型及 running-example 测试案例生成独立预览；检查总览、说明详情、示例、原始数据展开、批注保存与切换草稿、窄屏溢出和正文对比。截图确认后同步模板到用户项目；不覆盖现有反馈与任务模型。

已有功能已先提交并推送：4127c2b8f68c9fb47a6607030e66b48a8981289a。
