(function () {
  const EARLY_HISTORY_DATA = {
    btc: {
      earliestReliableDate: "2010-07-18",
      matureMarketStart: "2013-04-29",
      prices: {
        // Intentionally kept empty in this phase to avoid fabricating prices.
        // Only verified anchor dates should be added here when explicitly provided.
      },
      source: "golden-history",
      market: "golden-anchor"
    },
    pepe: {
      earliestReliableDate: "2023-04-14",
      matureMarketStart: "2023-05-05",
      prices: {
        // Intentionally kept empty in this phase to avoid fabricating prices.
        // Only verified anchor dates should be added here when explicitly provided.
      },
      source: "golden-history",
      market: "golden-anchor"
    }
  };

  window.EARLY_HISTORY_DATA = EARLY_HISTORY_DATA;
})();
