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

export async function getLiveMarketDataByTicker(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);

    const hasPrice =
      typeof quote.regularMarketPrice === 'number' ||
      typeof quote.postMarketPrice === 'number' ||
      typeof quote.preMarketPrice === 'number';

    if (!hasPrice) {
      return {
        found: false,
        reason: 'no_market_data'
      };
    }

    return {
      found: true,
      marketData: {
        ticker: quote.symbol || ticker,
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
      }
    };
  } catch (error) {
    return {
      found: false,
      reason: 'market_data_unavailable',
      details: error.message
    };
  }
}
