import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { listCoveredTickers } from './data/coverageRegistry.js';
import { getPublishedReportByTicker } from './services/reportService.js';
import { validateTickerFormat } from './services/tickerService.js';
import {
  buildCoveredResponse,
  buildErrorResponse,
  buildNotResearchedResponse
} from './utils/responseBuilders.js';
import reportTemplate from './data/reportTemplate.json' with { type: 'json' };
import { auditPublishedReports } from './services/reportAuditService.js';

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/coverage', (_, res) => {
  res.json({
    status: 'ok',
    coveredTickers: listCoveredTickers()
  });
});

app.get('/api/report-template', (_, res) => {
  res.json({
    status: 'ok',
    template: reportTemplate
  });
});

app.get('/api/report-audit', async (_, res) => {
  try {
    const auditResult = await auditPublishedReports();

    res.json({
      status: 'ok',
      ...auditResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(
      buildErrorResponse('Failed to audit published reports.')
    );
  }
});

app.get('/api/stock-summary', async (req, res) => {
  try {
    const tickerRaw = String(req.query.ticker || '').toUpperCase().trim();

    const formatCheck = validateTickerFormat(tickerRaw);
    if (!formatCheck.valid) {
      return res.status(400).json(buildErrorResponse(formatCheck.reason));
    }

    const reportResult = await getPublishedReportByTicker(tickerRaw);

    if (!reportResult.found && reportResult.reason === 'not_researched') {
      return res.status(200).json(
        buildNotResearchedResponse({
          ticker: tickerRaw
        })
      );
    }

    if (!reportResult.found && reportResult.reason === 'missing_report_content') {
      return res.status(500).json(
        buildErrorResponse(
          `Coverage exists for ${tickerRaw}, but the published report content is missing.`
        )
      );
    }

    if (!reportResult.found && reportResult.reason === 'invalid_json') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} contains invalid JSON.`
        )
      );
    }

    if (!reportResult.found && reportResult.reason === 'invalid_report_schema') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} does not match the required report schema.`
        )
      );
    }

    return res.json(buildCoveredResponse(reportResult.report));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to load the stock report.')
    );
  }
});

app.listen(PORT, () => {
  console.log(`ART Analytics backend listening on http://localhost:${PORT}`);
});