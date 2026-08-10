"use strict";

const INITIAL_CASH = 10000;
const INITIAL_PRICE = 100000;

const state = {
  day: 1,
  cash: INITIAL_CASH,
  btc: 0,
  price: INITIAL_PRICE,
  prices: [INITIAL_PRICE],
  trades: []
};

const elements = {
  day: document.querySelector("#day"),
  currentPrice: document.querySelector("#currentPrice"),
  dailyChange: document.querySelector("#dailyChange"),
  cash: document.querySelector("#cash"),
  btcAmount: document.querySelector("#btcAmount"),
  totalAssets: document.querySelector("#totalAssets"),
  returnRate: document.querySelector("#returnRate"),
  tradeAmount: document.querySelector("#tradeAmount"),
  buyButton: document.querySelector("#buyButton"),
  sellButton: document.querySelector("#sellButton"),
  nextDayButton: document.querySelector("#nextDayButton"),
  message: document.querySelector("#message"),
  tradeHistory: document.querySelector("#tradeHistory"),
  canvas: document.querySelector("#priceChart")
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

function totalAssets() {
  return state.cash + state.btc * state.price;
}

function setMessage(text, type = "") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function readAmount() {
  const amount = Number(elements.tradeAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage("请输入大于 0 的有效 BTC 数量。", "error");
    return null;
  }
  return amount;
}

function recordTrade(type, amount) {
  state.trades.unshift({
    day: state.day,
    type,
    price: state.price,
    amount,
    value: amount * state.price
  });
}

function buy() {
  const amount = readAmount();
  if (amount === null) return;
  const cost = amount * state.price;
  if (cost > state.cash + 1e-8) {
    setMessage(`现金不足，本次买入需要 ${money.format(cost)}。`, "error");
    return;
  }
  state.cash -= cost;
  state.btc += amount;
  recordTrade("买入", amount);
  elements.tradeAmount.value = "";
  setMessage(`成功买入 ${amount.toFixed(6)} BTC。`, "success");
  render();
}

function sell() {
  const amount = readAmount();
  if (amount === null) return;
  if (amount > state.btc + 1e-10) {
    setMessage(`BTC 不足，当前持有 ${state.btc.toFixed(6)} BTC。`, "error");
    return;
  }
  state.cash += amount * state.price;
  state.btc -= amount;
  if (state.btc < 1e-10) state.btc = 0;
  recordTrade("卖出", amount);
  elements.tradeAmount.value = "";
  setMessage(`成功卖出 ${amount.toFixed(6)} BTC。`, "success");
  render();
}

function nextDay() {
  const previousPrice = state.price;
  const changeRate = (Math.random() * 0.12) - 0.06;
  state.price = Math.max(1000, previousPrice * (1 + changeRate));
  state.day += 1;
  state.prices.push(state.price);
  setMessage(`市场进入第 ${state.day} 天，BTC ${changeRate >= 0 ? "上涨" : "下跌"} ${Math.abs(changeRate * 100).toFixed(2)}%。`);
  render(changeRate);
}

function renderStats(changeRate) {
  const assets = totalAssets();
  const returnRate = ((assets - INITIAL_CASH) / INITIAL_CASH) * 100;
  elements.day.textContent = state.day;
  elements.currentPrice.textContent = money.format(state.price);
  elements.cash.textContent = money.format(state.cash);
  elements.btcAmount.textContent = `${state.btc.toFixed(6)} BTC`;
  elements.totalAssets.textContent = money.format(assets);
  elements.returnRate.textContent = `${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`;
  elements.returnRate.className = returnRate > 0 ? "positive" : returnRate < 0 ? "negative" : "";
  if (typeof changeRate === "number") {
    elements.dailyChange.textContent = `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(2)}% 今日`;
    elements.dailyChange.className = changeRate >= 0 ? "positive" : "negative";
  }
}

function renderHistory() {
  if (state.trades.length === 0) {
    elements.tradeHistory.innerHTML = '<tr class="empty-row"><td colspan="5">暂无交易记录</td></tr>';
    return;
  }
  elements.tradeHistory.innerHTML = state.trades.map((trade) => `
    <tr>
      <td>第 ${trade.day} 天</td>
      <td class="${trade.type === "买入" ? "trade-buy" : "trade-sell"}">${trade.type}</td>
      <td>${money.format(trade.price)}</td>
      <td>${trade.amount.toFixed(6)}</td>
      <td>${money.format(trade.value)}</td>
    </tr>
  `).join("");
}

function drawChart() {
  const canvas = elements.canvas;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 16, bottom: 30, left: 66 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const minPrice = Math.min(...state.prices);
  const maxPrice = Math.max(...state.prices);
  const spread = Math.max(maxPrice - minPrice, maxPrice * 0.02);
  const low = minPrice - spread * 0.25;
  const high = maxPrice + spread * 0.25;

  ctx.clearRect(0, 0, width, height);
  ctx.font = "11px system-ui";
  ctx.fillStyle = "#8e9bb0";
  ctx.strokeStyle = "#263247";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight / 4) * i;
    const labelPrice = high - ((high - low) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`$${Math.round(labelPrice / 1000)}k`, 16, y + 4);
  }

  const points = state.prices.map((price, index) => ({
    x: padding.left + (state.prices.length === 1 ? chartWidth / 2 : (index / (state.prices.length - 1)) * chartWidth),
    y: padding.top + ((high - price) / (high - low)) * chartHeight
  }));

  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, "rgba(245, 185, 66, 0.28)");
    gradient.addColorStop(1, "rgba(245, 185, 66, 0)");
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.beginPath();
  points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = "#f5b942";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = "#f5b942";
  ctx.fill();
  ctx.fillStyle = "#8e9bb0";
  ctx.fillText("第 1 天", padding.left, height - 8);
  ctx.textAlign = "right";
  ctx.fillText(`第 ${state.day} 天`, width - padding.right, height - 8);
  ctx.textAlign = "left";
}

function render(changeRate) {
  renderStats(changeRate);
  renderHistory();
  drawChart();
}

elements.buyButton.addEventListener("click", buy);
elements.sellButton.addEventListener("click", sell);
elements.nextDayButton.addEventListener("click", nextDay);
elements.tradeAmount.addEventListener("keydown", (event) => {
  if (event.key === "Enter") buy();
});
document.querySelectorAll("[data-ratio]").forEach((button) => {
  button.addEventListener("click", () => {
    const ratio = Number(button.dataset.ratio);
    elements.tradeAmount.value = ((state.cash / state.price) * ratio).toFixed(6);
    setMessage(`已按现金的 ${(ratio * 100).toFixed(0)}% 填入可买数量。`);
  });
});
window.addEventListener("resize", drawChart);

render();
