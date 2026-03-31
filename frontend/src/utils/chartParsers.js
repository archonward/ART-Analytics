/**
 * chartParsers.js
 *
 *
 * Two table orientations exist across reports:
 *
 *   "years-as-rows" (majority):
 *
 *   "years-as-columns" (AMD, BAC, JPM, V, IBM, KO):
 */

function parseValue(raw) {
  if (raw == null) return null;
  const cleaned = String(raw)
    .replace(/[$,]/g, '')
    .replace(/[BbMmTt]$/g, '')
    .replace(/%$/, '')
    .replace(/[x]$/i, '')
    .replace(/[+]/g, '')
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function detectOrientation(table) {
  if (!table || !table.columns || !table.rows) return null;
  const firstCol = table.columns[0].toLowerCase();
  if (firstCol === 'metric' || firstCol === 'item') {
    return 'years-as-columns';
  }
  if (table.columns.length > 1) {
    const secondCol = String(table.columns[1]).trim();
    if (/^(FY)?\d{4}$/.test(secondCol)) {
      return 'years-as-columns';
    }
  }
  return 'years-as-rows';
}

function normaliseKey(header) {
  return header
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseIncomeStatementRows(table) {
  if (!table || !table.columns || !table.rows) return null;

  const orientation = detectOrientation(table);

  if (orientation === 'years-as-rows') {
    const [, ...metricCols] = table.columns;
    const keys = metricCols.map(normaliseKey);

    return table.rows
      .map((row) => {
        const entry = { period: row[0] };
        keys.forEach((key, i) => {
          const val = parseValue(row[i + 1]);
          if (val !== null) entry[key] = val;
        });
        return entry;
      })
      .filter((entry) => Object.keys(entry).length > 1);
  }

  if (orientation === 'years-as-columns') {
    const periods = table.columns.slice(1);
    const result = periods.map((p) => ({ period: p }));

    table.rows.forEach((row) => {
      const key = normaliseKey(String(row[0]).trim());
      row.slice(1).forEach((cell, i) => {
        const val = parseValue(cell);
        if (val !== null && result[i]) {
          result[i][key] = val;
        }
      });
    });

    return result.filter((entry) => Object.keys(entry).length > 1);
  }

  return null;
}

export function parseMarginRows(table) {
  return parseIncomeStatementRows(table);
}

export function parseValuationMultiples(table) {
  if (!table || !table.columns || !table.rows) return null;

  const companies = table.columns.slice(1).map(normaliseKey);

  return table.rows
    .map((row) => {
      const entry = { metric: row[0] };
      companies.forEach((co, i) => {
        const val = parseValue(row[i + 1]);
        if (val !== null) entry[co] = val;
      });
      return entry;
    })
    .filter((entry) => Object.keys(entry).length > 1);
}

export function getValuationKeys(table) {
  if (!table || !table.columns) return [];
  return table.columns.slice(1).map(normaliseKey);
}

export function getMetricKeys(data) {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]).filter((k) => k !== 'period');
}