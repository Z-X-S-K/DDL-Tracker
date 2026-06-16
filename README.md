# ApplyOS · JD / PhD / Kairesa

这是一个可直接部署到 GitHub Pages 的静态网站。

## 文件

- `index.html`：网站页面
- `styles.css`：黑白极简样式
- `script.js`：本地打卡、10天总结、恢复日历生成逻辑
- `data.js`：25个10天周期、JD T10/11时间、LSAT节点、关键deadline
- `plan.ics`：主计划订阅日历，包含10天提醒、LSAT节点、JD学校级开放/ED/Regular节点
- `404.html`：GitHub Pages fallback
- `.nojekyll`：关闭 Jekyll 处理

## 使用方式

1. 把这些文件上传到仓库根目录。
2. GitHub → Settings → Pages → Deploy from branch → main / root。
3. 打开网站后，点击「订阅主计划」。
4. 每天在网站打卡，只填写当天任务类型相关字段。
5. 每10天收到主日历提醒后，在网站完成总结；必要时生成恢复日历。

## 日历逻辑

- 主计划日历：硬 deadline、内部申请节点、每10天第9天收尾提醒、第10天复盘提醒。
- 恢复日历：根据本浏览器 localStorage 打卡记录生成，按需导入，不建议每天导入。

## 注意

打卡数据只保存在当前浏览器。换手机/电脑不会自动同步。请定期导出 JSON 或 CSV 备份。
