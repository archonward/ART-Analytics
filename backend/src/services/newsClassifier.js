const coverageRules = [
  {
    category: 'Upgrades',
    pattern: /\b(upgrade|upgrades|upgraded|raises? (?:its )?rating|raised to (?:buy|outperform|overweight))\b/i
  },
  {
    category: 'Dividends',
    pattern: /\b(dividend|dividends|ex-dividend|shareholder distribution|cash distribution)\b/i
  },
  {
    category: 'Earnings',
    pattern: /\b(earnings|quarterly results|financial results|earnings call|revenue guidance|profit guidance|eps guidance)\b/i
  },
  {
    category: 'Analyst Ratings',
    pattern: /\b(analyst rating|price target|initiates? coverage|coverage initiated|downgrade|downgraded|reiterates? (?:a )?rating)\b/i
  }
];

const industrySectorRules = [
  { sector: 'Biotech', pattern: /\b(biotech|biotechnology)\b/i },
  { sector: 'Technology', pattern: /\btechnology\b/i },
  { sector: 'Healthcare', pattern: /\b(healthcare|health care)\b/i },
  { sector: 'Financials', pattern: /\b(financial|financial services)\b/i },
  { sector: 'Energy', pattern: /\benergy\b/i },
  { sector: 'Consumer', pattern: /\bconsumer(?: cyclical| defensive| goods)?\b/i }
];

const textSectorRules = [
  { sector: 'Biotech', pattern: /\b(biotech|biotechnology|clinical trial|drug candidate)\b/i },
  { sector: 'Technology', pattern: /\b(technology|semiconductor|chipmaker|chips?|software|cloud computing|artificial intelligence)\b/i },
  { sector: 'Healthcare', pattern: /\b(healthcare|health care|health insurer|medical device|hospital|pharmaceutical)\b/i },
  { sector: 'Financials', pattern: /\b(bank|banking|financial services|property insurer|casualty insurer|life insurer|insurance company|payments network)\b/i },
  { sector: 'Energy', pattern: /\b(oil|natural gas|energy producer|refinery)\b/i },
  { sector: 'Consumer', pattern: /\b(consumer|retail|retailer|restaurant)\b/i }
];

function articleText(article) {
  return [article?.title, article?.description, article?.snippet]
    .filter((value) => typeof value === 'string')
    .join(' ');
}

function matchSector(value, rules) {
  return rules.find((rule) => rule.pattern.test(value))?.sector || null;
}

export function classifyCoverageCategory(article) {
  const text = articleText(article);
  return coverageRules.find((rule) => rule.pattern.test(text))?.category || 'General';
}

export function classifySector(article) {
  const entitySectors = (Array.isArray(article?.entities) ? article.entities : [])
    .filter((entity) => entity?.type === 'equity' && typeof entity.industry === 'string')
    .map((entity) => matchSector(entity.industry, industrySectorRules))
    .filter(Boolean);
  const uniqueEntitySectors = [...new Set(entitySectors)];

  if (uniqueEntitySectors.length === 1) {
    return uniqueEntitySectors[0];
  }

  if (uniqueEntitySectors.length > 1) {
    return 'Unclassified';
  }

  return matchSector(articleText(article), textSectorRules) || 'Unclassified';
}
