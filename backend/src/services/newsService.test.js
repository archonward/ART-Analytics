import test from 'node:test';
import assert from 'node:assert/strict';
import placeholderNewsProvider from '../providers/news/placeholderNewsProvider.js';
import { createInMemoryNewsArticleRepository } from '../repositories/inMemoryNewsArticleRepository.js';
import {
  createNewsService,
  DEFAULT_NEWS_CACHE_TTL_MS,
  DEFAULT_NEWS_FEED_LIMIT,
  listNewsArticles
} from './newsService.js';
import { validateNewsArticle, validateNewsArticles } from '../utils/newsValidator.js';
import { buildNewsResponse } from '../utils/responseBuilders.js';

function createCountingProvider() {
  let callCount = 0;
  let shouldFail = false;

  const provider = {
    async loadRawArticles() {
      callCount += 1;

      if (shouldFail) {
        throw new Error('Provider unavailable');
      }

      return [{ externalId: `article-${callCount}` }];
    },
    normalizeArticle(rawArticle) {
      return {
        id: rawArticle.externalId,
        headline: 'Cached provider article',
        summary: 'A normalized article used to verify the news cache.',
        source: 'Test Provider',
        publishedAt: '2026-08-08T12:00:00.000Z',
        url: `https://example.com/${rawArticle.externalId}`,
        coverageCategory: 'Earnings',
        sector: 'Technology',
        tickers: ['TEST']
      };
    }
  };

  return {
    provider,
    getCallCount: () => callCount,
    failRequests: () => {
      shouldFail = true;
    }
  };
}

function createArticle(id, publishedAt, overrides = {}) {
  return {
    id,
    headline: `Headline for ${id}`,
    summary: `Summary for ${id}`,
    source: 'Test Provider',
    publishedAt,
    url: `https://example.com/${id}`,
    coverageCategory: 'General',
    sector: 'Unclassified',
    tickers: [],
    ...overrides
  };
}

function createStaticProvider(articles, { waitFor } = {}) {
  let callCount = 0;

  return {
    provider: {
      async loadRawArticles() {
        callCount += 1;

        if (waitFor) {
          await waitFor;
        }

        return articles.map((article) => ({
          ...article,
          tickers: [...article.tickers]
        }));
      },
      normalizeArticle(article) {
        return {
          ...article,
          tickers: [...article.tickers]
        };
      }
    },
    getCallCount: () => callCount
  };
}

function trackRepository(repository) {
  let saveCount = 0;
  let listCount = 0;

  return {
    repository: {
      async saveArticles(articles) {
        saveCount += 1;
        return repository.saveArticles(articles);
      },
      async listLatestArticles(limit) {
        listCount += 1;
        return repository.listLatestArticles(limit);
      }
    },
    getSaveCount: () => saveCount,
    getListCount: () => listCount
  };
}

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

test('news cache avoids repeated provider calls within its lifetime', async () => {
  const clock = { value: 1_000 };
  const countingProvider = createCountingProvider();
  const service = createNewsService({
    provider: countingProvider.provider,
    cacheTtlMs: DEFAULT_NEWS_CACHE_TTL_MS,
    now: () => clock.value
  });

  const firstResult = await service.listNewsArticles();
  clock.value += DEFAULT_NEWS_CACHE_TTL_MS - 1;
  const secondResult = await service.listNewsArticles();

  assert.equal(countingProvider.getCallCount(), 1);
  assert.deepEqual(secondResult, firstResult);
});

test('news cache refreshes from the provider after expiry', async () => {
  const clock = { value: 1_000 };
  const countingProvider = createCountingProvider();
  const service = createNewsService({
    provider: countingProvider.provider,
    cacheTtlMs: 500,
    now: () => clock.value
  });

  const firstResult = await service.listNewsArticles();
  clock.value += 500;
  const secondResult = await service.listNewsArticles();

  assert.equal(countingProvider.getCallCount(), 2);
  assert.equal(firstResult[0].id, 'article-1');
  assert.equal(secondResult[0].id, 'article-2');
});

test('news cache stores valid normalized articles and returns defensive copies', async () => {
  const countingProvider = createCountingProvider();
  const service = createNewsService({ provider: countingProvider.provider });

  const firstResult = await service.listNewsArticles();
  firstResult[0].tickers.push('MUTATED');
  const secondResult = await service.listNewsArticles();

  assert.equal(validateNewsArticles(secondResult).valid, true);
  assert.equal(secondResult[0].headline, 'Cached provider article');
  assert.deepEqual(secondResult[0].tickers, ['TEST']);
  assert.equal(Object.hasOwn(secondResult[0], 'externalId'), false);
});

test('news cache serves stale articles when a refresh fails', async () => {
  const clock = { value: 1_000 };
  const countingProvider = createCountingProvider();
  const service = createNewsService({
    provider: countingProvider.provider,
    cacheTtlMs: 500,
    now: () => clock.value
  });

  const firstResult = await service.listNewsArticles();
  clock.value += 500;
  countingProvider.failRequests();
  const staleResult = await service.listNewsArticles();
  const repeatedResult = await service.listNewsArticles();

  assert.deepEqual(staleResult, firstResult);
  assert.deepEqual(repeatedResult, firstResult);
  assert.equal(countingProvider.getCallCount(), 2);
});

test('news service preserves provider-only behavior when no repository is supplied', async () => {
  const providerBatch = [
    createArticle('provider-first', '2026-08-12T08:00:00.000Z'),
    createArticle('provider-second', '2026-08-13T08:00:00.000Z')
  ];
  const staticProvider = createStaticProvider(providerBatch);
  const service = createNewsService({ provider: staticProvider.provider });

  const articles = await service.listNewsArticles();

  assert.deepEqual(articles, providerBatch);
  assert.equal(staticProvider.getCallCount(), 1);
});

test('news service saves retrieved articles and includes the rolling archive newest-first', async () => {
  const repository = createInMemoryNewsArticleRepository();
  const archivedArticle = createArticle('archived', '2026-08-12T08:00:00.000Z');
  const currentArticle = createArticle('current', '2026-08-13T08:00:00.000Z');
  await repository.saveArticles([archivedArticle]);
  const staticProvider = createStaticProvider([currentArticle]);
  const service = createNewsService({
    provider: staticProvider.provider,
    repository
  });

  const articles = await service.listNewsArticles();
  const persistedArticles = await repository.listLatestArticles(DEFAULT_NEWS_FEED_LIMIT);

  assert.deepEqual(articles.map((article) => article.id), ['current', 'archived']);
  assert.deepEqual(persistedArticles.map((article) => article.id), ['current', 'archived']);
});

test('news service deduplicates the rolling archive and respects its feed limit', async () => {
  const repository = createInMemoryNewsArticleRepository();
  await repository.saveArticles([
    createArticle('duplicate', '2026-08-12T08:00:00.000Z', {
      headline: 'Previously persisted duplicate'
    }),
    createArticle('archived', '2026-08-11T08:00:00.000Z')
  ]);
  const staticProvider = createStaticProvider([
    createArticle('newest', '2026-08-14T08:00:00.000Z'),
    createArticle('duplicate', '2026-08-13T08:00:00.000Z', {
      headline: 'Current provider duplicate'
    })
  ]);
  const service = createNewsService({
    provider: staticProvider.provider,
    repository,
    rollingFeedLimit: 2
  });

  const articles = await service.listNewsArticles();

  assert.deepEqual(articles.map((article) => article.id), ['newest', 'duplicate']);
  assert.equal(articles[1].headline, 'Current provider duplicate');
  assert.equal(articles.filter((article) => article.id === 'duplicate').length, 1);
});

test('news cache avoids repeated provider and repository work within its lifetime', async () => {
  const backingRepository = createInMemoryNewsArticleRepository();
  const trackedRepository = trackRepository(backingRepository);
  const staticProvider = createStaticProvider([
    createArticle('cached-feed', '2026-08-13T08:00:00.000Z')
  ]);
  const service = createNewsService({
    provider: staticProvider.provider,
    repository: trackedRepository.repository
  });

  const firstResult = await service.listNewsArticles();
  const secondResult = await service.listNewsArticles();

  assert.deepEqual(secondResult, firstResult);
  assert.equal(staticProvider.getCallCount(), 1);
  assert.equal(trackedRepository.getSaveCount(), 1);
  assert.equal(trackedRepository.getListCount(), 1);
});

test('concurrent cache misses share one provider and repository refresh', async () => {
  let releaseProvider;
  const providerGate = new Promise((resolve) => {
    releaseProvider = resolve;
  });
  const backingRepository = createInMemoryNewsArticleRepository();
  const trackedRepository = trackRepository(backingRepository);
  const staticProvider = createStaticProvider([
    createArticle('single-flight', '2026-08-13T08:00:00.000Z')
  ], { waitFor: providerGate });
  const service = createNewsService({
    provider: staticProvider.provider,
    repository: trackedRepository.repository
  });

  const requests = [
    service.listNewsArticles(),
    service.listNewsArticles(),
    service.listNewsArticles()
  ];
  await Promise.resolve();

  assert.equal(staticProvider.getCallCount(), 1);
  releaseProvider();
  const results = await Promise.all(requests);

  assert.deepEqual(results[1], results[0]);
  assert.deepEqual(results[2], results[0]);
  assert.equal(trackedRepository.getSaveCount(), 1);
  assert.equal(trackedRepository.getListCount(), 1);
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
