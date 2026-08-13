/**
 * Persistence boundary for normalized ART Analytics news articles.
 *
 * @typedef {Object} NewsArticleRepository
 * @property {(articles: object[]) => Promise<void>} saveArticles
 * @property {(limit: number) => Promise<object[]>} listLatestArticles
 */

const requiredMethods = ['saveArticles', 'listLatestArticles'];

export function assertNewsArticleRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new TypeError('News article repository must be an object.');
  }

  for (const method of requiredMethods) {
    if (typeof repository[method] !== 'function') {
      throw new TypeError(`News article repository must implement ${method}().`);
    }
  }

  return repository;
}
