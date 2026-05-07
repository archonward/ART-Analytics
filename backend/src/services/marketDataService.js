// Required environment variables: FINNHUB_API_KEY
import { marketOverviewRegistry } from '../data/marketOverviewRegistry.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const MARKET_DATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const marketDataCache = new Map();
const inFlightMarketDataRequests = new Map();

function getCacheDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTimestamp(value) {
  if (!value) {
    return null;
  }

  const timestampValue = typeof value === 'number' && value < 1_000_000_000_000
    ? value * 1000
    : value;
  const timestamp = new Date(timestampValue);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp.toISOString();
}

function buildFinnhubUrl(path, params = {}) {
  const token = process.env.FINNHUB_API_KEY;

  if (!token) {
    throw new Error('FINNHUB_API_KEY is not set');
  }

  const url = new URL(`${FINNHUB_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  url.searchParams.set('token', token);

  return url;
}

async function fetchFinnhubJson(path, params) {
  const response = await fetch(buildFinnhubUrl(path, params));

  if (!response.ok) {
    throw new Error(`Finnhub request failed with status ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildQuoteFromFinnhub(ticker, quote, metrics, profile) {
  const metric = metrics?.metric || {};
  const marketCapitalization = profile?.marketCapitalization;

  return {
    symbol: ticker,
    shortName: null,
    currency: null,
    fullExchangeName: profile?.exchange || null,
    exchange: profile?.exchange || null,
    marketState: null,

    regularMarketPrice: isFiniteNumber(quote?.c) && quote.c > 0 ? quote.c : null,
    regularMarketChange: isFiniteNumber(quote?.d) ? quote.d : null,
    regularMarketChangePercent: isFiniteNumber(quote?.dp) ? quote.dp : null,
    regularMarketVolume: null,
    regularMarketPreviousClose: isFiniteNumber(quote?.pc) ? quote.pc : null,

    preMarketPrice: null,
    preMarketChange: null,
    preMarketChangePercent: null,

    postMarketPrice: null,
    postMarketChange: null,
    postMarketChangePercent: null,

    fiftyTwoWeekLow: isFiniteNumber(metric['52WeekLow']) ? metric['52WeekLow'] : null,
    fiftyTwoWeekHigh: isFiniteNumber(metric['52WeekHigh']) ? metric['52WeekHigh'] : null,
    marketCap: isFiniteNumber(marketCapitalization) ? marketCapitalization * 1_000_000 : null,

    regularMarketTime: isFiniteNumber(quote?.t) ? quote.t : null
  };
}

async function fetchFinnhubTicker(ticker) {
  const [quote, metrics, profile] = await Promise.all([
    fetchFinnhubJson('/quote', { symbol: ticker }),
    fetchFinnhubJson('/stock/metric', { symbol: ticker, metric: 'all' }),
    fetchFinnhubJson('/stock/profile2', { symbol: ticker })
  ]);

  return buildQuoteFromFinnhub(ticker, quote, metrics, profile);
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

  const isExpired = entry.cacheDateKey !== getCacheDateKey();

  if (isExpired) {
    marketDataCache.delete(ticker);
    return null;
  }

  return entry;
}

function setCacheEntry(ticker, payload) {
  marketDataCache.set(ticker, {
    ...payload,
    cachedAt: Date.now(),
    cacheDateKey: getCacheDateKey()
  });
}

async function fetchAndCacheTicker(ticker) {
  try {
    const quote = await fetchFinnhubTicker(ticker);
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
