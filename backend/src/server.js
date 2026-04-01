import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { listCoveredTickers } from './data/coverageRegistry.js';
import {
  clearMarketDataCache,
  getLiveMarketDataBatchByTickers,
  getLiveMarketDataByTicker,
  getMarketDataCacheStats,
  getMarketOverview
} from './services/marketDataService.js';
import { auditPublishedReports } from './services/reportAuditService.js';
import { getPublishedReportByTicker } from './services/reportService.js';
import { validateTickerFormat } from './services/tickerService.js';
import {
  buildBatchMarketDataResponse,
  buildCoveredResponse,
  buildErrorResponse,
  buildMarketDataResponse,
  buildMarketDataUnavailableResponse,
  buildMarketOverviewResponse,
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

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/market-data/cache', (_, res) => {
  res.json({
    status: 'ok',
    cache: getMarketDataCacheStats()
  });
});

app.delete('/api/market-data/cache', (_, res) => {
  clearMarketDataCache();

  res.json({
    status: 'ok',
    message: 'Market data cache cleared.'
  });
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

app.get('/api/market-data', async (req, res) => {
  try {
    const tickerRaw = String(req.query.ticker || '').toUpperCase().trim();

    const formatCheck = validateTickerFormat(tickerRaw);
    if (!formatCheck.valid) {
      return res.status(400).json(buildErrorResponse(formatCheck.reason));
    }

    const marketResult = await getLiveMarketDataByTicker(tickerRaw);

    if (!marketResult.found && marketResult.reason === 'no_market_data') {
      return res.status(200).json(
        buildMarketDataUnavailableResponse({
          ticker: tickerRaw,
          message: `Live market data is currently unavailable for ${tickerRaw}.`
        })
      );
    }

    if (!marketResult.found && marketResult.reason === 'market_data_unavailable') {
      return res.status(200).json(
        buildMarketDataUnavailableResponse({
          ticker: tickerRaw,
          message: `Could not load live market data for ${tickerRaw} right now.`
        })
      );
    }

    return res.json(buildMarketDataResponse(marketResult.marketData));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to load live market data.')
    );
  }
});

app.get('/api/market-data/batch', async (req, res) => {
  try {
    const tickersRaw = String(req.query.tickers || '')
      .split(',')
      .map((ticker) => ticker.toUpperCase().trim())
      .filter(Boolean);

    if (tickersRaw.length === 0) {
      return res.status(400).json(
        buildErrorResponse('Please provide at least one ticker.')
      );
    }

    const invalidTicker = tickersRaw.find((ticker) => !validateTickerFormat(ticker).valid);

    if (invalidTicker) {
      return res.status(400).json(
        buildErrorResponse(
          `Invalid ticker in batch request: ${invalidTicker}. Use 1-5 uppercase letters only.`
        )
      );
    }

    const batchResult = await getLiveMarketDataBatchByTickers(tickersRaw);

    return res.json(buildBatchMarketDataResponse(batchResult.results));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to load batch live market data.')
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

app.get('/api/market-overview', async (_, res) => {
  try {
    const overviewResult = await getMarketOverview();

    return res.json(
      buildMarketOverviewResponse(overviewResult.items)
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to load market overview.')
    );
  }
});
app.listen(PORT, () => {
  console.log(`ART Analytics backend listening on port ${PORT}`);
});