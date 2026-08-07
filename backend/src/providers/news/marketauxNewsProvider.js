const marketauxNewsUrl = 'https://api.marketaux.com/v1/news/all';
const defaultArticleLimit = 10;

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function extractMarketauxTickers(entities) {
  if (!Array.isArray(entities)) {
    return [];
  }

  const symbols = entities
    .filter((entity) => entity?.type === 'equity' && nonEmptyString(entity.symbol))
    .map((entity) => entity.symbol.trim().toUpperCase());

  return [...new Set(symbols)];
}

export function normalizeMarketauxArticle(article) {
  return {
    id: article.uuid,
    headline: article.title,
    summary: article.description || article.snippet || 'Summary unavailable.',
    source: article.source || 'Marketaux',
    publishedAt: article.published_at,
    url: article.url,
    coverageCategory: 'General',
    sector: 'Unclassified',
    tickers: extractMarketauxTickers(article.entities)
  };
}

export function createMarketauxNewsProvider({
  apiToken,
  fetchImpl = globalThis.fetch,
  articleLimit = defaultArticleLimit
} = {}) {
  return {
    async loadRawArticles() {
      const resolvedToken = apiToken ?? process.env.MARKETAUX_API_TOKEN;

      if (!resolvedToken) {
        throw new Error('MARKETAUX_API_TOKEN is not configured.');
      }

      const url = new URL(marketauxNewsUrl);
      url.searchParams.set('api_token', resolvedToken);
      url.searchParams.set('language', 'en');
      url.searchParams.set('entity_types', 'equity');
      url.searchParams.set('must_have_entities', 'true');
      url.searchParams.set('filter_entities', 'true');
      url.searchParams.set('limit', String(articleLimit));

      const response = await fetchImpl(url, {
        headers: {
          accept: 'application/json'
        }
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error('Marketaux returned an invalid JSON response.');
      }

      if (!response.ok) {
        const providerMessage = payload?.error?.message;
        const detail = providerMessage ? `: ${providerMessage}` : '';
        throw new Error(`Marketaux request failed with status ${response.status}${detail}`);
      }

      if (!Array.isArray(payload?.data)) {
        throw new Error('Marketaux response did not include an article array.');
      }

      return payload.data;
    },
    normalizeArticle: normalizeMarketauxArticle
  };
}

const marketauxNewsProvider = createMarketauxNewsProvider();

export default marketauxNewsProvider;
