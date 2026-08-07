import placeholderNewsProvider from '../providers/news/placeholderNewsProvider.js';
import { validateNewsArticles } from '../utils/newsValidator.js';

export async function listNewsArticles(provider = placeholderNewsProvider) {
  const rawArticles = await provider.loadRawArticles();
  const normalizedArticles = rawArticles.map((article) => provider.normalizeArticle(article));
  const validation = validateNewsArticles(normalizedArticles);

  if (!validation.valid) {
    throw new Error(`News article data is invalid: ${validation.errors.join('; ')}`);
  }

  return normalizedArticles.map((article) => ({
    ...article,
    tickers: [...article.tickers]
  }));
}
