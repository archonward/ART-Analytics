const mockNewsArticles = [
  {
    id: 'mock-nvda-ai-demand',
    headline: 'Chipmakers outline another step-up in AI infrastructure demand',
    summary: 'Leading semiconductor suppliers pointed to sustained accelerator and networking demand as cloud customers refine their next capital-spending plans.',
    source: 'Market Ledger (Mock)',
    publishedAt: '2026-08-08T08:30:00-04:00',
    url: 'https://example.com/mock-news/nvda-ai-demand',
    category: 'Earnings',
    sector: 'Technology',
    tickers: ['NVDA', 'AVGO']
  },
  {
    id: 'mock-jpm-capital-return',
    headline: 'Large banks revisit capital-return plans after stress-test review',
    summary: 'Management teams are weighing buyback capacity against credit normalization and a still-uncertain path for policy rates.',
    source: 'Capital Brief (Mock)',
    publishedAt: '2026-08-08T07:10:00-04:00',
    url: 'https://example.com/mock-news/bank-capital-returns',
    category: 'Dividends',
    sector: 'Financials',
    tickers: ['JPM', 'BAC', 'GS']
  },
  {
    id: 'mock-unh-rating',
    headline: 'Managed-care outlook prompts a fresh round of analyst estimate changes',
    summary: 'Research desks adjusted margin assumptions as investors assessed medical-cost trends and the pace of reimbursement updates.',
    source: 'Equity Wire (Mock)',
    publishedAt: '2026-08-07T16:45:00-04:00',
    url: 'https://example.com/mock-news/managed-care-estimates',
    category: 'Analyst Ratings',
    sector: 'Healthcare',
    tickers: ['UNH']
  },
  {
    id: 'mock-xom-projects',
    headline: 'Integrated energy producers emphasize project discipline into year-end',
    summary: 'Updated development schedules kept attention on free-cash-flow resilience, balance-sheet priorities, and shareholder distributions.',
    source: 'Energy Desk (Mock)',
    publishedAt: '2026-08-07T14:20:00-04:00',
    url: 'https://example.com/mock-news/energy-project-discipline',
    category: 'Earnings',
    sector: 'Energy',
    tickers: ['XOM', 'CVX']
  },
  {
    id: 'mock-wmt-upgrade',
    headline: 'Retail traffic trends support an upgrade for a defensive market leader',
    summary: 'The analyst cited steady unit volumes, improving digital economics, and a more balanced inventory position ahead of the next update.',
    source: 'Street Review (Mock)',
    publishedAt: '2026-08-07T11:05:00-04:00',
    url: 'https://example.com/mock-news/retail-traffic-upgrade',
    category: 'Upgrades',
    sector: 'Consumer',
    tickers: ['WMT']
  },
  {
    id: 'mock-aapl-services',
    headline: 'Services mix remains central to the next phase of platform earnings',
    summary: 'Investors are focusing on subscription growth and regulatory exposure as the company prepares for its next product cycle.',
    source: 'Technology Journal (Mock)',
    publishedAt: '2026-08-07T09:40:00-04:00',
    url: 'https://example.com/mock-news/platform-services-mix',
    category: 'Analyst Ratings',
    sector: 'Technology',
    tickers: ['AAPL']
  },
  {
    id: 'mock-biotech-readout',
    headline: 'Biotech investors prepare for a closely watched clinical-data readout',
    summary: 'The upcoming presentation could clarify the therapy’s competitive profile, addressable population, and likely regulatory path.',
    source: 'Clinical Markets (Mock)',
    publishedAt: '2026-08-06T15:15:00-04:00',
    url: 'https://example.com/mock-news/biotech-clinical-readout',
    category: 'Earnings',
    sector: 'Biotech',
    tickers: []
  },
  {
    id: 'mock-ma-dividend',
    headline: 'Payments network pairs dividend growth with continued reinvestment',
    summary: 'The latest capital-allocation discussion balanced shareholder returns with spending on security, data products, and new payment rails.',
    source: 'Payments Monitor (Mock)',
    publishedAt: '2026-08-06T12:00:00-04:00',
    url: 'https://example.com/mock-news/payments-capital-allocation',
    category: 'Dividends',
    sector: 'Financials',
    tickers: ['MA', 'V']
  }
];

export default mockNewsArticles;
