import { getCoverageByTicker } from '../data/coverageRegistry.js';
import ibmReport from '../data/reports/IBM.js';
import koReport from '../data/reports/KO.js';

const reportRegistry = {
  IBM: ibmReport,
  KO: koReport
};

export function getPublishedReportByTicker(ticker) {
  const coverage = getCoverageByTicker(ticker);

  if (!coverage || coverage.status !== 'published') {
    return {
      found: false,
      reason: 'not_researched'
    };
  }

  const report = reportRegistry[ticker];

  if (!report) {
    return {
      found: false,
      reason: 'missing_report_content'
    };
  }

  return {
    found: true,
    coverage,
    report
  };
}