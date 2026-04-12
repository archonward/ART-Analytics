/**
 * ART Analytics — Market Data Refresh Script
 *
 * What this script updates (safe, live market data only):
 *   - meta.currentPrice
 *   - meta.impliedUpsidePct
 *   - meta.marketDataAsOf
 *   - executiveAtAGlance.snapshotMetrics → Market Cap
 *   - executiveAtAGlance.snapshotMetrics → P/E
 *
 * Everything else (qualitative writing, financial tables,
 * valuation, thesis, risks etc.) is left completely untouched.
 *
 * Usage:
 *   node refreshMarketData.mjs              ← updates all tickers
 *   node refreshMarketData.mjs AMD NVDA     ← updates specific tickers only
 *
 * Requirements:
 *   npm install @aws-sdk/client-s3 yahoo-finance2 dotenv
 *
 * Environment variables required (same as your backend .env):
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
 */

import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME;
const yahoo = new YahooFinance();

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(value) {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMarketCap(value) {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatPE(value) {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return null;
  return `${value.toFixed(1)}x`;
}

function formatImpliedUpside(currentPrice, targetPriceStr) {
  // targetPrice is stored as a string like "$290" — parse it
  const target = parseFloat(String(targetPriceStr).replace(/[^0-9.]/g, ''));
  if (!isFinite(target) || !isFinite(currentPrice) || currentPrice <= 0) return null;
  const upside = ((target - currentPrice) / currentPrice) * 100;
  const sign = upside >= 0 ? '+' : '';
  return `${sign}${upside.toFixed(1)}%`;
}

function formatMarketDataAsOf(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  });
}

// ── S3 helpers ────────────────────────────────────────────────────────────────

async function fetchReportFromS3(ticker) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: `reports/${ticker}.json`
  });
  const response = await s3.send(command);
  const body = await response.Body.transformToString();
  return JSON.parse(body);
}

async function pushReportToS3(ticker, report) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `reports/${ticker}.json`,
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json'
  });
  await s3.send(command);
}

async function listTickersInS3() {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: 'reports/'
  });
  const response = await s3.send(command);
  return (response.Contents || [])
    .map(obj => obj.Key.replace('reports/', '').replace('.json', ''))
    .filter(Boolean);
}

// ── Core update logic ─────────────────────────────────────────────────────────

async function fetchLiveData(ticker) {
  try {
    const quote = await yahoo.quote(ticker);
    return {
      currentPrice: quote.regularMarketPrice ?? null,
      marketCap: quote.marketCap ?? null,
      trailingPE: quote.trailingPE ?? null,
      marketTime: quote.regularMarketTime ?? null
    };
  } catch (err) {
    throw new Error(`Yahoo Finance fetch failed for ${ticker}: ${err.message}`);
  }
}

function applyUpdates(report, liveData) {
  const { currentPrice, marketCap, trailingPE, marketTime } = liveData;
  const updated = JSON.parse(JSON.stringify(report)); // deep clone

  // ── meta fields ────────────────────────────────────────────────────────────
  if (currentPrice !== null) {
    const formatted = formatPrice(currentPrice);
    if (formatted) updated.meta.currentPrice = formatted;
  }

  const upside = formatImpliedUpside(currentPrice, report.meta.targetPrice);
  if (upside) {
    updated.meta.impliedUpsidePct = upside;
    updated.finalRecommendation.impliedUpsidePct = upside;
  }

  const asOf = formatMarketDataAsOf(marketTime);
  if (asOf) updated.meta.marketDataAsOf = asOf;

  // ── snapshotMetrics ────────────────────────────────────────────────────────
  const metrics = updated.executiveAtAGlance?.snapshotMetrics;
  if (Array.isArray(metrics)) {
    for (const metric of metrics) {
      if (metric.label === 'Market Cap' && marketCap !== null) {
        const formatted = formatMarketCap(marketCap);
        if (formatted) metric.value = formatted;
      }
      if (metric.label === 'P/E' && trailingPE !== null) {
        const formatted = formatPE(trailingPE);
        if (formatted) metric.value = formatted;
      }
    }
  }

  return updated;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function refreshTicker(ticker) {
  process.stdout.write(`  ${ticker.padEnd(6)} → fetching... `);

  let report;
  try {
    report = await fetchReportFromS3(ticker);
  } catch (err) {
    console.log(`❌ S3 read failed: ${err.message}`);
    return false;
  }

  let liveData;
  try {
    liveData = await fetchLiveData(ticker);
  } catch (err) {
    console.log(`❌ ${err.message}`);
    return false;
  }

  const updated = applyUpdates(report, liveData);

  try {
    await pushReportToS3(ticker, updated);
  } catch (err) {
    console.log(`❌ S3 write failed: ${err.message}`);
    return false;
  }

  // Print what changed
  const changes = [];
  if (updated.meta.currentPrice !== report.meta.currentPrice)
    changes.push(`price ${report.meta.currentPrice} → ${updated.meta.currentPrice}`);
  if (updated.meta.impliedUpsidePct !== report.meta.impliedUpsidePct)
    changes.push(`upside ${report.meta.impliedUpsidePct} → ${updated.meta.impliedUpsidePct}`);

  const oldPE = report.executiveAtAGlance?.snapshotMetrics?.find(m => m.label === 'P/E')?.value;
  const newPE = updated.executiveAtAGlance?.snapshotMetrics?.find(m => m.label === 'P/E')?.value;
  if (oldPE !== newPE) changes.push(`P/E ${oldPE} → ${newPE}`);

  const oldMC = report.executiveAtAGlance?.snapshotMetrics?.find(m => m.label === 'Market Cap')?.value;
  const newMC = updated.executiveAtAGlance?.snapshotMetrics?.find(m => m.label === 'Market Cap')?.value;
  if (oldMC !== newMC) changes.push(`mktcap ${oldMC} → ${newMC}`);

  if (changes.length === 0) {
    console.log('✅ no changes');
  } else {
    console.log(`✅ updated — ${changes.join(' | ')}`);
  }

  return true;
}

async function main() {
  console.log('\n🔄 ART Analytics — Market Data Refresh\n');

  if (!BUCKET) {
    console.error('❌ S3_BUCKET_NAME is not set in your .env file.');
    process.exit(1);
  }

  // If specific tickers passed as args, use those. Otherwise pull full list from S3.
  let tickers = process.argv.slice(2).map(t => t.toUpperCase().trim()).filter(Boolean);

  if (tickers.length === 0) {
    process.stdout.write('Fetching ticker list from S3... ');
    tickers = await listTickersInS3();
    console.log(`found ${tickers.length} reports.\n`);
  } else {
    console.log(`Updating ${tickers.length} specified ticker(s).\n`);
  }

  if (tickers.length === 0) {
    console.log('No reports found in S3 under reports/. Nothing to update.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const ticker of tickers) {
    const ok = await refreshTicker(ticker);
    if (ok) successCount++;
    else failCount++;

    // Small delay to avoid hammering Yahoo Finance
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n✅ Done — ${successCount} updated, ${failCount} failed.\n`);
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
