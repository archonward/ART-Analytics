const coverageRegistry = {
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
  },
  AMD: {
    ticker: 'AMD',
    companyName: 'Advanced Micro Devices, Inc.',
    exchange: 'NYSE',
    sector: 'Technology',
    lastUpdated: '2026-03-16',
    status: 'published'
  },
  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    exchange: 'NYSE',
    sector: 'Technology',
    lastUpdated: '2026-03-24',
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