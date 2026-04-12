import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getCoverageByTicker } from '../data/coverageRegistry.js';
import { s3Client, S3_BUCKET } from '../utils/s3Client.js';
import { validateReportSchema } from '../utils/reportValidator.js';

export async function getPublishedReportByTicker(ticker) {
  const coverage = getCoverageByTicker(ticker);

  if (!coverage || coverage.status !== 'published') {
    return {
      found: false,
      reason: 'not_researched'
    };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `reports/${ticker}.json`
    });

    const response = await s3Client.send(command);
    const bodyString = await response.Body.transformToString();

    let report;
    try {
      report = JSON.parse(bodyString);
    } catch {
      return {
        found: false,
        reason: 'invalid_json'
      };
    }

    const validation = validateReportSchema(report);

    if (!validation.valid) {
      return {
        found: false,
        reason: 'invalid_report_schema',
        details: validation.errors
      };
    }

    return {
      found: true,
      coverage,
      report
    };

  } catch (error) {
    // S3 throws NoSuchKey when the file doesn't exist
    if (error.name === 'NoSuchKey') {
      return {
        found: false,
        reason: 'missing_report_content'
      };
    }

    throw error;
  }
}