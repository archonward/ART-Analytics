const requiredStringFields = [
  'id',
  'headline',
  'summary',
  'source',
  'publishedAt',
  'url',
  'coverageCategory',
  'sector'
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateNewsArticle(article) {
  const errors = [];

  if (!article || typeof article !== 'object' || Array.isArray(article)) {
    return {
      valid: false,
      errors: ['article must be an object']
    };
  }

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(article[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (isNonEmptyString(article.publishedAt) && Number.isNaN(Date.parse(article.publishedAt))) {
    errors.push('publishedAt must be a valid date-time string');
  }

  if (isNonEmptyString(article.url) && !isValidUrl(article.url)) {
    errors.push('url must be a valid HTTP or HTTPS URL');
  }

  if (!Array.isArray(article.tickers)) {
    errors.push('tickers must be an array');
  } else if (!article.tickers.every(isNonEmptyString)) {
    errors.push('tickers must contain only non-empty strings');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateNewsArticles(articles) {
  if (!Array.isArray(articles)) {
    return {
      valid: false,
      errors: ['articles must be an array']
    };
  }

  const errors = articles.flatMap((article, index) => {
    const validation = validateNewsArticle(article);
    return validation.errors.map((error) => `articles[${index}].${error}`);
  });

  const ids = articles.map((article) => article?.id).filter(isNonEmptyString);
  if (new Set(ids).size !== ids.length) {
    errors.push('article ids must be unique');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
