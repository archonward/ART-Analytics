import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

function formatTimestamp(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp.toISOString();
}

function buildNormalizedMarketData(quote, fallbackTicker) {
  const hasPrice =
    typeof quote.regularMarketPrice === 'number' ||
    typeof quote.postMarketPrice === 'number' ||
    typeof quote.preMarketPrice === 'number';

  if (!hasPrice) {
    return null;
  }

  return {
    ticker: quote.symbol || fallbackTicker,
    shortName: quote.shortName || null,
    currency: quote.currency || null,
    exchange: quote.fullExchangeName || quote.exchange || null,

    marketState: quote.marketState || null,

    regularMarketPrice: quote.regularMarketPrice ?? null,
    regularMarketChange: quote.regularMarketChange ?? null,
    regularMarketChangePercent: quote.regularMarketChangePercent ?? null,
    regularMarketVolume: quote.regularMarketVolume ?? null,
    regularMarketPreviousClose: quote.regularMarketPreviousClose ?? null,

    preMarketPrice: quote.preMarketPrice ?? null,
    preMarketChange: quote.preMarketChange ?? null,
    preMarketChangePercent: quote.preMarketChangePercent ?? null,

    postMarketPrice: quote.postMarketPrice ?? null,
    postMarketChange: quote.postMarketChange ?? null,
    postMarketChangePercent: quote.postMarketChangePercent ?? null,

    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,

    lastUpdated: formatTimestamp(
      quote.regularMarketTime ||
      quote.postMarketTime ||
      quote.preMarketTime
    )
  };
}

export async function getLiveMarketDataByTicker(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    const marketData = buildNormalizedMarketData(quote, ticker);

    if (!marketData) {
      return {
        found: false,
        reason: 'no_market_data'
      };
    }

    return {
      found: true,
      marketData
    };
  } catch (error) {
    return {
      found: false,
      reason: 'market_data_unavailable',
      details: error.message
    };
  }
}

export async function getLiveMarketDataBatchByTickers(tickers) {
  const uniqueTickers = [...new Set(tickers)];

  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        const quote = await yahooFinance.quote(ticker);
        const marketData = buildNormalizedMarketData(quote, ticker);

        if (!marketData) {
          return {
            ticker,
            status: 'unavailable',
            message: `Live market data is currently unavailable for ${ticker}.`
          };
        }

        return {
          ticker,
          status: 'ok',
          data: marketData
        };
      } catch (error) {
        return {
          ticker,
          status: 'unavailable',
          message: `Could not load live market data for ${ticker} right now.`
        };
      }
    })
  );

  return {
    results
  };
}