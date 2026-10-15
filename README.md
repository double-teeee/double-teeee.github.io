# Te Liu Portfolio

正式网址：https://te-liu-portfolio.github.io/

刘特个人作品集网站 v1。网站采用纯 HTML、CSS 和少量原生 JavaScript，不需要安装依赖或运行构建工具。

## 目录

- `dist/index.html`：首页
- `dist/work/index.html`：作品索引与筛选
- `dist/work/*/index.html`：七个案例页面
- `dist/assets/css/site.css`：全部视觉样式
- `dist/assets/js/site.js`：导航、滚动出现、微信复制与作品筛选
- `dist/assets/images`：已压缩的响应式 WebP 图片

## 本地查看

在 `portfolio-site/dist` 中启动任意静态文件服务器，然后打开根地址。不要直接双击 HTML 检查全部功能，因为筛选 URL 和站内路径在服务器环境下更可靠。

## 内容更新原则

1. 原始 PSB、Keynote、PDF 与大尺寸 PNG 保留在网站目录之外。
2. 新图片使用小写英文和连字符命名，并提供 640 与 1200 像素版本；案例大图额外提供 1800 像素版本。
3. 未确认执行状态或数据的提案，不新增传播结果或量化描述。
4. 当前保留页面的 `noindex` 和 `robots.txt` 的 `Disallow: /`，减少搜索收录；这不限制招聘方通过链接直接访问，也不是访问权限控制。

## 发布

网站通过 GitHub Pages 发布，发布目录为 `dist`，无需安装依赖或构建。

1. 仓库使用 `main` 分支。在 GitHub 的 Settings → Pages 中将发布来源设为 GitHub Actions。
2. 修改 `dist` 后，在本地预览并检查，再将确认的改动提交并推送至 `main`。
3. `.github/workflows/pages.yml` 会自动部署。等待 Actions 成功后，检查正式网址。
4. 如需恢复旧版，撤销对应内容提交并推送；部署流程会重新发布恢复后的内容。

公开仓库只保存网页代码、已优化的网站素材和测试。原始设计文件、`source-media`、临时截图与本地托管配置不上传。

本地回归检查：`node tests/project-return.test.cjs`。
