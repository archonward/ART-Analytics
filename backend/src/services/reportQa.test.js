import test from 'node:test';
import assert from 'node:assert/strict';
import nvdaReport from '../data/reports/NVDA.json' with { type: 'json' };
import { buildReportChunks } from './reportChunkService.js';
import { rankChunks } from './retrievalService.js';

test('buildReportChunks emits searchable chunks with trace fields', () => {
  const chunks = buildReportChunks(nvdaReport);

  assert.ok(chunks.length > 20);

  const riskChunk = chunks.find((chunk) =>
    chunk.sourcePath === 'executiveSummary.primaryRisks[0]'
  );

  assert.ok(riskChunk);
  assert.equal(riskChunk.ticker, 'NVDA');
  assert.equal(riskChunk.sectionKey, 'executiveSummary');
  assert.equal(riskChunk.sectionTitle, 'Executive Summary');
  assert.equal(riskChunk.subsectionTitle, 'Primary Risks');
  assert.match(riskChunk.text, /regulatory scrutiny/i);

  const tableChunk = chunks.find((chunk) =>
    chunk.sourcePath === 'riskAnalysis.riskTable.rows[1]'
  );

  assert.ok(tableChunk);
  assert.match(tableChunk.text, /Hyperscaler Custom Silicon/i);
  assert.match(tableChunk.text, /Probability: High/i);
});

test('rankChunks surfaces risk chunks for risk-oriented queries', () => {
  const chunks = buildReportChunks(nvdaReport);
  const results = rankChunks(chunks, 'what are the key risks', 3);

  assert.equal(results.length, 3);
  assert.ok(
    results.every((chunk) =>
      ['Risk Analysis', 'Executive Summary', 'Final Recommendation'].includes(chunk.sectionTitle)
    )
  );
  assert.ok(
    results.some((chunk) => ['Risk Table', 'Primary Risks'].includes(chunk.subsectionTitle))
  );
  assert.ok(
    results.some((chunk) => /risk|regulatory|custom silicon|technology disruption/i.test(chunk.text))
  );
});

test('rankChunks surfaces valuation support and rating change triggers', () => {
  const chunks = buildReportChunks(nvdaReport);

  const valuationResults = rankChunks(chunks, 'what supports the valuation', 3);
  assert.ok(
    valuationResults.some((chunk) =>
      ['Valuation', 'Final Recommendation', 'Executive Summary'].includes(chunk.sectionTitle)
    )
  );

  const triggerResults = rankChunks(chunks, 'what could change the rating', 3);
  assert.ok(
    triggerResults.some((chunk) => chunk.subsectionTitle === 'Rating Change Triggers')
  );
});
