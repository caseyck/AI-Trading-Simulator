"use strict";

const INITIAL_CASH = 10000;
const INITIAL_PRICE = 100000;
const FEE_RATE = 0.001;
const DEFAULT_STOP_LOSS = 5;
const DEFAULT_TAKE_PROFIT = 10;
const DAILY_MOVE_RANGE = 0.12;
const START_DATE = new Date(2024, 0, 1);

const state = {
  day: 1,
  cash: INITIAL_CASH,
  btc: 0,
  price: INITIAL_PRICE,
  prices: [INITIAL_PRICE],
  trades: [],
  feeRate: FEE_RATE,
  stopLossPercent: DEFAULT_STOP_LOSS,
  takeProfitPercent: DEFAULT_TAKE_PROFIT,
  simulationDate: new Date(START_DATE),
  positionCostBasis: 0
};

const elements = {
  day: document.querySelector("#day"),
  simDate: document.querySelector("#simDate"),
  currentPrice: document.querySelector("#currentPrice"),
  dailyChange: document.querySelector("#dailyChange"),
  cash: document.querySelector("#cash"),
  btcAmount: document.querySelector("#btcAmount"),
  totalAssets: document.querySelector("#totalAssets"),
  returnRate: document.querySelector("#returnRate"),
  positionQty: document.querySelector("#positionQty"),
  avgCost: document.querySelector("#avgCost"),
  positionPnl: document.querySelector("#positionPnl"),
  positionPnlPercent: document.querySelector("#positionPnlPercent"),
  strategyReturn: document.querySelector("#strategyReturn"),
  benchmarkReturn: document.querySelector("#benchmarkReturn"),
  benchmarkStatus: document.querySelector("#benchmarkStatus"),
  excessReturn: document.querySelector("#excessReturn"),
  tradeAmount: document.querySelector("#tradeAmount"),
  stopLossInput: document.querySelector("#stopLossInput"),
  takeProfitInput: document.querySelector("#takeProfitInput"),
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function formatSignedPercent(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function totalAssets() {
  return state.cash + state.btc * state.price;
}

function benchmarkValue() {
  const benchmarkBtc = INITIAL_CASH / INITIAL_PRICE;
  return benchmarkBtc * state.price;
}

function strategyReturnRate() {
  return ((totalAssets() - INITIAL_CASH) / INITIAL_CASH) * 100;
}

function benchmarkReturnRate() {
  return ((benchmarkValue() - INITIAL_CASH) / INITIAL_CASH) * 100;
}

function averagePositionCost() {
  return state.btc > 0 ? state.positionCostBasis / state.btc : 0;
}

function averagePositionPnl() {
  return state.btc > 0 ? state.btc * state.price - state.positionCostBasis : 0;
}

function averagePositionPnlPercent() {
  if (state.positionCostBasis <= 0) return 0;
  return (averagePositionPnl() / state.positionCostBasis) * 100;
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

function recordTrade({ type, amount, price, fee = 0, value = amount * price, exitReason = "" }) {
  state.trades.unshift({
    date: formatDate(state.simulationDate),
    day: state.day,
    type,
    price,
    amount,
    fee,
    value,
    exitReason
  });
}

function buy() {
  const amount = readAmount();
  if (amount === null) return;

  const gross = amount * state.price;
  const fee = gross * state.feeRate;
  const totalCost = gross + fee;

  if (totalCost > state.cash + 1e-8) {
    setMessage(`现金不足，本次买入需要 ${money.format(totalCost)}（含 ${money.format(fee)} 手续费）。`, "error");
    return;
  }

  state.cash -= totalCost;
  state.btc += amount;
  state.positionCostBasis += totalCost;
  recordTrade({ type: "买入", amount, price: state.price, fee, value: gross });
  elements.tradeAmount.value = "";
  setMessage(`成功买入 ${amount.toFixed(6)} BTC，手续费 ${money.format(fee)}。`, "success");
  render();
}

function sell() {
  const amount = readAmount();
  if (amount === null) return;
  if (amount > state.btc + 1e-10) {
    setMessage(`BTC 不足，当前持有 ${state.btc.toFixed(6)} BTC。`, "error");
    return;
  }

  const gross = amount * state.price;
  const fee = gross * state.feeRate;
  const net = gross - fee;

  state.cash += net;
  const remainingBtc = state.btc - amount;
  if (remainingBtc > 1e-10) {
    const ratio = remainingBtc / state.btc;
    state.positionCostBasis *= ratio;
  } else {
    state.positionCostBasis = 0;
  }

  state.btc = remainingBtc < 1e-10 ? 0 : remainingBtc;
  recordTrade({ type: "卖出", amount, price: state.price, fee, value: gross });
  elements.tradeAmount.value = "";
  setMessage(`成功卖出 ${amount.toFixed(6)} BTC，手续费 ${money.format(fee)}。`, "success");
  render();
}

function closePosition(reason) {
  if (state.btc <= 1e-10) return false;

  const amount = state.btc;
  const gross = amount * state.price;
  const fee = gross * state.feeRate;
  const net = gross - fee;
  state.cash += net;
  state.positionCostBasis = 0;
  state.btc = 0;

  recordTrade({
    type: "卖出",
    amount,
    price: state.price,
    fee,
    value: gross,
    exitReason: reason
  });

  setMessage(`价格触发 ${reason}，已自动平仓 ${amount.toFixed(6)} BTC。`, "warning");
  render();
  return true;
}

function evaluateRiskExit() {
  if (state.btc <= 1e-10) return false;

  const avgCost = averagePositionCost();
  if (avgCost <= 0) return false;

  const stopLossTrigger = avgCost * (1 - state.stopLossPercent / 100);
  const takeProfitTrigger = avgCost * (1 + state.takeProfitPercent / 100);

  if (state.price <= stopLossTrigger) {
    closePosition("STOP LOSS");
    return true;
  }

  if (state.price >= takeProfitTrigger) {
    closePosition("TAKE PROFIT");
    return true;
  }

  return false;
}

function nextDay() {
  const previousPrice = state.price;
  const changeRate = (Math.random() * DAILY_MOVE_RANGE) - (DAILY_MOVE_RANGE / 2);
  state.price = Math.max(1000, previousPrice * (1 + changeRate));
  state.day += 1;
  state.simulationDate.setDate(state.simulationDate.getDate() + 1);
  state.prices.push(state.price);

  if (evaluateRiskExit()) {
    return;
  }

  setMessage(`市场进入第 ${state.day} 天，BTC ${changeRate >= 0 ? "上涨" : "下跌"} ${Math.abs(changeRate * 100).toFixed(2)}%。`);
  render(changeRate);
}

function updateRiskSettings() {
  state.stopLossPercent = clampNumber(elements.stopLossInput.value, 0, 100, DEFAULT_STOP_LOSS);
  state.takeProfitPercent = clampNumber(elements.takeProfitInput.value, 0, 100, DEFAULT_TAKE_PROFIT);
  elements.stopLossInput.value = state.stopLossPercent.toFixed(1);
  elements.takeProfitInput.value = state.takeProfitPercent.toFixed(1);
}

function renderStats(changeRate) {
  const assets = totalAssets();
  const returnRate = ((assets - INITIAL_CASH) / INITIAL_CASH) * 100;
  const positionPnlValue = averagePositionPnl();
  const positionPnlPercentValue = averagePositionPnlPercent();
  const benchmarkPct = benchmarkReturnRate();
  const strategyPct = strategyReturnRate();
  const excessPct = strategyPct - benchmarkPct;

  elements.day.textContent = state.day;
  elements.simDate.textContent = formatDate(state.simulationDate);
  elements.currentPrice.textContent = money.format(state.price);
  elements.cash.textContent = money.format(state.cash);
  elements.btcAmount.textContent = `${state.btc.toFixed(6)} BTC`;
  elements.totalAssets.textContent = money.format(assets);
  elements.returnRate.textContent = formatSignedPercent(returnRate);
  elements.returnRate.className = returnRate > 0 ? "positive" : returnRate < 0 ? "negative" : "";

  elements.positionQty.textContent = `${state.btc.toFixed(6)} BTC`;
  elements.avgCost.textContent = state.btc > 0 ? money.format(averagePositionCost()) : money.format(0);
  elements.positionPnl.textContent = money.format(positionPnlValue);
  elements.positionPnl.className = positionPnlValue > 0 ? "positive" : positionPnlValue < 0 ? "negative" : "";
  elements.positionPnlPercent.textContent = formatSignedPercent(positionPnlPercentValue);
  elements.positionPnlPercent.className = positionPnlPercentValue > 0 ? "positive" : positionPnlPercentValue < 0 ? "negative" : "";

  elements.strategyReturn.textContent = formatSignedPercent(strategyPct);
  elements.strategyReturn.className = strategyPct > 0 ? "positive" : strategyPct < 0 ? "negative" : "";
  elements.benchmarkReturn.textContent = formatSignedPercent(benchmarkPct);
  elements.benchmarkReturn.className = benchmarkPct > 0 ? "positive" : benchmarkPct < 0 ? "negative" : "";
  elements.excessReturn.textContent = formatSignedPercent(excessPct);
  elements.excessReturn.className = excessPct > 0 ? "positive" : excessPct < 0 ? "negative" : "";

  if (strategyPct > benchmarkPct) {
    elements.benchmarkStatus.textContent = "跑赢 Benchmark";
    elements.benchmarkStatus.className = "positive";
  } else if (strategyPct < benchmarkPct) {
    elements.benchmarkStatus.textContent = "跑输 Benchmark";
    elements.benchmarkStatus.className = "negative";
  } else {
    elements.benchmarkStatus.textContent = "持平";
    elements.benchmarkStatus.className = "";
  }

  if (typeof changeRate === "number") {
    elements.dailyChange.textContent = `${changeRate >= 0 ? "+" : ""}${(changeRate * 100).toFixed(2)}% 今日`;
    elements.dailyChange.className = changeRate >= 0 ? "positive" : "negative";
  }
}

function renderHistory() {
  if (state.trades.length === 0) {
    elements.tradeHistory.innerHTML = '<tr class="empty-row"><td colspan="7">暂无交易记录</td></tr>';
    return;
  }

  elements.tradeHistory.innerHTML = state.trades.map((trade) => {
    const actionClass = trade.type === "买入" ? "trade-buy" : "trade-sell";
    const exitLabel = trade.exitReason ? ` · ${trade.exitReason}` : "";

    return `
      <tr>
        <td>${trade.date}</td>
        <td>第 ${trade.day} 天</td>
        <td class="${actionClass}">${trade.type}${exitLabel}</td>
        <td>${money.format(trade.price)}</td>
        <td>${trade.amount.toFixed(6)}</td>
        <td>${money.format(trade.value)}</td>
        <td>${money.format(trade.fee)}</td>
      </tr>
    `;
  }).join("");
}

function drawChart() {
  const canvas = elements.canvas;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));

  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
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

window.addEventListener("resize", () => drawChart());
document.querySelectorAll("[data-ratio]").forEach((button) => {
  button.addEventListener("click", () => {
    const ratio = Number(button.dataset.ratio);
    const maxBuyAmount = state.cash / state.price;
    elements.tradeAmount.value = (maxBuyAmount * ratio).toFixed(6);
    setMessage(`已按现金的 ${(ratio * 100).toFixed(0)}% 填入可买数量。`);
  });
});

 elements.stopLossInput.addEventListener("change", updateRiskSettings);
 elements.takeProfitInput.addEventListener("change", updateRiskSettings);

updateRiskSettings();
render();
