import test from 'node:test';
import assert from 'node:assert/strict';
import placeholderNewsProvider from '../providers/news/placeholderNewsProvider.js';
import { listNewsArticles } from './newsService.js';
import { validateNewsArticle, validateNewsArticles } from '../utils/newsValidator.js';
import { buildNewsResponse } from '../utils/responseBuilders.js';

test('listNewsArticles returns articles matching the normalized contract', async () => {
  const articles = await listNewsArticles(placeholderNewsProvider);
  const validation = validateNewsArticles(articles);

  assert.ok(articles.length > 0);
  assert.equal(validation.valid, true);
  assert.deepEqual(Object.keys(articles[0]).sort(), [
    'coverageCategory',
    'headline',
    'id',
    'publishedAt',
    'sector',
    'source',
    'summary',
    'tickers',
    'url'
  ]);
});

test('listNewsArticles returns a fresh ticker array for each request', async () => {
  const firstResult = await listNewsArticles(placeholderNewsProvider);
  firstResult[0].tickers.push('TEST');

  const secondResult = await listNewsArticles(placeholderNewsProvider);
  assert.equal(secondResult[0].tickers.includes('TEST'), false);
});

test('placeholder provider keeps raw records separate from normalized articles', async () => {
  const [rawArticle] = await placeholderNewsProvider.loadRawArticles();
  const normalizedArticle = placeholderNewsProvider.normalizeArticle(rawArticle);

  assert.equal(rawArticle.title, normalizedArticle.headline);
  assert.equal(Object.hasOwn(rawArticle, 'headline'), false);
  assert.equal(validateNewsArticle(normalizedArticle).valid, true);
});

test('listNewsArticles accepts a provider implementing the news provider boundary', async () => {
  const provider = {
    async loadRawArticles() {
      return [{ externalId: 'future-provider-article' }];
    },
    normalizeArticle(rawArticle) {
      return {
        id: rawArticle.externalId,
        headline: 'Future provider article',
        summary: 'A provider adapter maps raw fields to the stable contract.',
        source: 'Test Provider',
        publishedAt: '2026-08-08T12:00:00.000Z',
        url: 'https://example.com/future-provider-article',
        coverageCategory: 'Earnings',
        sector: 'Technology',
        tickers: ['TEST']
      };
    }
  };

  const articles = await listNewsArticles(provider);
  assert.equal(articles[0].id, 'future-provider-article');
  assert.equal(validateNewsArticles(articles).valid, true);
});

test('validateNewsArticle rejects malformed contract fields', () => {
  const validation = validateNewsArticle({
    id: 'invalid-article',
    headline: 'Invalid article',
    summary: 'This fixture intentionally has an invalid URL.',
    source: 'Test',
    publishedAt: 'not-a-date',
    url: 'not-a-url',
    coverageCategory: 'Earnings',
    sector: 'Technology',
    tickers: 'NVDA'
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.startsWith('publishedAt')));
  assert.ok(validation.errors.some((error) => error.startsWith('url')));
  assert.ok(validation.errors.some((error) => error.startsWith('tickers')));
});

test('buildNewsResponse wraps articles in the public success envelope', async () => {
  const articles = await listNewsArticles(placeholderNewsProvider);

  assert.deepEqual(buildNewsResponse(articles), {
    status: 'ok',
    articles
  });
});
