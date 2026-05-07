/**
 * ART Analytics — Market Data Refresh + Sync Script
 *
 * COMMANDS:
 *
 *   refresh (default)
 *     Fetches live market data and updates reports in S3.
 *     node refreshMarketData.mjs                     ← all tickers
 *     node refreshMarketData.mjs AMD NVDA            ← specific tickers
 *
 *   sync
 *     Downloads all reports from S3 to your local reports folder.
 *     node refreshMarketData.mjs sync                ← sync all
 *     node refreshMarketData.mjs sync AMD NVDA       ← sync specific tickers
 *
 *   refresh+sync
 *     Refreshes market data in S3, then syncs all updated files locally.
 *     node refreshMarketData.mjs refresh+sync        ← all tickers
 *     node refreshMarketData.mjs refresh+sync AMD    ← specific tickers
 *
 * What refresh updates (safe, live market data only):
 *   - meta.currentPrice
 *   - meta.impliedUpsidePct
 *   - meta.marketDataAsOf
 *   - executiveAtAGlance.snapshotMetrics → Market Cap
 *   - executiveAtAGlance.snapshotMetrics → P/E
 *
 * Everything else (qualitative writing, financial tables,
 * valuation, thesis, risks etc.) is left completely untouched.
 *
 * Environment variables required (same as your backend .env):
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, FINNHUB_API_KEY
 */

import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.S3_BUCKET_NAME;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_REPORTS_DIR = path.resolve(__dirname, 'src/data/reports');

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

function buildFinnhubUrl(endpoint, params = {}) {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    throw new Error('FINNHUB_API_KEY is not set in your .env file.');
  }

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set('token', token);
  return url;
}

async function fetchFinnhubJson(endpoint, params) {
  const response = await fetch(buildFinnhubUrl(endpoint, params));
  if (!response.ok) {
    throw new Error(`Finnhub request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && isFinite(value);
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
    const [quote, metrics, profile] = await Promise.all([
      fetchFinnhubJson('/quote', { symbol: ticker }),
      fetchFinnhubJson('/stock/metric', { symbol: ticker, metric: 'all' }),
      fetchFinnhubJson('/stock/profile2', { symbol: ticker })
    ]);

    const metric = metrics?.metric || {};
    const marketCapitalization = profile?.marketCapitalization;
    const trailingPE = metric.peNormalizedAnnual ?? metric.peTTM ?? null;

    return {
      currentPrice: isFiniteNumber(quote.c) && quote.c > 0 ? quote.c : null,
      marketCap: isFiniteNumber(marketCapitalization) ? marketCapitalization * 1_000_000 : null,
      trailingPE: isFiniteNumber(trailingPE) ? trailingPE : null,
      marketTime: isFiniteNumber(quote.t) ? new Date(quote.t * 1000) : null
    };
  } catch (err) {
    throw new Error(`Finnhub fetch failed for ${ticker}: ${err.message}`);
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

// ── Refresh logic ─────────────────────────────────────────────────────────────

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

// ── Sync logic ────────────────────────────────────────────────────────────────

async function syncTickerLocally(ticker) {
  process.stdout.write(`  ${ticker.padEnd(6)} → downloading... `);

  let report;
  try {
    report = await fetchReportFromS3(ticker);
  } catch (err) {
    console.log(`❌ S3 read failed: ${err.message}`);
    return false;
  }

  try {
    await fs.mkdir(LOCAL_REPORTS_DIR, { recursive: true });
    const filePath = path.join(LOCAL_REPORTS_DIR, `${ticker}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`✅ saved to src/data/reports/${ticker}.json`);
    return true;
  } catch (err) {
    console.log(`❌ local write failed: ${err.message}`);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runRefresh(tickers) {
  let successCount = 0;
  let failCount = 0;

  for (const ticker of tickers) {
    const ok = await refreshTicker(ticker);
    if (ok) successCount++;
    else failCount++;
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n✅ Refresh done — ${successCount} updated, ${failCount} failed.\n`);
}

async function runSync(tickers) {
  console.log(`\n📥 Syncing ${tickers.length} report(s) from S3 to local...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const ticker of tickers) {
    const ok = await syncTickerLocally(ticker);
    if (ok) successCount++;
    else failCount++;
  }

  console.log(`\n✅ Sync done — ${successCount} saved, ${failCount} failed.\n`);
}

async function resolveTickers(specified) {
  if (specified.length > 0) return specified;
  process.stdout.write('Fetching ticker list from S3... ');
  const tickers = await listTickersInS3();
  console.log(`found ${tickers.length} reports.\n`);
  return tickers;
}

async function main() {
  if (!BUCKET) {
    console.error('❌ S3_BUCKET_NAME is not set in your .env file.');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Parse command and tickers from args
  const COMMANDS = ['sync', 'refresh+sync'];
  const command = COMMANDS.includes(args[0]?.toLowerCase()) ? args[0].toLowerCase() : 'refresh';
  const specifiedTickers = (command !== 'refresh' ? args.slice(1) : args)
    .map(t => t.toUpperCase().trim())
    .filter(Boolean);

  if (command === 'sync') {
    // ── Sync only ────────────────────────────────────────────────────────────
    console.log('\n📥 ART Analytics — S3 → Local Sync\n');
    const tickers = await resolveTickers(specifiedTickers);
    if (tickers.length === 0) {
      console.log('No reports found in S3. Nothing to sync.');
      return;
    }
    await runSync(tickers);

  } else if (command === 'refresh+sync') {
    // ── Refresh then sync ────────────────────────────────────────────────────
    console.log('\n🔄 ART Analytics — Refresh + Sync\n');
    const tickers = await resolveTickers(specifiedTickers);
    if (tickers.length === 0) {
      console.log('No reports found in S3. Nothing to do.');
      return;
    }
    console.log('Step 1 of 2 — Refreshing market data in S3...\n');
    await runRefresh(tickers);
    console.log('Step 2 of 2 — Syncing updated files to local...');
    await runSync(tickers);

  } else {
    // ── Refresh only (default) ───────────────────────────────────────────────
    console.log('\n🔄 ART Analytics — Market Data Refresh\n');
    const tickers = await resolveTickers(specifiedTickers);
    if (tickers.length === 0) {
      console.log('No reports found in S3. Nothing to update.');
      return;
    }
    await runRefresh(tickers);
  }
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
