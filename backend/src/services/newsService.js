import marketauxNewsProvider from '../providers/news/marketauxNewsProvider.js';
import placeholderNewsProvider from '../providers/news/placeholderNewsProvider.js';
import { validateNewsArticles } from '../utils/newsValidator.js';

export const DEFAULT_NEWS_CACHE_TTL_MS = 12 * 60 * 1000;

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

export function createNewsService({
  provider,
  cacheTtlMs = DEFAULT_NEWS_CACHE_TTL_MS,
  now = Date.now
} = {}) {
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

      cachedArticles = cloneArticles(normalizedArticles);
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
