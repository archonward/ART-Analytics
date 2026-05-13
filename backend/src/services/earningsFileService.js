import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const earningsDirectory = path.resolve(__dirname, '../data/Earnings');
const earningsFilePattern = /^(\d{4}-\d{2}-\d{2})_([A-Z0-9.-]+)_.+\.pdf$/i;

export async function getLatestEarningsFileByTicker(ticker) {
  const normalizedTicker = String(ticker || '').trim().toUpperCase();

  if (!normalizedTicker) {
    return null;
  }

  let entries;
  try {
    entries = await fs.readdir(earningsDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }

  const matches = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const match = entry.name.match(earningsFilePattern);

      if (!match) {
        return null;
      }

      const [, reportDate, fileTicker] = match;

      if (fileTicker.toUpperCase() !== normalizedTicker) {
        return null;
      }

      return {
        reportDate,
        fileName: entry.name,
        absolutePath: path.join(earningsDirectory, entry.name)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate));

  return matches[0] || null;
}
