# AI Trading Simulator

V0.1 是一个无需后端、无需安装依赖的 BTC 模拟交易网页。

## 运行

直接用浏览器打开 `index.html` 即可开始。

## 功能

- 使用 10,000 美元初始资金进行 BTC 买卖
- 每次点击“下一天”随机生成 -6% 到 +6% 的价格变化
- 实时计算现金、BTC 持仓、总资产和收益率
- Canvas 绘制价格走势
- 保存本次页面会话中的交易记录

刷新页面会重置模拟数据。

## 发布到 Vercel

项目已包含 `vercel.json`，不需要构建命令或环境变量。

1. 把项目推送到 GitHub。
2. 在 Vercel 中选择 **Add New → Project**，导入该仓库。
3. Framework Preset 选择 **Other**，保持 Build Command 和 Output Directory 为空。
4. 点击 **Deploy**。获得 HTTPS 地址后，可直接在微信中打开或分享。

也可以在已安装 Vercel CLI 的环境中运行 `vercel --prod`。

## 发布到 GitHub Pages

项目包含 `.github/workflows/pages.yml`。推送到 `main` 后，在 GitHub 仓库的
**Settings → Pages → Build and deployment** 中把 Source 设为 **GitHub Actions**，
工作流会自动发布静态站点。

> 微信访问需要公网 HTTPS 地址；直接打开本地 `index.html` 只适用于本机测试。
