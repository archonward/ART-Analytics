import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewsArticles } from '../utils/newsValidator.js';
import { createInMemoryNewsArticleRepository } from './inMemoryNewsArticleRepository.js';

function createArticle(id, publishedAt, overrides = {}) {
  return {
    id,
    headline: `Headline for ${id}`,
    summary: `Summary for ${id}`,
    source: 'Test Publisher',
    publishedAt,
    url: `https://example.com/news/${id}`,
    coverageCategory: 'General',
    sector: 'Unclassified',
    tickers: [],
    ...overrides
  };
}

test('news article repository saves and returns normalized articles', async () => {
  const repository = createInMemoryNewsArticleRepository();
  const article = createArticle('article-1', '2026-08-13T08:00:00.000Z', {
    coverageCategory: 'Earnings',
    sector: 'Technology',
    tickers: ['AAPL']
  });

  await repository.saveArticles([article]);
  const savedArticles = await repository.listLatestArticles(10);

  assert.deepEqual(savedArticles, [article]);
  assert.equal(validateNewsArticles(savedArticles).valid, true);
  assert.deepEqual(Object.keys(savedArticles[0]).sort(), [
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

test('news article repository keeps one persisted article per ID', async () => {
  const repository = createInMemoryNewsArticleRepository();
  const originalArticle = createArticle('duplicate-id', '2026-08-13T08:00:00.000Z');
  const duplicateArticle = {
    ...originalArticle,
    headline: 'A duplicate payload must not replace the persisted article'
  };

  await repository.saveArticles([originalArticle]);
  await repository.saveArticles([duplicateArticle, duplicateArticle]);
  const savedArticles = await repository.listLatestArticles(10);

  assert.equal(savedArticles.length, 1);
  assert.equal(savedArticles[0].headline, originalArticle.headline);
});

test('news article repository returns newest articles first and respects the limit', async () => {
  const repository = createInMemoryNewsArticleRepository();
  await repository.saveArticles([
    createArticle('oldest', '2026-08-11T08:00:00.000Z'),
    createArticle('newest', '2026-08-13T08:00:00.000Z'),
    createArticle('middle', '2026-08-12T08:00:00.000Z')
  ]);

  const savedArticles = await repository.listLatestArticles(2);

  assert.deepEqual(savedArticles.map((article) => article.id), ['newest', 'middle']);
});

test('news article repository protects stored articles from caller mutation', async () => {
  const repository = createInMemoryNewsArticleRepository();
  const article = createArticle('defensive-copy', '2026-08-13T08:00:00.000Z', {
    tickers: ['NVDA']
  });

  await repository.saveArticles([article]);
  article.headline = 'Mutated after save';
  article.tickers.push('MUTATED');

  const firstRead = await repository.listLatestArticles(10);
  firstRead[0].headline = 'Mutated after read';
  firstRead[0].tickers.push('MUTATED');
  const secondRead = await repository.listLatestArticles(10);

  assert.equal(secondRead[0].headline, 'Headline for defensive-copy');
  assert.deepEqual(secondRead[0].tickers, ['NVDA']);
});
