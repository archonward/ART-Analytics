import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCoverageByTicker } from '../data/coverageRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDirectory = path.resolve(__dirname, '../data/reports');

export async function getPublishedReportByTicker(ticker) {
  const coverage = getCoverageByTicker(ticker);

  if (!coverage || coverage.status !== 'published') {
    return {
      found: false,
      reason: 'not_researched'
    };
  }

  const reportFilePath = path.join(reportsDirectory, `${ticker}.json`);

  try {
    const fileContent = await fs.readFile(reportFilePath, 'utf-8');
    const report = JSON.parse(fileContent);

    return {
      found: true,
      coverage,
      report
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        found: false,
        reason: 'missing_report_content'
      };
    }

    throw error;
  }
}