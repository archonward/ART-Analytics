// Temporary provider-specific records. These deliberately do not use the ART
// Analytics article contract so the provider boundary remains explicit.
const placeholderRecords = [
  {
    providerId: 'placeholder-ai-infrastructure-demand',
    title: 'AI infrastructure spending remains a priority for cloud platforms',
    description: 'Semiconductor and networking suppliers are preparing for another investment cycle as large cloud customers refine capacity plans.',
    publisher: 'ART Analytics Placeholder',
    publicationTime: '2026-08-08T12:30:00.000Z',
    canonicalUrl: 'https://example.com/placeholder-news/ai-infrastructure-demand',
    classification: {
      coverage: 'Earnings',
      sector: 'Technology'
    },
    symbols: ['NVDA', 'AVGO']
  },
  {
    providerId: 'placeholder-bank-capital-returns',
    title: 'Banks reassess capital returns after the latest balance-sheet review',
    description: 'Management teams are balancing potential buybacks and dividends against evolving credit conditions and regulatory requirements.',
    publisher: 'ART Analytics Placeholder',
    publicationTime: '2026-08-08T10:15:00.000Z',
    canonicalUrl: 'https://example.com/placeholder-news/bank-capital-returns',
    classification: {
      coverage: 'Dividends',
      sector: 'Financials'
    },
    symbols: ['JPM', 'BAC']
  },
  {
    providerId: 'placeholder-healthcare-estimates',
    title: 'Healthcare estimates shift as investors revisit cost assumptions',
    description: 'Analysts are updating margin expectations while assessing utilization trends and the timing of reimbursement changes.',
    publisher: 'ART Analytics Placeholder',
    publicationTime: '2026-08-07T20:45:00.000Z',
    canonicalUrl: 'https://example.com/placeholder-news/healthcare-estimates',
    classification: {
      coverage: 'Analyst Ratings',
      sector: 'Healthcare'
    },
    symbols: ['UNH']
  }
];

function normalizeArticle(record) {
  return {
    id: record.providerId,
    headline: record.title,
    summary: record.description,
    source: record.publisher,
    publishedAt: record.publicationTime,
    url: record.canonicalUrl,
    coverageCategory: record.classification.coverage,
    sector: record.classification.sector,
    tickers: [...record.symbols]
  };
}

const placeholderNewsProvider = {
  async loadRawArticles() {
    return placeholderRecords.map((record) => ({
      ...record,
      classification: { ...record.classification },
      symbols: [...record.symbols]
    }));
  },
  normalizeArticle
};

export default placeholderNewsProvider;
