import { getPublishedReportByTicker } from './reportService.js';

const SECTION_TITLES = {
  meta: 'Report Metadata',
  executiveAtAGlance: 'Executive At A Glance',
  executiveSummary: 'Executive Summary',
  financialPerformanceHealth: 'Financial Performance Health',
  valuation: 'Valuation',
  businessModelMoat: 'Business Model And Moat',
  growthStrategyOutlook: 'Growth Strategy And Outlook',
  managementGovernance: 'Management And Governance',
  riskAnalysis: 'Risk Analysis',
  finalRecommendation: 'Final Recommendation',
  openQuestions: 'Open Questions'
};

export async function getReportChunksByTicker(ticker) {
  const reportResult = await getPublishedReportByTicker(ticker);

  if (!reportResult.found) {
    return reportResult;
  }

  return {
    found: true,
    coverage: reportResult.coverage,
    report: reportResult.report,
    chunks: buildReportChunks(reportResult.report)
  };
}

export function buildReportChunks(report) {
  const ticker = String(report?.meta?.ticker || '').toUpperCase();
  const chunks = [];
  let chunkCounter = 0;

  function addChunk({
    sectionKey,
    sectionTitle,
    subsectionTitle = null,
    text,
    sourcePath
  }) {
    const normalizedText = normalizeChunkText(text);

    if (!ticker || !normalizedText) {
      return;
    }

    chunkCounter += 1;
    chunks.push({
      ticker,
      chunkId: `${ticker}-${String(chunkCounter).padStart(3, '0')}`,
      sectionKey,
      sectionTitle,
      subsectionTitle,
      text: normalizedText,
      sourcePath
    });
  }

  addMetaChunks(report, addChunk);
  addExecutiveAtAGlanceChunks(report, addChunk);
  addExecutiveSummaryChunks(report, addChunk);
  addFinancialPerformanceChunks(report, addChunk);
  addValuationChunks(report, addChunk);
  addBusinessModelChunks(report, addChunk);
  addGrowthStrategyChunks(report, addChunk);
  addManagementChunks(report, addChunk);
  addRiskChunks(report, addChunk);
  addFinalRecommendationChunks(report, addChunk);
  addOpenQuestionChunks(report, addChunk);

  return chunks;
}

function addMetaChunks(report, addChunk) {
  const meta = report?.meta;
  if (!meta || typeof meta !== 'object') {
    return;
  }

  const entries = Object.entries(meta)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .map(([key, value]) => `${humanizeKey(key)}: ${String(value)}`);

  if (entries.length > 0) {
    addChunk({
      sectionKey: 'meta',
      sectionTitle: SECTION_TITLES.meta,
      subsectionTitle: null,
      text: entries.join('. '),
      sourcePath: 'meta'
    });
  }
}

function addExecutiveAtAGlanceChunks(report, addChunk) {
  const sectionKey = 'executiveAtAGlance';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addStringChunk(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Thesis Headline',
    text: section.thesisHeadline,
    sourcePath: `${sectionKey}.thesisHeadline`
  });

  const metrics = Array.isArray(section.snapshotMetrics)
    ? section.snapshotMetrics
        .filter((item) => item && item.label && item.value)
        .map((item) => `${item.label} is ${item.value}`)
    : [];

  if (metrics.length > 0) {
    addChunk({
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Snapshot Metrics',
      text: metrics.join('. '),
      sourcePath: `${sectionKey}.snapshotMetrics`
    });
  }
}

function addExecutiveSummaryChunks(report, addChunk) {
  const sectionKey = 'executiveSummary';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addParagraphChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Summary',
    paragraphs: section.summaryParagraphs,
    sourcePath: `${sectionKey}.summaryParagraphs`
  });

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Catalysts',
    items: section.catalysts,
    sourcePath: `${sectionKey}.catalysts`
  });

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Primary Risks',
    items: section.primaryRisks,
    sourcePath: `${sectionKey}.primaryRisks`
  });

  addStringChunk(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Valuation Bridge',
    text: section.valuationBridge,
    sourcePath: `${sectionKey}.valuationBridge`
  });
}

function addFinancialPerformanceChunks(report, addChunk) {
  const sectionKey = 'financialPerformanceHealth';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Income Statement Analysis',
    analysis: section.incomeStatementAnalysis,
    sourcePath: `${sectionKey}.incomeStatementAnalysis`
  });

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Balance Sheet Analysis',
    analysis: section.balanceSheetAnalysis,
    sourcePath: `${sectionKey}.balanceSheetAnalysis`
  });

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Cash Flow And Returns',
    analysis: section.cashFlowReturns,
    sourcePath: `${sectionKey}.cashFlowReturns`
  });
}

function addValuationChunks(report, addChunk) {
  const sectionKey = 'valuation';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Multiples Analysis',
    analysis: section.multiplesAnalysis,
    sourcePath: `${sectionKey}.multiplesAnalysis`
  });

  const dcf = section.dcfAnalysis;
  if (dcf && typeof dcf === 'object') {
    addParagraphChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'DCF Analysis',
      paragraphs: dcf.summaryParagraphs,
      sourcePath: `${sectionKey}.dcfAnalysis.summaryParagraphs`
    });

    addBulletChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'DCF Assumptions',
      items: dcf.assumptions,
      sourcePath: `${sectionKey}.dcfAnalysis.assumptions`
    });

    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'DCF Projection Table',
      table: dcf.projectionTable,
      sourcePath: `${sectionKey}.dcfAnalysis.projectionTable`
    });

    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'DCF Scenario Table',
      table: dcf.scenarioTable,
      sourcePath: `${sectionKey}.dcfAnalysis.scenarioTable`
    });
  }

  addStringChunk(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Valuation Conclusion',
    text: section.valuationConclusion,
    sourcePath: `${sectionKey}.valuationConclusion`
  });
}

function addBusinessModelChunks(report, addChunk) {
  const sectionKey = 'businessModelMoat';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  const segmentProfile = section.segmentProfile;
  if (segmentProfile && typeof segmentProfile === 'object') {
    addParagraphChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Segment Profile',
      paragraphs: segmentProfile.summaryParagraphs,
      sourcePath: `${sectionKey}.segmentProfile.summaryParagraphs`
    });

    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Segment Table',
      table: segmentProfile.segmentTable,
      sourcePath: `${sectionKey}.segmentProfile.segmentTable`
    });
  }

  const moat = section.economicMoatAssessment;
  if (moat && typeof moat === 'object') {
    addParagraphChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Economic Moat Assessment',
      paragraphs: moat.summaryParagraphs,
      sourcePath: `${sectionKey}.economicMoatAssessment.summaryParagraphs`
    });

    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Moat Table',
      table: moat.moatTable,
      sourcePath: `${sectionKey}.economicMoatAssessment.moatTable`
    });

    addStringChunk(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Overall Moat Conclusion',
      text: moat.overallMoatConclusion,
      sourcePath: `${sectionKey}.economicMoatAssessment.overallMoatConclusion`
    });
  }
}

function addGrowthStrategyChunks(report, addChunk) {
  const sectionKey = 'growthStrategyOutlook';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Near Term Catalysts',
    items: section.nearTermCatalysts,
    sourcePath: `${sectionKey}.nearTermCatalysts`
  });

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Medium Term Drivers',
    items: section.mediumTermDrivers,
    sourcePath: `${sectionKey}.mediumTermDrivers`
  });

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Long Term Opportunities',
    items: section.longTermOpportunities,
    sourcePath: `${sectionKey}.longTermOpportunities`
  });

  const tamPositioning = section.tamPositioning;
  if (tamPositioning && typeof tamPositioning === 'object') {
    addParagraphChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'TAM Positioning',
      paragraphs: tamPositioning.summaryParagraphs,
      sourcePath: `${sectionKey}.tamPositioning.summaryParagraphs`
    });

    addBulletChunks(addChunk, {
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'TAM Highlights',
      items: tamPositioning.highlights,
      sourcePath: `${sectionKey}.tamPositioning.highlights`
    });
  }
}

function addManagementChunks(report, addChunk) {
  const sectionKey = 'managementGovernance';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Leadership',
    analysis: section.leadership,
    sourcePath: `${sectionKey}.leadership`
  });

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Capital Allocation',
    analysis: section.capitalAllocation,
    sourcePath: `${sectionKey}.capitalAllocation`
  });

  addNestedAnalysisChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Alignment',
    analysis: section.alignment,
    sourcePath: `${sectionKey}.alignment`
  });
}

function addRiskChunks(report, addChunk) {
  const sectionKey = 'riskAnalysis';
  const table = report?.[sectionKey]?.riskTable;

  addTableChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Risk Table',
    table,
    sourcePath: `${sectionKey}.riskTable`
  });
}

function addFinalRecommendationChunks(report, addChunk) {
  const sectionKey = 'finalRecommendation';
  const section = report?.[sectionKey];
  if (!section || typeof section !== 'object') {
    return;
  }

  const overviewParts = [
    section.rating ? `Rating is ${section.rating}` : null,
    section.priceTarget ? `Price target is ${section.priceTarget}` : null,
    section.impliedUpsidePct ? `Implied upside is ${section.impliedUpsidePct}` : null,
    section.valuationMethodology
      ? `Valuation methodology is ${section.valuationMethodology}`
      : null
  ].filter(Boolean);

  if (overviewParts.length > 0) {
    addChunk({
      sectionKey,
      sectionTitle: SECTION_TITLES[sectionKey],
      subsectionTitle: 'Recommendation Overview',
      text: overviewParts.join('. '),
      sourcePath: `${sectionKey}`
    });
  }

  const bullBaseBear = section.bullBaseBear;
  if (bullBaseBear && typeof bullBaseBear === 'object') {
    const scenarioText = [
      bullBaseBear.bull ? `Bull case is ${bullBaseBear.bull}` : null,
      bullBaseBear.base ? `Base case is ${bullBaseBear.base}` : null,
      bullBaseBear.bear ? `Bear case is ${bullBaseBear.bear}` : null
    ].filter(Boolean);

    if (scenarioText.length > 0) {
      addChunk({
        sectionKey,
        sectionTitle: SECTION_TITLES[sectionKey],
        subsectionTitle: 'Bull Base Bear',
        text: scenarioText.join('. '),
        sourcePath: `${sectionKey}.bullBaseBear`
      });
    }
  }

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Five Key Metrics To Watch',
    items: section.fiveKeyMetricsToWatch,
    sourcePath: `${sectionKey}.fiveKeyMetricsToWatch`
  });

  if (Array.isArray(section.ratingChangeTriggers)) {
    section.ratingChangeTriggers.forEach((trigger, index) => {
      if (!trigger || typeof trigger !== 'object') {
        return;
      }

      const triggerText = [
        trigger.action || null,
        trigger.direction ? `(${trigger.direction})` : null,
        trigger.trigger || null
      ].filter(Boolean).join(' ');

      addStringChunk(addChunk, {
        sectionKey,
        sectionTitle: SECTION_TITLES[sectionKey],
        subsectionTitle: 'Rating Change Triggers',
        text: triggerText,
        sourcePath: `${sectionKey}.ratingChangeTriggers[${index}]`
      });
    });
  }

  addStringChunk(addChunk, {
    sectionKey,
    sectionTitle: SECTION_TITLES[sectionKey],
    subsectionTitle: 'Closing Paragraph',
    text: section.closingParagraph,
    sourcePath: `${sectionKey}.closingParagraph`
  });
}

function addOpenQuestionChunks(report, addChunk) {
  addBulletChunks(addChunk, {
    sectionKey: 'openQuestions',
    sectionTitle: SECTION_TITLES.openQuestions,
    subsectionTitle: null,
    items: report?.openQuestions,
    sourcePath: 'openQuestions'
  });
}

function addNestedAnalysisChunks(addChunk, {
  sectionKey,
  sectionTitle,
  subsectionTitle,
  analysis,
  sourcePath
}) {
  if (!analysis || typeof analysis !== 'object') {
    return;
  }

  addParagraphChunks(addChunk, {
    sectionKey,
    sectionTitle,
    subsectionTitle,
    paragraphs: analysis.summaryParagraphs,
    sourcePath: `${sourcePath}.summaryParagraphs`
  });

  addBulletChunks(addChunk, {
    sectionKey,
    sectionTitle,
    subsectionTitle: `${subsectionTitle} Highlights`,
    items: analysis.highlights,
    sourcePath: `${sourcePath}.highlights`
  });

  if (Array.isArray(analysis.tables)) {
    analysis.tables.forEach((table, index) => {
      addTableChunks(addChunk, {
        sectionKey,
        sectionTitle,
        subsectionTitle,
        table,
        sourcePath: `${sourcePath}.tables[${index}]`
      });
    });
  }

  if (analysis.segmentTable) {
    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle,
      table: analysis.segmentTable,
      sourcePath: `${sourcePath}.segmentTable`
    });
  }

  if (analysis.moatTable) {
    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle,
      table: analysis.moatTable,
      sourcePath: `${sourcePath}.moatTable`
    });
  }

  if (analysis.acquisitionTable) {
    addTableChunks(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle,
      table: analysis.acquisitionTable,
      sourcePath: `${sourcePath}.acquisitionTable`
    });
  }
}

function addParagraphChunks(addChunk, {
  sectionKey,
  sectionTitle,
  subsectionTitle,
  paragraphs,
  sourcePath
}) {
  if (!Array.isArray(paragraphs)) {
    return;
  }

  paragraphs.forEach((paragraph, index) => {
    addStringChunk(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle,
      text: paragraph,
      sourcePath: `${sourcePath}[${index}]`
    });
  });
}

function addBulletChunks(addChunk, {
  sectionKey,
  sectionTitle,
  subsectionTitle,
  items,
  sourcePath
}) {
  if (!Array.isArray(items)) {
    return;
  }

  items.forEach((item, index) => {
    addStringChunk(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle,
      text: normalizeBulletItem(item),
      sourcePath: `${sourcePath}[${index}]`
    });
  });
}

function addTableChunks(addChunk, {
  sectionKey,
  sectionTitle,
  subsectionTitle,
  table,
  sourcePath
}) {
  if (!table || typeof table !== 'object' || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    return;
  }

  table.rows.forEach((row, index) => {
    const rowText = tableRowToSentence(table, row);

    addStringChunk(addChunk, {
      sectionKey,
      sectionTitle,
      subsectionTitle: table.title || subsectionTitle,
      text: rowText,
      sourcePath: `${sourcePath}.rows[${index}]`
    });
  });
}

function addStringChunk(addChunk, chunk) {
  if (typeof chunk.text !== 'string') {
    return;
  }

  addChunk(chunk);
}

function tableRowToSentence(table, row) {
  const titlePrefix = table.title ? `${table.title}. ` : '';
  const pairs = table.columns
    .map((column, index) => {
      const value = row[index];
      if (typeof value !== 'string' || !value.trim()) {
        return null;
      }

      return `${column}: ${value}`;
    })
    .filter(Boolean);

  return `${titlePrefix}${pairs.join('. ')}.`;
}

function normalizeBulletItem(item) {
  if (typeof item !== 'string') {
    return '';
  }

  return item.replace(/^[\s*-]+/, '').trim();
}

function normalizeChunkText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function humanizeKey(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}
