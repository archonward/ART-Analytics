export const REPORT_SECTION_IDS = {
  executiveAtAGlance: 'report-section-executive-at-a-glance',
  executiveSummary: 'report-section-executive-summary',
  financialPerformanceHealth: 'report-section-financial-performance',
  valuation: 'report-section-valuation',
  businessModelMoat: 'report-section-business-model-moat',
  growthStrategyOutlook: 'report-section-growth-strategy',
  managementGovernance: 'report-section-management-governance',
  riskAnalysis: 'report-section-risk-analysis',
  finalRecommendation: 'report-section-final-recommendation',
  openQuestions: 'report-section-open-questions'
};

export function getReportSectionId(sectionKey) {
  return REPORT_SECTION_IDS[sectionKey] || null;
}
