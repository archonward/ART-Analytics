const coverageRegistry = {
  AMD: {
    ticker: 'AMD',
    companyName: 'Advanced Micro Devices, Inc.',
    exchange: 'NYSE',
    sector: 'Technology',
    lastUpdated: '2026-03-24',
    status: 'published'
  },
  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    exchange: 'NYSE',
    sector: 'Technology',
    lastUpdated: '2026-03-24',
    status: 'published'
  },
  AAPL: {
      ticker: 'AAPL',
      companyName: 'Apple, Inc',
      exchange: 'NYSE',
      sector: 'Technology',
      lastUpdated: '2026-03-24',
      status: 'published'
  },
  MSFT: {
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      exchange: 'NYSE',
      sector: 'Technology',
      lastUpdated: '2026-03-24',
      status: 'published'
  },
  AMZN: {
        ticker: 'AMZN',
        companyName: 'Amazon, Inc',
        exchange: 'NYSE',
        sector: 'Consumer cyclical',
        lastUpdated: '2026-03-24',
        status: 'published'
  },
  TSM: {
          ticker: 'TSM',
          companyName: 'Taiwan Semiconductor Manufacturing Company Limited',
          exchange: 'NYSE',
          sector: 'Technology',
          lastUpdated: '2026-03-24',
          status: 'published'
  },
  META: {
        ticker: 'META',
        companyName: 'Meta Platforms',
        exchange: 'NYSE',
        sector: 'Technology',
        lastUpdated: '2026-03-25',
        status: 'published'
  },
  AVGO: {
        ticker: 'AVGO',
        companyName: 'Broadcom Inc',
        exchange: 'NYSE',
        sector: 'Technology',
        lastUpdated: '2026-03-25',
        status: 'published'
    },
  TSLA: {
             ticker: 'TSLA',
             companyName: 'Tesla Inc',
             exchange: 'NYSE',
             sector: 'Technology',
             lastUpdated: '2026-03-26',
             status: 'published'
   },
  WMT: {
               ticker: 'WMT',
               companyName: 'Walmart Inc',
               exchange: 'NYSE',
               sector: 'Consumer Staples',
               lastUpdated: '2026-03-26',
               status: 'published'
  },
  JPM: {
                 ticker: 'JPM',
                 companyName: 'JPMorgan Chase & Co.',
                 exchange: 'NYSE',
                 sector: 'Financials',
                 lastUpdated: '2026-03-26',
                 status: 'published'
  },
  XOM: {
                   ticker: 'XOM',
                   companyName: 'Exxon Mobil Corporation',
                   exchange: 'NYSE',
                   sector: 'Energy',
                   lastUpdated: '2026-03-26',
                   status: 'published'
  },
  IBM: {
      ticker: 'IBM',
      companyName: 'International Business Machines Corporation',
      exchange: 'NYSE',
      sector: 'Technology',
      lastUpdated: '2026-03-25',
      status: 'published'
  },
    KO: {
      ticker: 'KO',
      companyName: 'The Coca-Cola Company',
      exchange: 'NYSE',
      sector: 'Consumer Defensive',
      lastUpdated: '2026-03-25',
      status: 'published'
  }
};

export function getCoverageByTicker(ticker) {
  return coverageRegistry[ticker] || null;
}

export function listCoveredTickers() {
  return Object.values(coverageRegistry)
    .filter((entry) => entry.status === 'published')
    .map((entry) => ({
      ticker: entry.ticker,
      companyName: entry.companyName,
      exchange: entry.exchange,
      sector: entry.sector,
      lastUpdated: entry.lastUpdated
    }));
}