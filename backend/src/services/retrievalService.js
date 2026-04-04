import { getReportChunksByTicker } from './reportChunkService.js';

const DEFAULT_TOP_K = 5;
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'key',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'what',
  'which',
  'with'
]);

export async function retrieveRelevantReportChunks({
  ticker,
  query,
  topK = DEFAULT_TOP_K
}) {
  const chunkResult = await getReportChunksByTicker(ticker);

  if (!chunkResult.found) {
    return chunkResult;
  }

  const queryText = String(query || '').trim();
  const normalizedTopK = normalizeTopK(topK);
  const rankedChunks = rankChunks(chunkResult.chunks, queryText, normalizedTopK);

  return {
    found: true,
    ticker,
    query: queryText,
    totalChunks: chunkResult.chunks.length,
    topK: normalizedTopK,
    results: rankedChunks
  };
}

export function rankChunks(chunks, query, topK = DEFAULT_TOP_K) {
  const preparedQuery = prepareQuery(query);

  if (preparedQuery.tokens.length === 0) {
    return [];
  }

  return chunks
    .map((chunk) => scoreChunk(chunk, preparedQuery))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.chunk.chunkId.localeCompare(right.chunk.chunkId);
    })
    .slice(0, normalizeTopK(topK))
    .map(({ chunk, score, explanation }) => ({
      ...chunk,
      score,
      explanation
    }));
}

function scoreChunk(chunk, preparedQuery) {
  const searchableText = [
    chunk.sectionTitle,
    chunk.subsectionTitle,
    chunk.text
  ]
    .filter(Boolean)
    .join(' ');

  const chunkTokens = tokenize(searchableText);
  const chunkTokenSet = new Set(chunkTokens);
  const matchedTokens = preparedQuery.tokens.filter((token) => chunkTokenSet.has(token));
  const uniqueMatchedTokenCount = new Set(matchedTokens).size;
  const tokenCoverage = uniqueMatchedTokenCount / preparedQuery.tokens.length;
  const queryDensity = uniqueMatchedTokenCount / Math.max(chunkTokenSet.size, preparedQuery.tokens.length);

  const lexicalScore = roundScore((tokenCoverage * 0.65) + (queryDensity * 0.25));
  const phraseBonus = calculatePhraseBonus(chunk, preparedQuery);
  const titleBonus = calculateTitleBonus(chunk, preparedQuery);
  const totalScore = roundScore(lexicalScore + phraseBonus + titleBonus);

  return {
    chunk,
    score: totalScore,
    explanation: {
      matchedTokens: Array.from(new Set(matchedTokens)),
      tokenCoverage: roundScore(tokenCoverage),
      queryDensity: roundScore(queryDensity),
      phraseBonus,
      titleBonus
    }
  };
}

function calculatePhraseBonus(chunk, preparedQuery) {
  const lowerText = [chunk.sectionTitle, chunk.subsectionTitle, chunk.text]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (preparedQuery.normalizedPhrase && lowerText.includes(preparedQuery.normalizedPhrase)) {
    return 0.3;
  }

  const hasBigramMatch = preparedQuery.bigrams.some((bigram) => lowerText.includes(bigram));
  return hasBigramMatch ? 0.15 : 0;
}

function calculateTitleBonus(chunk, preparedQuery) {
  const titleTokens = tokenize([chunk.sectionTitle, chunk.subsectionTitle].filter(Boolean).join(' '));
  const titleTokenSet = new Set(titleTokens);
  const titleMatches = preparedQuery.tokens.filter((token) => titleTokenSet.has(token)).length;

  if (titleMatches === 0) {
    return 0;
  }

  return roundScore(Math.min(0.2, titleMatches * 0.08));
}

function prepareQuery(query) {
  const rawQuery = String(query || '').trim().toLowerCase();
  const tokens = tokenize(rawQuery).filter((token) => !STOP_WORDS.has(token));
  const normalizedPhrase = rawQuery
    .replace(/[^\w\s%/.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    rawQuery,
    normalizedPhrase,
    tokens,
    bigrams: buildBigrams(tokens)
  };
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9%/.-]+/g, ' ')
    .split(/\s+/)
    .map(stemToken)
    .filter(Boolean);
}

function stemToken(token) {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith('ing') && token.length > 5) {
    return token.slice(0, -3);
  }

  if (token.endsWith('ed') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('es') && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

function buildBigrams(tokens) {
  const bigrams = [];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    bigrams.push(`${tokens[index]} ${tokens[index + 1]}`);
  }

  return bigrams;
}

function normalizeTopK(topK) {
  const numericTopK = Number(topK);

  if (!Number.isFinite(numericTopK) || numericTopK <= 0) {
    return DEFAULT_TOP_K;
  }

  return Math.min(Math.floor(numericTopK), 20);
}

function roundScore(value) {
  return Number(value.toFixed(4));
}
