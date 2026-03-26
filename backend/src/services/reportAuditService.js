import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listCoveredTickers } from '../data/coverageRegistry.js';
import { validateReportSchema } from '../utils/reportValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDirectory = path.resolve(__dirname, '../data/reports');

export async function auditPublishedReports() {
  const coveredTickers = listCoveredTickers();

  const auditResults = await Promise.all(
    coveredTickers.map(async (entry) => {
      const reportFilePath = path.join(reportsDirectory, `${entry.ticker}.json`);

      try {
        const fileContent = await fs.readFile(reportFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const validation = validateReportSchema(parsed);

        if (!validation.valid) {
          return {
            ticker: entry.ticker,
            companyName: entry.companyName,
            status: 'invalid_schema',
            issues: validation.errors
          };
        }

        return {
          ticker: entry.ticker,
          companyName: entry.companyName,
          status: 'ok',
          issues: []
        };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            ticker: entry.ticker,
            companyName: entry.companyName,
            status: 'missing_file',
            issues: [`Missing report file: ${entry.ticker}.json`]
          };
        }

        if (error instanceof SyntaxError) {
          return {
            ticker: entry.ticker,
            companyName: entry.companyName,
            status: 'invalid_json',
            issues: [`Invalid JSON syntax in ${entry.ticker}.json`]
          };
        }

        return {
          ticker: entry.ticker,
          companyName: entry.companyName,
          status: 'error',
          issues: [error.message]
        };
      }
    })
  );

  const summary = {
    total: auditResults.length,
    ok: auditResults.filter((item) => item.status === 'ok').length,
    invalid_schema: auditResults.filter((item) => item.status === 'invalid_schema').length,
    invalid_json: auditResults.filter((item) => item.status === 'invalid_json').length,
    missing_file: auditResults.filter((item) => item.status === 'missing_file').length,
    error: auditResults.filter((item) => item.status === 'error').length
  };

  return {
    summary,
    reports: auditResults
  };
}