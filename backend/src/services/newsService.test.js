import test from 'node:test';
import assert from 'node:assert/strict';
import { listNewsArticles } from './newsService.js';
import { validateNewsArticle, validateNewsArticles } from '../utils/newsValidator.js';
import { buildNewsResponse } from '../utils/responseBuilders.js';

test('listNewsArticles returns articles matching the normalized contract', async () => {
  const articles = await listNewsArticles();
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
  const firstResult = await listNewsArticles();
  firstResult[0].tickers.push('TEST');

  const secondResult = await listNewsArticles();
  assert.equal(secondResult[0].tickers.includes('TEST'), false);
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
  const articles = await listNewsArticles();

  assert.deepEqual(buildNewsResponse(articles), {
    status: 'ok',
    articles
  });
});
