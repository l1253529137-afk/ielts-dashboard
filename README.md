# 雅思冲刺学习网页

这是一个本地优先的雅思学习仪表盘，包含每日计划、单词背诵、阅读复盘、听力练习、写作点评和模考记录。

## 本地运行

```bash
pnpm install
pnpm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

## 发布到 GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `ielts-dashboard`。
2. 在本地项目目录初始化并推送：

```bash
git init
git add .
git commit -m "Initial IELTS dashboard"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/ielts-dashboard.git
git push -u origin main
```

3. 构建静态网页并推送到 `gh-pages` 分支。
4. 打开 GitHub 仓库页面，进入 `Settings` -> `Pages`。
5. 在 `Build and deployment` 里选择 `Deploy from a branch`，分支选择 `gh-pages`，目录选择 `/root`。
6. 发布地址通常是：

```text
https://你的GitHub用户名.github.io/ielts-dashboard/
```

如果仓库名是 `你的GitHub用户名.github.io`，发布地址会是：

```text
https://你的GitHub用户名.github.io/
```

## 使用说明

- 每个访问者的数据都保存在自己的浏览器 `localStorage` 中。
- 不同用户之间不会共享学习记录。
- 换设备或清理浏览器数据前，建议先点页面右上角导出学习数据。
- 网盘资料链接是否可打开，取决于原百度网盘分享是否有效，以及访问者是否有权限查看。
