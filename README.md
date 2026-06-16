# ApplyOS · JD / PhD / Kairesa

GitHub Pages 静态网站。新版为单文件主站：`index.html` 内嵌 CSS、JS 和计划数据，避免漏传 `data.js` / `script.js` 后页面停在“加载中”。

## 上传

把本 ZIP 解压后的所有文件直接放到 GitHub 仓库根目录。

需要的核心文件：

- `index.html`：网站本体
- `plan.ics`：主计划日历订阅文件
- `.nojekyll`：避免 GitHub Pages 处理文件
- `404.html`：简单错误页

## 日历

主日历订阅地址部署后为：

```text
https://你的用户名.github.io/仓库名/plan.ics
```

网站按钮会自动生成 `webcal://` 订阅链接。

## 数据

打卡数据只存在当前浏览器 localStorage。网站内可导出 JSON / CSV。
