import test from 'node:test';
import assert from 'node:assert/strict';
import { answerReportQuestion, detectIntent, selectUsableEvidence } from './qaService.js';
import { buildReportChunks } from './reportChunkService.js';
import { rankChunks } from './retrievalService.js';
import nvdaReport from '../data/reports/NVDA.json' with { type: 'json' };

test('detectIntent classifies common report QA prompts', () => {
  assert.equal(detectIntent('What are the key risks?').key, 'risks');
  assert.equal(detectIntent('What supports the valuation?').key, 'valuation');
  assert.equal(detectIntent('What could change the rating?').key, 'ratingChange');
  assert.equal(detectIntent('How is management described?').key, 'management');
});

test('selectUsableEvidence prefers intent-aligned chunks', () => {
  const chunks = buildReportChunks(nvdaReport);
  const ranked = rankChunks(chunks, 'What could change the rating?', 5);
  const selected = selectUsableEvidence(ranked, detectIntent('What could change the rating?'));

  assert.ok(selected.length > 0);
  assert.ok(selected.some((chunk) => chunk.subsectionTitle === 'Rating Change Triggers'));
});

test('answerReportQuestion returns grounded answer with citations for risk questions', async () => {
  const result = await answerReportQuestion({
    ticker: 'NVDA',
    question: 'What are the key risks?'
  });

  assert.equal(result.found, true);
  assert.equal(result.grounded, true);
  assert.ok(result.answer.length > 0);
  assert.ok(result.citations.length > 0);
  assert.match(result.answer, /risk|regulatory|custom silicon|technology/i);
});

test('answerReportQuestion returns grounded answer with rating change citations', async () => {
  const result = await answerReportQuestion({
    ticker: 'NVDA',
    question: 'What could change the rating?'
  });

  assert.equal(result.found, true);
  assert.equal(result.grounded, true);
  assert.ok(result.citations.some((citation) => citation.subsectionTitle === 'Rating Change Triggers'));
  assert.match(result.answer, /upgrade|downgrade|rating/i);
});

test('answerReportQuestion falls back safely when support is weak', async () => {
  const result = await answerReportQuestion({
    ticker: 'NVDA',
    question: 'What is the board diversity policy?'
  });

  assert.equal(result.found, true);
  assert.equal(result.grounded, false);
  assert.equal(result.citations.length, 0);
  assert.match(result.answer, /does not clearly specify/i);
});
