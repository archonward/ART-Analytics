import marketauxNewsProvider from '../providers/news/marketauxNewsProvider.js';
import placeholderNewsProvider from '../providers/news/placeholderNewsProvider.js';
import { assertNewsArticleRepository } from '../repositories/newsArticleRepository.js';
import { validateNewsArticles } from '../utils/newsValidator.js';

export const DEFAULT_NEWS_CACHE_TTL_MS = 12 * 60 * 1000;
export const DEFAULT_NEWS_FEED_LIMIT = 50;

export function getDefaultNewsProvider() {
  return process.env.MARKETAUX_API_TOKEN
    ? marketauxNewsProvider
    : placeholderNewsProvider;
}

function cloneArticles(articles) {
  return articles.map((article) => ({
    ...article,
    tickers: [...article.tickers]
  }));
}

function compareNewestFirst(left, right) {
  const publishedDifference = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  return publishedDifference || left.id.localeCompare(right.id);
}

function buildRollingFeed(currentArticles, archivedArticles, limit) {
  const articlesById = new Map();

  for (const article of [...currentArticles, ...archivedArticles]) {
    if (!articlesById.has(article.id)) {
      articlesById.set(article.id, article);
    }
  }

  return [...articlesById.values()]
    .sort(compareNewestFirst)
    .slice(0, limit);
}

export function createNewsService({
  provider,
  repository,
  rollingFeedLimit = DEFAULT_NEWS_FEED_LIMIT,
  cacheTtlMs = DEFAULT_NEWS_CACHE_TTL_MS,
  now = Date.now
} = {}) {
  const resolvedRepository = repository
    ? assertNewsArticleRepository(repository)
    : null;

  if (!Number.isInteger(rollingFeedLimit) || rollingFeedLimit < 1) {
    throw new TypeError('News rolling feed limit must be a positive integer.');
  }

  let cachedArticles = null;
  let cacheExpiresAt = 0;
  let refreshPromise = null;

  async function refreshCache() {
    try {
      const resolvedProvider = provider ?? getDefaultNewsProvider();
      const rawArticles = await resolvedProvider.loadRawArticles();
      const normalizedArticles = rawArticles.map((article) => resolvedProvider.normalizeArticle(article));
      const validation = validateNewsArticles(normalizedArticles);

      if (!validation.valid) {
        throw new Error(`News article data is invalid: ${validation.errors.join('; ')}`);
      }

      let articlesToCache = normalizedArticles;

      if (resolvedRepository) {
        await resolvedRepository.saveArticles(normalizedArticles);
        const archivedArticles = await resolvedRepository.listLatestArticles(rollingFeedLimit);
        const archivedValidation = validateNewsArticles(archivedArticles);

        if (!archivedValidation.valid) {
          throw new Error(
            `Persisted news article data is invalid: ${archivedValidation.errors.join('; ')}`
          );
        }

        articlesToCache = buildRollingFeed(
          normalizedArticles,
          archivedArticles,
          rollingFeedLimit
        );
      }

      cachedArticles = cloneArticles(articlesToCache);
      cacheExpiresAt = now() + cacheTtlMs;
    } catch (error) {
      if (!cachedArticles) {
        throw error;
      }

      // Keep serving the last valid normalized result and defer another provider
      // attempt until the next cache window, avoiding repeated calls during an outage.
      cacheExpiresAt = now() + cacheTtlMs;
    }
  }

  return {
    async listNewsArticles() {
      if (cachedArticles && now() < cacheExpiresAt) {
        return cloneArticles(cachedArticles);
      }

      if (!refreshPromise) {
        refreshPromise = refreshCache().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return cloneArticles(cachedArticles);
    }
  };
}

const defaultNewsService = createNewsService();
const injectedProviderServices = new WeakMap();

export async function listNewsArticles(provider) {
  if (!provider) {
    return defaultNewsService.listNewsArticles();
  }

  if (!injectedProviderServices.has(provider)) {
    injectedProviderServices.set(provider, createNewsService({ provider }));
  }

  return injectedProviderServices.get(provider).listNewsArticles();
}
