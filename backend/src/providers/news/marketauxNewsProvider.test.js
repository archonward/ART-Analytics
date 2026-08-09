import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMarketauxNewsProvider,
  extractMarketauxTickers,
  normalizeMarketauxArticle
} from './marketauxNewsProvider.js';
import { validateNewsArticle } from '../../utils/newsValidator.js';

const rawMarketauxArticle = {
  uuid: 'marketaux-article-1',
  title: 'Chip demand remains firm as cloud investment expands',
  description: 'Semiconductor suppliers outlined another period of strong infrastructure demand.',
  snippet: 'Cloud platforms continue to invest in accelerated computing capacity.',
  url: 'https://example.com/marketaux-article-1',
  language: 'en',
  published_at: '2026-08-08T12:30:00.000000Z',
  source: 'example.com',
  entities: [
    { symbol: 'NVDA', type: 'equity', industry: 'Technology' },
    { symbol: 'AVGO', type: 'equity', industry: 'Technology' }
  ]
};

test('normalizeMarketauxArticle maps a raw response to the ART Analytics contract', () => {
  const article = normalizeMarketauxArticle(rawMarketauxArticle);

  assert.deepEqual(article, {
    id: 'marketaux-article-1',
    headline: 'Chip demand remains firm as cloud investment expands',
    summary: 'Semiconductor suppliers outlined another period of strong infrastructure demand.',
    source: 'example.com',
    publishedAt: '2026-08-08T12:30:00.000000Z',
    url: 'https://example.com/marketaux-article-1',
    coverageCategory: 'General',
    sector: 'Technology',
    tickers: ['NVDA', 'AVGO']
  });
  assert.equal(validateNewsArticle(article).valid, true);
});

test('normalizeMarketauxArticle handles missing optional provider fields', () => {
  const article = normalizeMarketauxArticle({
    ...rawMarketauxArticle,
    description: null,
    snippet: null,
    source: null,
    entities: undefined
  });

  assert.equal(article.summary, 'Summary unavailable.');
  assert.equal(article.source, 'Marketaux');
  assert.equal(article.coverageCategory, 'General');
  assert.equal(article.sector, 'Technology');
  assert.deepEqual(article.tickers, []);
  assert.equal(validateNewsArticle(article).valid, true);
});

test('extractMarketauxTickers returns unique equity symbols only', () => {
  const tickers = extractMarketauxTickers([
    { symbol: 'aapl', type: 'equity' },
    { symbol: 'AAPL', type: 'equity' },
    { symbol: 'MSFT', type: 'equity' },
    { symbol: 'SPX', type: 'index' },
    { symbol: '', type: 'equity' },
    null
  ]);

  assert.deepEqual(tickers, ['AAPL', 'MSFT']);
});

test('Marketaux provider requests the plan maximum of varied English-language equity news', async () => {
  let requestedUrl;
  let requestCount = 0;
  const provider = createMarketauxNewsProvider({
    apiToken: 'test-token',
    async fetchImpl(url) {
      requestCount += 1;
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        async json() {
          return { data: [rawMarketauxArticle] };
        }
      };
    }
  });

  const articles = await provider.loadRawArticles();

  assert.equal(articles.length, 1);
  assert.equal(requestedUrl.origin, 'https://api.marketaux.com');
  assert.equal(requestedUrl.pathname, '/v1/news/all');
  assert.equal(requestedUrl.searchParams.get('api_token'), 'test-token');
  assert.equal(requestedUrl.searchParams.get('language'), 'en');
  assert.equal(requestedUrl.searchParams.get('entity_types'), 'equity');
  assert.equal(requestedUrl.searchParams.get('must_have_entities'), 'true');
  assert.equal(requestedUrl.searchParams.get('filter_entities'), 'true');
  assert.equal(requestedUrl.searchParams.get('group_similar'), 'true');
  assert.equal(requestedUrl.searchParams.has('limit'), false);
  assert.equal(requestedUrl.searchParams.has('symbols'), false);
  assert.equal(requestedUrl.searchParams.has('industries'), false);
  assert.equal(requestedUrl.searchParams.has('countries'), false);
  assert.equal(requestCount, 1);
});

test('Marketaux provider permits an explicit smaller article limit', async () => {
  let requestedUrl;
  const provider = createMarketauxNewsProvider({
    apiToken: 'test-token',
    articleLimit: 5,
    async fetchImpl(url) {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        async json() {
          return { data: [] };
        }
      };
    }
  });

  await provider.loadRawArticles();

  assert.equal(requestedUrl.searchParams.get('limit'), '5');
});

test('Marketaux provider requires an API token', async () => {
  const provider = createMarketauxNewsProvider({ apiToken: '' });

  await assert.rejects(
    provider.loadRawArticles(),
    /MARKETAUX_API_TOKEN is not configured/
  );
});
