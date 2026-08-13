"use strict";

const API_BASE = "/api/binance";
const HISTORY_PRICE_LOGIC = "当日 UTC 日线收盘价";
const EARLY_HISTORY_ERROR = "该日期暂无可靠历史价格，请尝试相邻日期。";
const EARLY_STAGE_WARNING = "早期市场流动性可能较低，本结果为理论收益，暂未计入滑点、手续费及市场深度影响。";

const ASSET_CONFIG = {
  btc: {
    symbol: "BTCUSDT",
    label: "BTC",
    name: "Bitcoin",
    chain: "Bitcoin",
    contract: "—",
    earliestReliableDate: "2017-08-17",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "日期早于可靠市场覆盖区间时，系统只显示真实数据，不编造价格。"
  },
  eth: {
    symbol: "ETHUSDT",
    label: "ETH",
    name: "Ethereum",
    chain: "Ethereum",
    contract: "—",
    earliestReliableDate: "2017-08-17",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "日期早于可靠市场覆盖区间时，系统只显示真实数据，不编造价格。"
  },
  doge: {
    symbol: "DOGEUSDT",
    label: "DOGE",
    name: "Dogecoin",
    chain: "Dogecoin",
    contract: "—",
    earliestReliableDate: "2019-07-05",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "日期早于可靠市场覆盖区间时，系统只显示真实数据，不编造价格。"
  },
  sol: {
    symbol: "SOLUSDT",
    label: "SOL",
    name: "Solana",
    chain: "Solana",
    contract: "—",
    earliestReliableDate: "2020-08-11",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "日期早于可靠市场覆盖区间时，系统只显示真实数据，不编造价格。"
  },
  shib: {
    symbol: "SHIBUSDT",
    label: "SHIB",
    name: "Shiba Inu",
    chain: "Ethereum",
    contract: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
    earliestReliableDate: "2021-05-10",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "如果该日期没有可靠现货价格，页面将提示相邻日期重试，不会伪造数据。"
  },
  pepe: {
    symbol: "PEPEUSDT",
    label: "PEPE",
    name: "Pepe",
    chain: "Ethereum",
    contract: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    earliestReliableDate: "2023-05-05",
    historicalSource: "Binance 1d Kline",
    currentSource: "/api/binance",
    earlyMarketWarning: "如果该日期没有可靠现货价格，页面将提示相邻日期重试，不会伪造数据。"
  },
  moodeng: {
    symbol: "MOODENGUSDT",
    label: "MOODENG",
    name: "Moodeng",
    chain: "Solana",
    contract: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY",
    earliestReliableDate: "2024-09-11",
    historicalSource: "Binance 1d Kline (待定向市场验证)",
    currentSource: "/api/binance",
    earlyMarketWarning: "该币种仍需按真实市场覆盖条件验证，缺失可靠价格时不编造。",
    unsupportedMessage: "MOODENG 暂未接入可靠历史数据源，敬请期待。"
  },
  trump: {
    symbol: "TRUMPUSDT",
    label: "TRUMP",
    name: "Official Trump",
    chain: "Solana",
    contract: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    earliestReliableDate: "2025-01-19",
    historicalSource: "Binance 1d Kline (待定向市场验证)",
    currentSource: "/api/binance",
    earlyMarketWarning: "该币种仍需按真实市场覆盖条件验证，缺失可靠价格时不编造。"
  }
};

const COIN_META = ASSET_CONFIG;

const state = {
  selectedCoin: "btc",
  initialAmount: 10000,
  lastDataSource: "Binance"
};

const elements = {
  amountInput: document.querySelector("#amountInput"),
  dateInput: document.querySelector("#dateInput"),
  coinSelect: document.querySelector("#coinSelect"),
  calculateButton: document.querySelector("#calculateButton"),
  statusMessage: document.querySelector("#statusMessage"),
  resultPanel: document.querySelector("#resultPanel"),
  initialValue: document.querySelector("#initialValue"),
  boughtQty: document.querySelector("#boughtQty"),
  holdingStatus: document.querySelector("#holdingStatus"),
  currentValue: document.querySelector("#currentValue"),
  profit: document.querySelector("#profit"),
  returnRate: document.querySelector("#returnRate"),
  multiple: document.querySelector("#multiple"),
  buyDate: document.querySelector("#buyDate"),
  historicalPrice: document.querySelector("#historicalPrice"),
  currentPrice: document.querySelector("#currentPrice"),
  priceUpdatedAt: document.querySelector("#priceUpdatedAt"),
  sourceName: document.querySelector("#sourceName"),
  riskWarning: document.querySelector("#riskWarning")
};

function getAsset(assetKey) {
  return ASSET_CONFIG[assetKey] || ASSET_CONFIG.btc;
}

function isDateBeforeEarliest(asset, dateString) {
  const selectedDate = new Date(`${dateString}T00:00:00Z`);
  const earliestDate = new Date(`${asset.earliestReliableDate}T00:00:00Z`);
  return selectedDate < earliestDate;
}

function shouldShowEarlyRisk(assetKey, dateString) {
  const riskAssets = new Set(["shib", "pepe", "moodeng", "trump"]);
  if (!riskAssets.has(assetKey)) {
    return false;
  }

  const selectedDate = new Date(`${dateString}T00:00:00Z`);
  const earliestDate = new Date(`${ASSET_CONFIG[assetKey].earliestReliableDate}T00:00:00Z`);
  const riskWindowEnd = new Date(earliestDate);
  riskWindowEnd.setUTCDate(riskWindowEnd.getUTCDate() + 365);
  return selectedDate <= riskWindowEnd;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatSignedMoney(value) {
  return `${value >= 0 ? "+" : ""}${formatMoney(value)}`;
}

function formatSignedPercent(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatTokenAmount(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setStatus(message, type = "neutral") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`.trim();
}

function setLoading(isLoading) {
  elements.calculateButton.disabled = isLoading;
  elements.calculateButton.textContent = isLoading ? "计算中…" : "看看我现在有多少钱";
}

function validateAmount(rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  return parsed;
}

function validateDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_DATE");
  }

  const now = new Date();
  const todayStartUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
  const selectedStartUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
  if (selectedStartUtc > todayStartUtc) {
    throw new Error("FUTURE_DATE");
  }

  return date;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API_ERROR:${response.status}:${text || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error("API_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getDateRangeMs(dateString) {
  const date = validateDateString(dateString);
  const startMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
  const endMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0);
  return { startMs, endMs };
}

async function fetchHistoricalPrice(asset, dateString) {
  if (!asset || !asset.symbol) {
    throw new Error("NO_HISTORY_DATA");
  }

  if (isDateBeforeEarliest(asset, dateString)) {
    const error = new Error("EARLY_RELIABLE_DATE");
    error.userMessage = `该资产最早可模拟日期为 ${asset.earliestReliableDate}。`;
    throw error;
  }

  const earlyHistory = window.EARLY_HISTORY_DATA && window.EARLY_HISTORY_DATA[asset.name.toLowerCase()];
  const configKey = Object.keys(ASSET_CONFIG).find((item) => ASSET_CONFIG[item].label === asset.label);
  const assetKey = configKey || "btc";
  const goldAsset = window.EARLY_HISTORY_DATA && window.EARLY_HISTORY_DATA[assetKey];

  if (goldAsset && dateString < goldAsset.matureMarketStart) {
    const goldenPrice = goldAsset.prices && goldAsset.prices[dateString];
    if (!goldenPrice) {
      const error = new Error("NO_HISTORY_DATA");
      error.userMessage = EARLY_HISTORY_ERROR;
      throw error;
    }

    return {
      price: Number(goldenPrice),
      source: goldAsset.source,
      market: goldAsset.market,
      timestamp: new Date(`${dateString}T00:00:00Z`)
    };
  }

  const { startMs, endMs } = getDateRangeMs(dateString);
  const candles = await fetchJson(
    `${API_BASE}/klines?symbol=${asset.symbol}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1000`
  );

  if (!Array.isArray(candles) || candles.length === 0) {
    const error = new Error("NO_HISTORY_DATA");
    error.userMessage = EARLY_HISTORY_ERROR;
    throw error;
  }

  const candle = candles.find((item) => Number(item[0]) === startMs);
  if (!candle) {
    const error = new Error("NO_HISTORY_DATA");
    error.userMessage = EARLY_HISTORY_ERROR;
    throw error;
  }

  const historicalPrice = Number(candle[4]);

  if (!Number.isFinite(historicalPrice) || historicalPrice <= 0) {
    const error = new Error("NO_HISTORY_DATA");
    error.userMessage = EARLY_HISTORY_ERROR;
    throw error;
  }

  return {
    price: historicalPrice,
    source: asset.historicalSource || "Binance",
    market: "binance",
    timestamp: new Date(Number(candle[0]))
  };
}

async function fetchCurrentPrice(symbol) {
  const payload = await fetchJson(`${API_BASE}/ticker/price?symbol=${symbol}`);
  const currentPrice = Number(payload.price);

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new Error("CURRENT_PRICE_ERROR");
  }

  return {
    price: currentPrice,
    timestamp: new Date(),
    source: "Binance"
  };
}

function computeResult(initialAmount, historicalPrice, currentPrice) {
  const quantity = initialAmount / historicalPrice;
  const currentValue = quantity * currentPrice;
  const profit = currentValue - initialAmount;
  const returnRate = (profit / initialAmount) * 100;

  return {
    initialAmount,
    quantity,
    currentValue,
    profit,
    returnRate,
    historicalPrice,
    currentPrice
  };
}

function renderResult(result, coinLabel, dateString, historicalInfo, currentInfo, assetKey, asset) {
  const isPositive = result.profit >= 0;

  elements.initialValue.textContent = formatMoney(result.initialAmount);
  elements.boughtQty.textContent = `${formatTokenAmount(result.quantity)} ${coinLabel}`;
  elements.holdingStatus.textContent = "持有至今天";
  const multiple = result.initialAmount > 0 ? result.currentValue / result.initialAmount : 0;
  elements.multiple.textContent = `${multiple.toFixed(2)}×`;
  elements.currentValue.textContent = formatMoney(result.currentValue);
  elements.profit.textContent = formatSignedMoney(result.profit);
  elements.profit.classList.toggle("positive", isPositive);
  elements.profit.classList.toggle("negative", !isPositive);
  elements.returnRate.textContent = formatSignedPercent(result.returnRate);
  elements.returnRate.classList.toggle("positive", isPositive);
  elements.returnRate.classList.toggle("negative", !isPositive);

  elements.buyDate.textContent = dateString;
  elements.historicalPrice.textContent = `${formatMoney(result.historicalPrice)} / ${coinLabel}`;
  elements.currentPrice.textContent = `${formatMoney(result.currentPrice)} / ${coinLabel}`;
  elements.priceUpdatedAt.textContent = `${currentInfo.timestamp.toISOString().replace("T", " ").slice(0, 19)} UTC`;
  elements.sourceName.textContent = asset.historicalSource || state.lastDataSource;

  if (shouldShowEarlyRisk(assetKey, dateString)) {
    elements.riskWarning.textContent = EARLY_STAGE_WARNING;
    elements.riskWarning.classList.remove("hidden");
  } else {
    elements.riskWarning.classList.add("hidden");
  }

  elements.resultPanel.classList.remove("hidden");
  elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleCalculate() {
  try {
    setLoading(true);
    setStatus("正在拉取 Binance 公共行情数据…", "neutral");

    const initialAmount = validateAmount(elements.amountInput.value);
    const selectedCoinKey = elements.coinSelect.value;
    const dateString = elements.dateInput.value;
    validateDateString(dateString);

    const asset = getAsset(selectedCoinKey);

    if (asset.unsupportedMessage) {
      setStatus(asset.unsupportedMessage, "error");
      elements.resultPanel.classList.add("hidden");
      elements.riskWarning.classList.add("hidden");
      return;
    }

    const [historicalInfo, currentInfo] = await Promise.all([
      fetchHistoricalPrice(asset, dateString),
      fetchCurrentPrice(asset.symbol)
    ]);

    const result = computeResult(initialAmount, historicalInfo.price, currentInfo.price);
    renderResult(result, asset.label, dateString, historicalInfo, currentInfo, selectedCoinKey, asset);
    setStatus("已完成：按真实历史价格和当前价格折算出全部买入持有后的结果。", "success");
  } catch (error) {
    const message = error && error.message ? error.message : "";
    const userMessage = error && error.userMessage ? error.userMessage : "";

    if (message.includes("INVALID_AMOUNT")) {
      setStatus("请输入有效的初始 USDT 金额，必须大于 0。", "error");
    } else if (message.includes("FUTURE_DATE")) {
      setStatus("未来日期不能计算，请重新选择过去或今天的日期。", "error");
    } else if (message.includes("EARLY_RELIABLE_DATE")) {
      setStatus(userMessage || `该资产最早可模拟日期为 ${getAsset(elements.coinSelect.value).earliestReliableDate}。`, "error");
    } else if (message.includes("NO_HISTORY_DATA")) {
      setStatus(userMessage || "该日期暂无可靠行情数据，请选择更晚日期。", "error");
    } else if (message.includes("API_TIMEOUT") || message.includes("API_ERROR") || message.includes("CURRENT_PRICE_ERROR")) {
      setStatus("Binance API 请求失败，无法获取真实行情。", "error");
    } else if (message.includes("INVALID_DATE")) {
      setStatus("日期格式不正确，请重新选择日期。", "error");
    } else {
      setStatus(userMessage || "Binance API 请求失败，无法获取真实行情。", "error");
    }

    elements.resultPanel.classList.add("hidden");
    elements.riskWarning.classList.add("hidden");
  } finally {
    setLoading(false);
  }
}

function initialize() {
  const today = new Date();
  const defaultDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

  elements.amountInput.value = String(state.initialAmount);
  elements.dateInput.value = formatDateInput(defaultDate);
  elements.coinSelect.value = state.selectedCoin;
  elements.dateInput.max = formatDateInput(today);

  elements.calculateButton.addEventListener("click", handleCalculate);
  elements.coinSelect.addEventListener("change", () => {
    state.selectedCoin = elements.coinSelect.value;
  });

  setStatus("请选择日期和币种，计算当时 ALL IN 的真实收益。", "neutral");
  elements.resultPanel.classList.add("hidden");
}

initialize();
