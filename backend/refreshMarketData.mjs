import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YahooFinance from 'yahoo-finance2';
import { validateReportSchema } from './src/utils/reportValidator.js';

dotenv.config();

const s3 = new S3Client({ region: process.env.AWS_REGION });
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const bucket = process.env.S3_BUCKET_NAME;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localReportsDir = path.resolve(__dirname, 'src/data/reports');
const supportedCommands = new Set(['refresh', 'sync', 'publish', 'refresh+sync', 'help', '--help', '-h']);

function formatPrice(value) {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatMarketCap(value) {
  if (!isFiniteNumber(value)) {
    return null;
  }

  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  return `$${value.toLocaleString('en-US')}`;
}

function formatPe(value) {
  if (!isFiniteNumber(value) || value <= 0) {
    return null;
  }

  return `${value.toFixed(1)}x`;
}

function formatImpliedUpside(currentPrice, targetPrice) {
  const parsedTarget = parseFloat(String(targetPrice || '').replace(/[^0-9.]/g, ''));

  if (!isFiniteNumber(currentPrice) || currentPrice <= 0 || !isFiniteNumber(parsedTarget)) {
    return null;
  }

  const upside = ((parsedTarget - currentPrice) / currentPrice) * 100;
  const sign = upside >= 0 ? '+' : '';
  return `${sign}${upside.toFixed(1)}%`;
}

function formatMarketDataAsOf(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date
    ? value
    : new Date(isFiniteNumber(value) ? value * 1000 : value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  });
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function extractMetricValue(report, label) {
  return report?.executiveAtAGlance?.snapshotMetrics?.find((item) => item.label === label)?.value;
}

function printHelp() {
  console.log(`
ART Analytics - Market Data Refresh

Commands:
  npm run refresh-market-data
  npm run refresh-market-data -- AMD NVDA
  npm run sync-market-data
  npm run sync-market-data -- AMD NVDA
  npm run publish-reports
  npm run publish-reports -- AMD NVDA
  npm run refresh-market-data -- refresh+sync
  npm run refresh-market-data -- refresh+sync AMD NVDA

Behavior:
  refresh       Updates S3 report JSON files with latest market data.
  sync          Downloads report JSON files from S3 into backend/src/data/reports.
  publish       Validates local report JSON files and uploads changed files to S3.
  refresh+sync  Refreshes S3 first, then syncs locally.

Fields updated during refresh:
  meta.currentPrice
  meta.impliedUpsidePct
  meta.marketDataAsOf
  executiveAtAGlance.snapshotMetrics -> Market Cap
  executiveAtAGlance.snapshotMetrics -> P/E

Required env vars:
  AWS_REGION
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  S3_BUCKET_NAME

Market data source:
  Yahoo Finance (no API key required)
`);
}

async function listTickersInS3() {
  const tickers = [];
  let continuationToken;

  do {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'reports/',
      ContinuationToken: continuationToken
    }));

    for (const entry of response.Contents || []) {
      const key = entry.Key || '';
      if (!key.endsWith('.json')) {
        continue;
      }

      tickers.push(key.replace(/^reports\//, '').replace(/\.json$/i, ''));
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return tickers.sort();
}

async function fetchReportFromS3(ticker) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: `reports/${ticker}.json`
  }));

  const body = await response.Body.transformToString();
  return JSON.parse(body);
}

async function pushReportToS3(ticker, report) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: `reports/${ticker}.json`,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json'
  }));
}

async function fetchYahooQuote(ticker) {
  let quote;
  try {
    quote = await yahooFinance.quote(ticker);
  } catch (error) {
    throw new Error(`Yahoo Finance request failed: ${error.message}`);
  }

  return {
    currentPrice: isFiniteNumber(quote?.regularMarketPrice) && quote.regularMarketPrice > 0
      ? quote.regularMarketPrice
      : null,
    marketCap: isFiniteNumber(quote?.marketCap) ? quote.marketCap : null,
    trailingPe: isFiniteNumber(quote?.trailingPE) ? quote.trailingPE : null,
    regularMarketTime: quote?.regularMarketTime ?? null
  };
}

function applyUpdates(report, marketData) {
  const updated = deepClone(report);
  const currentPrice = marketData.currentPrice;
  const impliedUpsidePct = formatImpliedUpside(currentPrice, report?.meta?.targetPrice);
  const marketDataAsOf = formatMarketDataAsOf(marketData.regularMarketTime);

  if (formatPrice(currentPrice)) {
    updated.meta.currentPrice = formatPrice(currentPrice);
  }

  if (impliedUpsidePct) {
    updated.meta.impliedUpsidePct = impliedUpsidePct;

    if (updated.finalRecommendation && typeof updated.finalRecommendation === 'object') {
      updated.finalRecommendation.impliedUpsidePct = impliedUpsidePct;
    }
  }

  if (marketDataAsOf) {
    updated.meta.marketDataAsOf = marketDataAsOf;
  }

  const snapshotMetrics = updated?.executiveAtAGlance?.snapshotMetrics;
  if (Array.isArray(snapshotMetrics)) {
    for (const metric of snapshotMetrics) {
      if (metric.label === 'Market Cap') {
        const formattedMarketCap = formatMarketCap(marketData.marketCap);
        if (formattedMarketCap) {
          metric.value = formattedMarketCap;
        }
      }

      if (metric.label === 'P/E') {
        const formattedPe = formatPe(marketData.trailingPe);
        if (formattedPe) {
          metric.value = formattedPe;
        }
      }
    }
  }

  return updated;
}

async function refreshTicker(ticker) {
  process.stdout.write(`  ${ticker.padEnd(6)} -> fetching... `);

  let report;
  try {
    report = await fetchReportFromS3(ticker);
  } catch (error) {
    console.log(`FAILED: S3 read failed: ${error.message}`);
    return false;
  }

  let marketData;
  try {
    marketData = await fetchYahooQuote(ticker);
  } catch (error) {
    console.log(`FAILED: ${error.message}`);
    return false;
  }

  const updated = applyUpdates(report, marketData);

  try {
    await pushReportToS3(ticker, updated);
  } catch (error) {
    console.log(`FAILED: S3 write failed: ${error.message}`);
    return false;
  }

  const changes = [];
  if (updated?.meta?.currentPrice !== report?.meta?.currentPrice) {
    changes.push(`price ${report.meta.currentPrice} -> ${updated.meta.currentPrice}`);
  }
  if (updated?.meta?.impliedUpsidePct !== report?.meta?.impliedUpsidePct) {
    changes.push(`upside ${report.meta.impliedUpsidePct} -> ${updated.meta.impliedUpsidePct}`);
  }

  const oldPe = extractMetricValue(report, 'P/E');
  const newPe = extractMetricValue(updated, 'P/E');
  if (oldPe !== newPe) {
    changes.push(`P/E ${oldPe} -> ${newPe}`);
  }

  const oldMarketCap = extractMetricValue(report, 'Market Cap');
  const newMarketCap = extractMetricValue(updated, 'Market Cap');
  if (oldMarketCap !== newMarketCap) {
    changes.push(`mktcap ${oldMarketCap} -> ${newMarketCap}`);
  }

  if (changes.length === 0) {
    console.log('OK: no changes');
  } else {
    console.log(`OK: updated - ${changes.join(' | ')}`);
  }

  return true;
}

async function syncTickerLocally(ticker) {
  process.stdout.write(`  ${ticker.padEnd(6)} -> downloading... `);

  let report;
  try {
    report = await fetchReportFromS3(ticker);
  } catch (error) {
    console.log(`FAILED: S3 read failed: ${error.message}`);
    return false;
  }

  try {
    await fs.mkdir(localReportsDir, { recursive: true });
    const outputPath = path.join(localReportsDir, `${ticker}.json`);
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`OK: saved to src/data/reports/${ticker}.json`);
    return true;
  } catch (error) {
    console.log(`FAILED: local write failed: ${error.message}`);
    return false;
  }
}

async function readLocalReport(ticker) {
  const inputPath = path.join(localReportsDir, `${ticker}.json`);
  const body = await fs.readFile(inputPath, 'utf8');
  return JSON.parse(body);
}

async function publishTicker(ticker) {
  process.stdout.write(`  ${ticker.padEnd(6)} -> checking... `);

  let report;
  try {
    report = await readLocalReport(ticker);
  } catch (error) {
    console.log(`FAILED: local read failed: ${error.message}`);
    return false;
  }

  const validation = validateReportSchema(report);
  const validationErrors = [...validation.errors];
  if (report?.meta?.ticker !== ticker) {
    validationErrors.push(`meta.ticker must match filename ticker ${ticker}`);
  }
  if (validationErrors.length > 0) {
    console.log(`FAILED: ${validationErrors.join('; ')}`);
    return false;
  }

  try {
    const remoteReport = await fetchReportFromS3(ticker);
    if (JSON.stringify(remoteReport) === JSON.stringify(report)) {
      console.log('OK: unchanged');
      return true;
    }
  } catch (error) {
    if (error?.name !== 'NoSuchKey') {
      console.log(`FAILED: S3 read failed: ${error.message}`);
      return false;
    }
  }

  try {
    await pushReportToS3(ticker, report);
    console.log('OK: uploaded');
    return true;
  } catch (error) {
    console.log(`FAILED: S3 write failed: ${error.message}`);
    return false;
  }
}

async function resolveTickers(specifiedTickers) {
  if (specifiedTickers.length > 0) {
    return specifiedTickers;
  }

  process.stdout.write('Fetching ticker list from S3... ');
  const tickers = await listTickersInS3();
  console.log(`found ${tickers.length} reports.\n`);
  return tickers;
}

async function runRefresh(tickers) {
  console.log('\nART Analytics - Market Data Refresh\n');

  let succeeded = 0;
  let failed = 0;

  for (const ticker of tickers) {
    const ok = await refreshTicker(ticker);
    if (ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
    await sleep(300);
  }

  console.log(`\nRefresh complete - ${succeeded} succeeded, ${failed} failed.\n`);
}

async function runSync(tickers) {
  console.log('\nART Analytics - S3 to Local Sync\n');

  let succeeded = 0;
  let failed = 0;

  for (const ticker of tickers) {
    const ok = await syncTickerLocally(ticker);
    if (ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  console.log(`\nSync complete - ${succeeded} succeeded, ${failed} failed.\n`);
}

async function runPublish(tickers) {
  console.log('\nART Analytics - Local to S3 Publish\n');

  let succeeded = 0;
  let failed = 0;

  for (const ticker of tickers) {
    const ok = await publishTicker(ticker);
    if (ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  console.log(`\nPublish complete - ${succeeded} succeeded, ${failed} failed.\n`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function listLocalTickers() {
  const entries = await fs.readdir(localReportsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/i, '').toUpperCase())
    .sort();
}

function parseArgs(rawArgs) {
  const firstArg = rawArgs[0]?.toLowerCase();
  const helpRequested = rawArgs.some((arg) => arg === '--help' || arg === '-h');
  const command = supportedCommands.has(firstArg) && firstArg !== '--help' && firstArg !== '-h'
    ? firstArg
    : 'refresh';

  const normalizedCommand = helpRequested ? 'help' : command;
  const tickerArgs = normalizedCommand === 'refresh' ? rawArgs : rawArgs.slice(1);

  return {
    command: normalizedCommand,
    tickers: tickerArgs
      .map((ticker) => ticker.toUpperCase().trim())
      .filter(Boolean)
  };
}

async function main() {
  const { command, tickers: specifiedTickers } = parseArgs(process.argv.slice(2));

  if (command === 'help') {
    printHelp();
    return;
  }

  if (!bucket) {
    console.error('S3_BUCKET_NAME is not set in backend/.env.');
    process.exit(1);
  }

  if (command === 'publish') {
    const tickers = specifiedTickers.length > 0
      ? specifiedTickers
      : await listLocalTickers();
    await runPublish(tickers);
    return;
  }

  const tickers = await resolveTickers(specifiedTickers);
  if (tickers.length === 0) {
    console.log('No report tickers found. Nothing to do.');
    return;
  }

  if (command === 'sync') {
    await runSync(tickers);
    return;
  }

  if (command === 'refresh+sync') {
    await runRefresh(tickers);
    await runSync(tickers);
    return;
  }

  await runRefresh(tickers);
}

main().catch((error) => {
  console.error(`\nUnexpected error: ${error.message}`);
  process.exit(1);
});
