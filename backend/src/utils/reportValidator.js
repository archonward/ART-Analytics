function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isMetricArray(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        isNonEmptyString(item.label) &&
        isNonEmptyString(item.value)
    )
  );
}

function isTable(value) {
  if (value === null) {
    return true;
  }

  return (
    value &&
    typeof value === 'object' &&
    isNonEmptyString(value.title) &&
    Array.isArray(value.columns) &&
    value.columns.every((column) => typeof column === 'string') &&
    Array.isArray(value.rows) &&
    value.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.every((cell) => typeof cell === 'string')
    )
  );
}

function isRatingTriggerArray(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        isNonEmptyString(item.action) &&
        isNonEmptyString(item.direction) &&
        isNonEmptyString(item.trigger)
    )
  );
}

function requireField(condition, path, errors, expectation) {
  if (!condition) {
    errors.push(`${path} must be ${expectation}`);
  }
}

export function validateReportSchema(report) {
  const errors = [];

  requireField(report && typeof report === 'object', 'report', errors, 'an object');

  if (!report || typeof report !== 'object') {
    return {
      valid: false,
      errors
    };
  }

  requireField(report.meta && typeof report.meta === 'object', 'meta', errors, 'an object');
  requireField(isNonEmptyString(report.meta?.ticker), 'meta.ticker', errors, 'a non-empty string');
  requireField(
    isNonEmptyString(report.meta?.companyName),
    'meta.companyName',
    errors,
    'a non-empty string'
  );
  requireField(isNonEmptyString(report.meta?.exchange), 'meta.exchange', errors, 'a non-empty string');
  requireField(isNonEmptyString(report.meta?.sector), 'meta.sector', errors, 'a non-empty string');
  requireField(
    isNonEmptyString(report.meta?.reportDate),
    'meta.reportDate',
    errors,
    'a non-empty string'
  );

  requireField(
    report.executiveAtAGlance && typeof report.executiveAtAGlance === 'object',
    'executiveAtAGlance',
    errors,
    'an object'
  );
  requireField(
    isNonEmptyString(report.executiveAtAGlance?.thesisHeadline),
    'executiveAtAGlance.thesisHeadline',
    errors,
    'a non-empty string'
  );
  requireField(
    isMetricArray(report.executiveAtAGlance?.snapshotMetrics),
    'executiveAtAGlance.snapshotMetrics',
    errors,
    'an array of {label, value} objects'
  );

  requireField(
    report.executiveSummary && typeof report.executiveSummary === 'object',
    'executiveSummary',
    errors,
    'an object'
  );
  requireField(
    isStringArray(report.executiveSummary?.summaryParagraphs),
    'executiveSummary.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.executiveSummary?.catalysts),
    'executiveSummary.catalysts',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.executiveSummary?.primaryRisks),
    'executiveSummary.primaryRisks',
    errors,
    'an array of strings'
  );
  requireField(
    isNonEmptyString(report.executiveSummary?.valuationBridge),
    'executiveSummary.valuationBridge',
    errors,
    'a non-empty string'
  );

  requireField(
    report.financialPerformanceHealth && typeof report.financialPerformanceHealth === 'object',
    'financialPerformanceHealth',
    errors,
    'an object'
  );
  requireField(
    isStringArray(report.financialPerformanceHealth?.incomeStatementAnalysis?.summaryParagraphs),
    'financialPerformanceHealth.incomeStatementAnalysis.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.financialPerformanceHealth?.incomeStatementAnalysis?.highlights),
    'financialPerformanceHealth.incomeStatementAnalysis.highlights',
    errors,
    'an array of strings'
  );
  requireField(
    Array.isArray(report.financialPerformanceHealth?.incomeStatementAnalysis?.tables) &&
      report.financialPerformanceHealth.incomeStatementAnalysis.tables.every(isTable),
    'financialPerformanceHealth.incomeStatementAnalysis.tables',
    errors,
    'an array of valid tables'
  );
  requireField(
    isStringArray(report.financialPerformanceHealth?.balanceSheetAnalysis?.summaryParagraphs),
    'financialPerformanceHealth.balanceSheetAnalysis.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.financialPerformanceHealth?.cashFlowReturns?.summaryParagraphs),
    'financialPerformanceHealth.cashFlowReturns.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.financialPerformanceHealth?.cashFlowReturns?.highlights),
    'financialPerformanceHealth.cashFlowReturns.highlights',
    errors,
    'an array of strings'
  );

  requireField(report.valuation && typeof report.valuation === 'object', 'valuation', errors, 'an object');
  requireField(
    isStringArray(report.valuation?.multiplesAnalysis?.summaryParagraphs),
    'valuation.multiplesAnalysis.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    Array.isArray(report.valuation?.multiplesAnalysis?.tables) &&
      report.valuation.multiplesAnalysis.tables.every(isTable),
    'valuation.multiplesAnalysis.tables',
    errors,
    'an array of valid tables'
  );
  requireField(
    isStringArray(report.valuation?.dcfAnalysis?.summaryParagraphs),
    'valuation.dcfAnalysis.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.valuation?.dcfAnalysis?.assumptions),
    'valuation.dcfAnalysis.assumptions',
    errors,
    'an array of strings'
  );
  requireField(
    isTable(report.valuation?.dcfAnalysis?.projectionTable),
    'valuation.dcfAnalysis.projectionTable',
    errors,
    'null or a valid table'
  );
  requireField(
    isTable(report.valuation?.dcfAnalysis?.scenarioTable),
    'valuation.dcfAnalysis.scenarioTable',
    errors,
    'null or a valid table'
  );
  requireField(
    isNonEmptyString(report.valuation?.valuationConclusion),
    'valuation.valuationConclusion',
    errors,
    'a non-empty string'
  );

  requireField(
    report.businessModelMoat && typeof report.businessModelMoat === 'object',
    'businessModelMoat',
    errors,
    'an object'
  );
  requireField(
    isStringArray(report.businessModelMoat?.segmentProfile?.summaryParagraphs),
    'businessModelMoat.segmentProfile.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isTable(report.businessModelMoat?.segmentProfile?.segmentTable),
    'businessModelMoat.segmentProfile.segmentTable',
    errors,
    'null or a valid table'
  );
  requireField(
    isStringArray(report.businessModelMoat?.economicMoatAssessment?.summaryParagraphs),
    'businessModelMoat.economicMoatAssessment.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isTable(report.businessModelMoat?.economicMoatAssessment?.moatTable),
    'businessModelMoat.economicMoatAssessment.moatTable',
    errors,
    'null or a valid table'
  );
  requireField(
    isNonEmptyString(report.businessModelMoat?.economicMoatAssessment?.overallMoatConclusion),
    'businessModelMoat.economicMoatAssessment.overallMoatConclusion',
    errors,
    'a non-empty string'
  );

  requireField(
    report.growthStrategyOutlook && typeof report.growthStrategyOutlook === 'object',
    'growthStrategyOutlook',
    errors,
    'an object'
  );
  requireField(
    isStringArray(report.growthStrategyOutlook?.nearTermCatalysts),
    'growthStrategyOutlook.nearTermCatalysts',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.growthStrategyOutlook?.mediumTermDrivers),
    'growthStrategyOutlook.mediumTermDrivers',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.growthStrategyOutlook?.longTermOpportunities),
    'growthStrategyOutlook.longTermOpportunities',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.growthStrategyOutlook?.tamPositioning?.summaryParagraphs),
    'growthStrategyOutlook.tamPositioning.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.growthStrategyOutlook?.tamPositioning?.highlights),
    'growthStrategyOutlook.tamPositioning.highlights',
    errors,
    'an array of strings'
  );

  requireField(
    report.managementGovernance && typeof report.managementGovernance === 'object',
    'managementGovernance',
    errors,
    'an object'
  );
  requireField(
    isStringArray(report.managementGovernance?.leadership?.summaryParagraphs),
    'managementGovernance.leadership.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isStringArray(report.managementGovernance?.capitalAllocation?.summaryParagraphs),
    'managementGovernance.capitalAllocation.summaryParagraphs',
    errors,
    'an array of strings'
  );
  requireField(
    isTable(report.managementGovernance?.capitalAllocation?.acquisitionTable),
    'managementGovernance.capitalAllocation.acquisitionTable',
    errors,
    'null or a valid table'
  );
  requireField(
    isStringArray(report.managementGovernance?.alignment?.summaryParagraphs),
    'managementGovernance.alignment.summaryParagraphs',
    errors,
    'an array of strings'
  );

  requireField(
    report.riskAnalysis && typeof report.riskAnalysis === 'object',
    'riskAnalysis',
    errors,
    'an object'
  );
  requireField(
    isTable(report.riskAnalysis?.riskTable),
    'riskAnalysis.riskTable',
    errors,
    'null or a valid table'
  );

  requireField(
    report.finalRecommendation && typeof report.finalRecommendation === 'object',
    'finalRecommendation',
    errors,
    'an object'
  );
  requireField(
    isNonEmptyString(report.finalRecommendation?.rating),
    'finalRecommendation.rating',
    errors,
    'a non-empty string'
  );
  requireField(
    isNonEmptyString(report.finalRecommendation?.priceTarget),
    'finalRecommendation.priceTarget',
    errors,
    'a non-empty string'
  );
  requireField(
    isNonEmptyString(report.finalRecommendation?.impliedUpsidePct),
    'finalRecommendation.impliedUpsidePct',
    errors,
    'a non-empty string'
  );
  requireField(
    report.finalRecommendation?.bullBaseBear &&
      isNonEmptyString(report.finalRecommendation.bullBaseBear.bull) &&
      isNonEmptyString(report.finalRecommendation.bullBaseBear.base) &&
      isNonEmptyString(report.finalRecommendation.bullBaseBear.bear),
    'finalRecommendation.bullBaseBear',
    errors,
    'an object with non-empty bull, base, and bear strings'
  );
  requireField(
    isNonEmptyString(report.finalRecommendation?.valuationMethodology),
    'finalRecommendation.valuationMethodology',
    errors,
    'a non-empty string'
  );
  requireField(
    isStringArray(report.finalRecommendation?.fiveKeyMetricsToWatch),
    'finalRecommendation.fiveKeyMetricsToWatch',
    errors,
    'an array of strings'
  );
  requireField(
    isRatingTriggerArray(report.finalRecommendation?.ratingChangeTriggers),
    'finalRecommendation.ratingChangeTriggers',
    errors,
    'an array of rating trigger objects'
  );
  requireField(
    isNonEmptyString(report.finalRecommendation?.closingParagraph),
    'finalRecommendation.closingParagraph',
    errors,
    'a non-empty string'
  );

  requireField(
    isStringArray(report.openQuestions),
    'openQuestions',
    errors,
    'an array of strings'
  );

  return {
    valid: errors.length === 0,
    errors
  };
}