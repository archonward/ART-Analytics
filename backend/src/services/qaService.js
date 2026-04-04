import { retrieveRelevantReportChunks } from './retrievalService.js';

const DEFAULT_TOP_K = 5;
const DEFAULT_MAX_CITATIONS = 3;
const MIN_USEFUL_SCORE = 0.24;

const INTENT_CONFIG = {
  risks: {
    preferredSectionKeys: ['riskAnalysis', 'executiveSummary', 'finalRecommendation'],
    preferredSubsectionTokens: ['risk', 'primary risk'],
    answerLead: 'The report highlights'
  },
  valuation: {
    preferredSectionKeys: ['valuation', 'executiveSummary', 'finalRecommendation', 'executiveAtAGlance'],
    preferredSubsectionTokens: ['valuation', 'dcf', 'multiple', 'thesis headline'],
    answerLead: 'The report supports the valuation with'
  },
  ratingChange: {
    preferredSectionKeys: ['finalRecommendation', 'executiveSummary', 'riskAnalysis'],
    preferredSubsectionTokens: ['rating change trigger', 'bull base bear', 'recommendation overview'],
    answerLead: 'The report says the rating could change if'
  },
  moat: {
    preferredSectionKeys: ['businessModelMoat', 'growthStrategyOutlook'],
    preferredSubsectionTokens: ['moat', 'economic moat assessment', 'overall moat conclusion'],
    answerLead: 'The report describes the moat as'
  },
  growth: {
    preferredSectionKeys: ['growthStrategyOutlook', 'executiveSummary', 'businessModelMoat'],
    preferredSubsectionTokens: ['catalyst', 'driver', 'opportunit', 'tam'],
    answerLead: 'The report points to'
  },
  management: {
    preferredSectionKeys: ['managementGovernance', 'finalRecommendation'],
    preferredSubsectionTokens: ['leadership', 'capital allocation', 'alignment'],
    answerLead: 'The report describes management as'
  },
  recommendation: {
    preferredSectionKeys: ['finalRecommendation', 'executiveAtAGlance', 'executiveSummary'],
    preferredSubsectionTokens: ['recommendation overview', 'closing paragraph', 'bull base bear'],
    answerLead: 'The report\'s recommendation is'
  },
  general: {
    preferredSectionKeys: [
      'executiveSummary',
      'finalRecommendation',
      'valuation',
      'riskAnalysis',
      'growthStrategyOutlook',
      'businessModelMoat',
      'managementGovernance'
    ],
    preferredSubsectionTokens: [],
    answerLead: 'Based on the retrieved sections,'
  }
};

export async function answerReportQuestion({
  ticker,
  question,
  topK = DEFAULT_TOP_K,
  maxCitations = DEFAULT_MAX_CITATIONS
}) {
  const normalizedTopK = normalizePositiveInteger(topK, DEFAULT_TOP_K, 20);
  const normalizedMaxCitations = normalizePositiveInteger(maxCitations, DEFAULT_MAX_CITATIONS, 5);
  const retrievalResult = await retrieveRelevantReportChunks({
    ticker,
    query: question,
    topK: normalizedTopK
  });

  if (!retrievalResult.found) {
    return retrievalResult;
  }

  const intent = detectIntent(question);
  const usableEvidence = selectUsableEvidence(retrievalResult.results, intent);

  if (!hasSufficientSupport(intent, usableEvidence)) {
    return {
      found: true,
      ticker,
      question: String(question || '').trim(),
      answer: 'The report does not clearly specify this based on the retrieved sections.',
      grounded: false,
      citations: [],
      meta: {
        intent: intent.key,
        topKUsed: retrievalResult.topK,
        retrievedCount: retrievalResult.results.length
      }
    };
  }

  const citations = usableEvidence
    .slice(0, normalizedMaxCitations)
    .map((chunk) => buildCitation(chunk));

  return {
    found: true,
    ticker,
    question: String(question || '').trim(),
    answer: synthesizeAnswer({
      question,
      intent,
      evidence: usableEvidence,
      citations
    }),
    grounded: true,
    citations,
    meta: {
      intent: intent.key,
      topKUsed: retrievalResult.topK,
      retrievedCount: retrievalResult.results.length
    }
  };
}

export function detectIntent(question) {
  const normalizedQuestion = String(question || '').toLowerCase();
  const checks = [
    {
      key: 'ratingChange',
      patterns: ['change the rating', 'change rating', 'rating trigger', 'downgrade', 'upgrade']
    },
    {
      key: 'risks',
      patterns: ['risk', 'risks', 'downside', 'what could go wrong']
    },
    {
      key: 'valuation',
      patterns: ['valuation', 'valued', 'price target', 'supports the valuation', 'dcf', 'multiple']
    },
    {
      key: 'moat',
      patterns: ['moat', 'competitive advantage', 'competitive position', 'why is it defensible']
    },
    {
      key: 'growth',
      patterns: ['growth', 'outlook', 'driver', 'catalyst', 'opportunity', 'tam']
    },
    {
      key: 'management',
      patterns: ['management', 'governance', 'leadership', 'capital allocation']
    },
    {
      key: 'recommendation',
      patterns: ['rating', 'recommendation', 'buy', 'sell', 'hold', 'thesis']
    }
  ];

  const match = checks.find((entry) =>
    entry.patterns.some((pattern) => normalizedQuestion.includes(pattern))
  );

  const key = match?.key || 'general';

  return {
    key,
    ...INTENT_CONFIG[key]
  };
}

export function selectUsableEvidence(results, intent) {
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  const reranked = results
    .map((chunk) => ({
      chunk,
      adjustedScore: adjustScoreForIntent(chunk, intent)
    }))
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) {
        return right.adjustedScore - left.adjustedScore;
      }

      return right.chunk.score - left.chunk.score;
    })
    .map(({ chunk, adjustedScore }) => ({
      ...chunk,
      adjustedScore: roundScore(adjustedScore)
    }));

  const selected = [];
  const seenTexts = new Set();

  for (const chunk of reranked) {
    if (chunk.adjustedScore < MIN_USEFUL_SCORE) {
      continue;
    }

    if (intent.key === 'general' && chunk.explanation?.matchedTokens?.length < 2) {
      continue;
    }

    const dedupeKey = normalizeForDedup(chunk.text);
    if (!dedupeKey || seenTexts.has(dedupeKey)) {
      continue;
    }

    selected.push(chunk);
    seenTexts.add(dedupeKey);

    if (selected.length >= 4) {
      break;
    }
  }

  return selected;
}

export function synthesizeAnswer({
  question,
  intent,
  evidence,
  citations
}) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return 'The report does not clearly specify this based on the retrieved sections.';
  }

  switch (intent.key) {
    case 'risks':
      return buildIntentAnswer(intent.answerLead, extractRiskPoints(evidence));
    case 'valuation':
      return buildIntentAnswer(intent.answerLead, extractValuationPoints(evidence));
    case 'ratingChange':
      return buildIntentAnswer(intent.answerLead, extractRatingChangePoints(evidence));
    case 'moat':
      return buildIntentAnswer(intent.answerLead, extractMoatPoints(evidence));
    case 'growth':
      return buildIntentAnswer(intent.answerLead, extractGrowthPoints(evidence));
    case 'management':
      return buildIntentAnswer(intent.answerLead, extractManagementPoints(evidence));
    case 'recommendation':
      return buildIntentAnswer(intent.answerLead, extractRecommendationPoints(evidence));
    default:
      return buildGeneralAnswer(question, evidence, citations);
  }
}

function adjustScoreForIntent(chunk, intent) {
  let adjustedScore = chunk.score;

  if (intent.preferredSectionKeys.includes(chunk.sectionKey)) {
    adjustedScore += 0.18;
  }

  const subsection = String(chunk.subsectionTitle || '').toLowerCase();
  const sectionTitle = String(chunk.sectionTitle || '').toLowerCase();

  if (
    intent.preferredSubsectionTokens.some((token) =>
      subsection.includes(token) || sectionTitle.includes(token)
    )
  ) {
    adjustedScore += 0.12;
  }

  return adjustedScore;
}

function extractRiskPoints(evidence) {
  const riskTableRows = evidence
    .filter((chunk) => chunk.sectionKey === 'riskAnalysis')
    .map((chunk) => formatRiskRow(chunk.text));

  const summaryRisks = evidence
    .filter((chunk) => chunk.subsectionTitle === 'Primary Risks')
    .map((chunk) => chunk.text);

  return dedupePoints([
    ...summaryRisks,
    ...riskTableRows
  ]);
}

function extractValuationPoints(evidence) {
  return dedupePoints(
    evidence.map((chunk) => {
      if (chunk.subsectionTitle === 'DCF Assumptions') {
        return chunk.text;
      }

      if (chunk.subsectionTitle === 'Valuation Conclusion') {
        return chunk.text;
      }

      if (chunk.subsectionTitle === 'Recommendation Overview') {
        return chunk.text;
      }

      return chunk.text;
    })
  );
}

function extractRatingChangePoints(evidence) {
  const triggerPoints = evidence
    .filter((chunk) => chunk.subsectionTitle === 'Rating Change Triggers')
    .map((chunk) => chunk.text);

  if (triggerPoints.length > 0) {
    return dedupePoints(triggerPoints);
  }

  return dedupePoints(evidence.map((chunk) => chunk.text));
}

function extractMoatPoints(evidence) {
  const moatConclusion = evidence
    .filter((chunk) => chunk.subsectionTitle === 'Overall Moat Conclusion')
    .map((chunk) => chunk.text);

  const moatSummaries = evidence
    .filter((chunk) => chunk.subsectionTitle === 'Economic Moat Assessment')
    .map((chunk) => chunk.text);

  const moatDetails = evidence
    .filter((chunk) => String(chunk.subsectionTitle || '').toLowerCase().includes('moat'))
    .map((chunk) => formatMoatRow(chunk.text));

  return dedupePoints([...moatConclusion, ...moatSummaries, ...moatDetails]);
}

function extractGrowthPoints(evidence) {
  return dedupePoints(
    evidence.map((chunk) => {
      if (chunk.subsectionTitle && chunk.subsectionTitle !== 'TAM Positioning') {
        return chunk.text;
      }

      return chunk.text;
    })
  );
}

function extractManagementPoints(evidence) {
  return dedupePoints(evidence.map((chunk) => chunk.text));
}

function extractRecommendationPoints(evidence) {
  return dedupePoints(evidence.map((chunk) => chunk.text));
}

function buildIntentAnswer(leadIn, points) {
  const cleanedPoints = dedupePoints(points).slice(0, 3);

  if (cleanedPoints.length === 0) {
    return 'The report does not clearly specify this based on the retrieved sections.';
  }

  if (cleanedPoints.length === 1) {
    return `${leadIn} ${ensureSentence(cleanedPoints[0])}`.trim();
  }

  const [first, second, third] = cleanedPoints;
  const fragments = [
    `${leadIn} ${stripTrailingPeriod(first)}`,
    second ? `It also notes ${stripTrailingPeriod(lowercaseFirst(second))}` : null,
    third ? `In addition, ${stripTrailingPeriod(lowercaseFirst(third))}` : null
  ].filter(Boolean);

  return fragments.map(ensureSentence).join(' ');
}

function buildGeneralAnswer(question, evidence, citations) {
  const summaryPoints = dedupePoints(evidence.map((chunk) => chunk.text)).slice(0, 2);

  if (summaryPoints.length === 0) {
    return 'The report does not clearly specify this based on the retrieved sections.';
  }

  const answer = [
    `Based on the retrieved sections for "${String(question || '').trim()}", ${stripTrailingPeriod(lowercaseFirst(summaryPoints[0]))}.`,
    summaryPoints[1] ? `It also states ${stripTrailingPeriod(lowercaseFirst(summaryPoints[1]))}.` : null,
    citations.length === 0 ? 'The report does not clearly provide stronger support beyond this.' : null
  ].filter(Boolean);

  return answer.join(' ');
}

function buildCitation(chunk) {
  return {
    chunkId: chunk.chunkId,
    sectionKey: chunk.sectionKey,
    sectionTitle: chunk.sectionTitle,
    subsectionTitle: chunk.subsectionTitle,
    snippet: buildSnippet(chunk.text)
  };
}

function hasSufficientSupport(intent, evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return false;
  }

  if (intent.key !== 'general') {
    return true;
  }

  return evidence.some((chunk) => {
    const matchedTokens = chunk.explanation?.matchedTokens?.length || 0;
    return chunk.adjustedScore >= 0.42 && matchedTokens >= 2;
  });
}

function dedupePoints(points) {
  const seen = new Set();
  const deduped = [];

  for (const point of points) {
    const normalized = normalizeForDedup(point);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(point.trim());
  }

  return deduped;
}

function normalizeForDedup(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTableLead(text) {
  return String(text || '').replace(/^[^.]+\.\s*/, '').trim();
}

function formatRiskRow(text) {
  const risk = extractField(text, 'Risk');
  const probability = extractField(text, 'Probability');
  const impact = extractField(text, 'Impact');
  const mitigation = extractField(text, 'Mitigation');

  const parts = [
    risk,
    probability ? `with ${probability.toLowerCase()} probability` : null,
    impact ? `and ${impact.toLowerCase()} impact` : null,
    mitigation ? `mitigated by ${lowercaseFirst(mitigation)}` : null
  ].filter(Boolean);

  if (parts.length === 0) {
    return cleanTableLead(text);
  }

  return parts.join(' ');
}

function formatMoatRow(text) {
  const moatSource = extractField(text, 'Moat Source');
  const strength = extractField(text, 'Strength');
  const explanation = extractField(text, 'Explanation');

  if (moatSource || strength || explanation) {
    return [
      moatSource ? `${moatSource}` : null,
      strength ? `is rated ${strength.toLowerCase()}` : null,
      explanation ? `because ${lowercaseFirst(explanation)}` : null
    ].filter(Boolean).join(' ');
  }

  return cleanTableLead(text);
}

function extractField(text, fieldName) {
  const pattern = new RegExp(`${escapeRegExp(fieldName)}:\\s*([^.]*)`, 'i');
  const match = String(text || '').match(pattern);
  return match?.[1]?.trim() || '';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lowercaseFirst(text) {
  const value = String(text || '').trim();
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function stripTrailingPeriod(text) {
  return String(text || '').trim().replace(/[.]+$/, '');
}

function ensureSentence(text) {
  const value = String(text || '').trim();

  if (!value) {
    return '';
  }

  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function buildSnippet(text, maxLength = 180) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function normalizePositiveInteger(value, fallback, max) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(numericValue), max);
}

function roundScore(value) {
  return Number(value.toFixed(4));
}
