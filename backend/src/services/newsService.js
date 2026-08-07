import placeholderNewsArticles from '../data/placeholderNewsArticles.js';
import { validateNewsArticles } from '../utils/newsValidator.js';

export async function listNewsArticles() {
  const validation = validateNewsArticles(placeholderNewsArticles);

  if (!validation.valid) {
    throw new Error(`News article data is invalid: ${validation.errors.join('; ')}`);
  }

  return placeholderNewsArticles.map((article) => ({
    ...article,
    tickers: [...article.tickers]
  }));
}
