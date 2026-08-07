// Temporary source data for the news API contract. Replace this module when a
// live provider is introduced; consumers should continue using newsService.
const placeholderNewsArticles = [
  {
    id: 'placeholder-ai-infrastructure-demand',
    headline: 'AI infrastructure spending remains a priority for cloud platforms',
    summary: 'Semiconductor and networking suppliers are preparing for another investment cycle as large cloud customers refine capacity plans.',
    source: 'ART Analytics Placeholder',
    publishedAt: '2026-08-08T12:30:00.000Z',
    url: 'https://example.com/placeholder-news/ai-infrastructure-demand',
    coverageCategory: 'Earnings',
    sector: 'Technology',
    tickers: ['NVDA', 'AVGO']
  },
  {
    id: 'placeholder-bank-capital-returns',
    headline: 'Banks reassess capital returns after the latest balance-sheet review',
    summary: 'Management teams are balancing potential buybacks and dividends against evolving credit conditions and regulatory requirements.',
    source: 'ART Analytics Placeholder',
    publishedAt: '2026-08-08T10:15:00.000Z',
    url: 'https://example.com/placeholder-news/bank-capital-returns',
    coverageCategory: 'Dividends',
    sector: 'Financials',
    tickers: ['JPM', 'BAC']
  },
  {
    id: 'placeholder-healthcare-estimates',
    headline: 'Healthcare estimates shift as investors revisit cost assumptions',
    summary: 'Analysts are updating margin expectations while assessing utilization trends and the timing of reimbursement changes.',
    source: 'ART Analytics Placeholder',
    publishedAt: '2026-08-07T20:45:00.000Z',
    url: 'https://example.com/placeholder-news/healthcare-estimates',
    coverageCategory: 'Analyst Ratings',
    sector: 'Healthcare',
    tickers: ['UNH']
  }
];

export default placeholderNewsArticles;
