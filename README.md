# Kairesa Learn · ApplyOS

GitHub Pages 静态网站。上传根目录文件即可。

## 文件
- `index.html`：网站主体、UI、功能、数据全部内嵌。
- `plan.ics`：主计划日历订阅文件。
- `404.html`：GitHub Pages 备用页面。
- `.nojekyll`：避免 GitHub Pages 处理下划线等静态资源。

## 使用
1. 解压 `kairesa-learn-upload-root.zip`。
2. 把里面所有文件上传到 GitHub 仓库根目录。
3. GitHub Pages 设置为 `Deploy from branch → main → /root`。
4. 部署后打开网站，点击“订阅主日历”。

## 逻辑
- 主日历：硬 deadline + 每 10 天第 9 天收尾提醒 + 第 10 天复盘提醒。
- 今日打卡：只显示当天任务类型相关字段。
- 恢复日历：每 10 天或严重落后时手动生成。
- 数据：保存在当前浏览器 localStorage，可导出 JSON / CSV。
