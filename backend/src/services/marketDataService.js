import YahooFinance from 'yahoo-finance2';
import { marketOverviewRegistry } from '../data/marketOverviewRegistry.js';

const yahooFinance = new YahooFinance();

const MARKET_DATA_CACHE_TTL_MS = 15_000;
const marketDataCache = new Map();
const inFlightMarketDataRequests = new Map();

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

function getCacheEntry(ticker) {
  const entry = marketDataCache.get(ticker);

  if (!entry) {
    return null;
  }

  const isExpired = Date.now() - entry.cachedAt > MARKET_DATA_CACHE_TTL_MS;

  if (isExpired) {
    marketDataCache.delete(ticker);
    return null;
  }

  return entry;
}

function setCacheEntry(ticker, payload) {
  marketDataCache.set(ticker, {
    ...payload,
    cachedAt: Date.now()
  });
}

async function fetchAndCacheTicker(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    const marketData = buildNormalizedMarketData(quote, ticker);

    if (!marketData) {
      const unavailableResult = {
        found: false,
        reason: 'no_market_data'
      };

      setCacheEntry(ticker, unavailableResult);
      return unavailableResult;
    }

    const successResult = {
      found: true,
      marketData
    };

    setCacheEntry(ticker, successResult);
    return successResult;
  } catch (error) {
    const unavailableResult = {
      found: false,
      reason: 'market_data_unavailable',
      details: error.message
    };

    setCacheEntry(ticker, unavailableResult);
    return unavailableResult;
  }
}

async function getOrCreateTickerRequest(ticker) {
  const cachedEntry = getCacheEntry(ticker);

  if (cachedEntry) {
    return cachedEntry;
  }

  const existingInFlightRequest = inFlightMarketDataRequests.get(ticker);

  if (existingInFlightRequest) {
    return existingInFlightRequest;
  }

  const requestPromise = (async () => {
    try {
      return await fetchAndCacheTicker(ticker);
    } finally {
      inFlightMarketDataRequests.delete(ticker);
    }
  })();

  inFlightMarketDataRequests.set(ticker, requestPromise);

  return requestPromise;
}

export async function getLiveMarketDataByTicker(ticker) {
  return getOrCreateTickerRequest(ticker);
}

export async function getLiveMarketDataBatchByTickers(tickers) {
  const uniqueTickers = [...new Set(tickers)];

  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const result = await getOrCreateTickerRequest(ticker);

      if (!result.found && result.reason === 'no_market_data') {
        return {
          ticker,
          status: 'unavailable',
          message: `Live market data is currently unavailable for ${ticker}.`
        };
      }

      if (!result.found) {
        return {
          ticker,
          status: 'unavailable',
          message: `Could not load live market data for ${ticker} right now.`
        };
      }

      return {
        ticker,
        status: 'ok',
        data: result.marketData
      };
    })
  );

  return {
    results
  };
}

export async function getMarketOverview() {
  const results = await Promise.all(
    marketOverviewRegistry.map(async (item) => {
      const result = await getOrCreateTickerRequest(item.symbol);

      if (!result.found) {
        return {
          symbol: item.symbol,
          displaySymbol: item.displaySymbol,
          name: item.name,
          status: 'unavailable',
          message: `Could not load market data for ${item.displaySymbol}.`
        };
      }

      return {
        symbol: item.symbol,
        displaySymbol: item.displaySymbol,
        name: item.name,
        status: 'ok',
        data: result.marketData
      };
    })
  );

  return {
    items: results
  };
}

export function clearMarketDataCache() {
  marketDataCache.clear();
}

export function getMarketDataCacheStats() {
  return {
    size: marketDataCache.size,
    ttlMs: MARKET_DATA_CACHE_TTL_MS,
    inFlight: inFlightMarketDataRequests.size
  };
}