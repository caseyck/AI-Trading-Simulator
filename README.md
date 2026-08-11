# AI Trading Simulator

V0.2 是一个无需后端、无需安装依赖的纯模拟 BTC 交易网页。

## 运行

直接用浏览器打开 `index.html` 即可开始。

## 功能

- 使用 10,000 美元初始资金进行 BTC 买卖
- 0.1% 模拟手续费，买卖双向计算
- 实时计算现金、BTC 持仓、总资产、收益率
- 显示平均持仓成本、持仓盈亏和盈亏百分比
- 支持 Stop Loss 与 Take Profit 风险控制
- 推进模拟日期，并保存交易发生日期
- 提供 Buy & Hold Benchmark 对比
- Canvas 绘制价格走势，并修复 resize 后图表重绘问题
- 保存本次页面会话中的交易记录

这是一个纯模拟系统：
- 不连接真实交易所
- 不使用 API Key
- 不执行真实交易
- 不需要后端或数据库

刷新页面会重置模拟数据。

## 版本路线

- V0.1：基础随机行情模拟
- V0.2：账户、手续费、持仓成本、风险控制、Benchmark
- V0.3：真实历史 BTC 行情数据
- V0.4：策略引擎与回测
- V0.5：AI 决策层

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
