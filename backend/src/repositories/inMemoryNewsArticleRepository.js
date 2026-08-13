import { validateNewsArticle } from '../utils/newsValidator.js';
import { assertNewsArticleRepository } from './newsArticleRepository.js';

function cloneArticle(article) {
  return {
    ...article,
    tickers: [...article.tickers]
  };
}

function assertArticle(article) {
  const validation = validateNewsArticle(article);

  if (!validation.valid) {
    throw new TypeError(`News article data is invalid: ${validation.errors.join('; ')}`);
  }
}

function compareNewestFirst(left, right) {
  const publishedDifference = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  return publishedDifference || left.id.localeCompare(right.id);
}

export function createInMemoryNewsArticleRepository() {
  const articlesById = new Map();

  return assertNewsArticleRepository({
    async saveArticles(articles) {
      if (!Array.isArray(articles)) {
        throw new TypeError('News articles must be an array.');
      }

      for (const article of articles) {
        assertArticle(article);

        if (!articlesById.has(article.id)) {
          articlesById.set(article.id, cloneArticle(article));
        }
      }
    },

    async listLatestArticles(limit) {
      if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError('News article limit must be a positive integer.');
      }

      return [...articlesById.values()]
        .sort(compareNewestFirst)
        .slice(0, limit)
        .map(cloneArticle);
    }
  });
}
