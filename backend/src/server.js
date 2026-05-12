import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { listCoveredTickers } from './data/coverageRegistry.js';
import { requireApiKey } from './middleware/auth.js';
import { answerReportQuestion } from './services/qaService.js';
import { retrieveRelevantReportChunks } from './services/retrievalService.js';
import { auditPublishedReports } from './services/reportAuditService.js';
import { getPublishedReportByTicker } from './services/reportService.js';
import { validateTickerFormat } from './services/tickerService.js';
import {
  buildCoveredResponse,
  buildErrorResponse,
  buildNotResearchedResponse
} from './utils/responseBuilders.js';
import reportTemplate from './data/reportTemplate.json' with { type: 'json' };

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_ORIGIN
].filter(Boolean);

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed from this origin.'));
  }
}));

app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.send('ART Analytics Backend is running.');
});

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/coverage', (_, res) => {
  res.json({
    status: 'ok',
    coveredTickers: listCoveredTickers()
  });
});

app.get('/api/report-template', requireApiKey, (_, res) => {
  res.json({
    status: 'ok',
    template: reportTemplate
  });
});

app.get('/api/report-audit', requireApiKey, async (_, res) => {
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

app.get('/api/stock-summary', requireApiKey, async (req, res) => {
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

app.get('/api/report-qa/debug', requireApiKey, async (req, res) => {
  try {
    const tickerRaw = String(req.query.ticker || '').toUpperCase().trim();
    const query = String(req.query.q || '').trim();
    const topK = Number(req.query.topK || 5);

    const formatCheck = validateTickerFormat(tickerRaw);
    if (!formatCheck.valid) {
      return res.status(400).json(buildErrorResponse(formatCheck.reason));
    }

    if (!query) {
      return res.status(400).json(
        buildErrorResponse('Please provide a query using the q parameter.')
      );
    }

    const retrievalResult = await retrieveRelevantReportChunks({
      ticker: tickerRaw,
      query,
      topK
    });

    if (!retrievalResult.found && retrievalResult.reason === 'not_researched') {
      return res.status(200).json(
        buildNotResearchedResponse({
          ticker: tickerRaw
        })
      );
    }

    if (!retrievalResult.found && retrievalResult.reason === 'missing_report_content') {
      return res.status(500).json(
        buildErrorResponse(
          `Coverage exists for ${tickerRaw}, but the published report content is missing.`
        )
      );
    }

    if (!retrievalResult.found && retrievalResult.reason === 'invalid_json') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} contains invalid JSON.`
        )
      );
    }

    if (!retrievalResult.found && retrievalResult.reason === 'invalid_report_schema') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} does not match the required report schema.`
        )
      );
    }

    return res.json({
      status: 'ok',
      ticker: retrievalResult.ticker,
      query: retrievalResult.query,
      totalChunks: retrievalResult.totalChunks,
      topK: retrievalResult.topK,
      results: retrievalResult.results.map((result) => ({
        chunkId: result.chunkId,
        score: result.score,
        sectionKey: result.sectionKey,
        sectionTitle: result.sectionTitle,
        subsectionTitle: result.subsectionTitle,
        snippet: buildSnippet(result.text),
        sourcePath: result.sourcePath,
        explanation: result.explanation
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to run report QA retrieval debug.')
    );
  }
});

app.post('/api/report-qa', requireApiKey, async (req, res) => {
  try {
    const tickerRaw = String(req.body?.ticker || '').toUpperCase().trim();
    const question = String(req.body?.question || '').trim();
    const topK = Number(req.body?.topK || 5);
    const maxCitations = Number(req.body?.maxCitations || 3);

    const formatCheck = validateTickerFormat(tickerRaw);
    if (!formatCheck.valid) {
      return res.status(400).json(buildErrorResponse(formatCheck.reason));
    }

    if (!question) {
      return res.status(400).json(
        buildErrorResponse('Please provide a question in the request body.')
      );
    }

    const answerResult = await answerReportQuestion({
      ticker: tickerRaw,
      question,
      topK,
      maxCitations
    });

    if (!answerResult.found && answerResult.reason === 'not_researched') {
      return res.status(200).json(
        buildNotResearchedResponse({
          ticker: tickerRaw
        })
      );
    }

    if (!answerResult.found && answerResult.reason === 'missing_report_content') {
      return res.status(500).json(
        buildErrorResponse(
          `Coverage exists for ${tickerRaw}, but the published report content is missing.`
        )
      );
    }

    if (!answerResult.found && answerResult.reason === 'invalid_json') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} contains invalid JSON.`
        )
      );
    }

    if (!answerResult.found && answerResult.reason === 'invalid_report_schema') {
      return res.status(500).json(
        buildErrorResponse(
          `The published report file for ${tickerRaw} does not match the required report schema.`
        )
      );
    }

    return res.json({
      status: 'ok',
      ticker: answerResult.ticker,
      question: answerResult.question,
      answer: answerResult.answer,
      grounded: answerResult.grounded,
      citations: answerResult.citations,
      meta: answerResult.meta
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to answer the report question.')
    );
  }
});

app.listen(PORT, () => {
  console.log(`ART Analytics backend listening on port ${PORT}`);
});

function buildSnippet(text, maxLength = 220) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}
