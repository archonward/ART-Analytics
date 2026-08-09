import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCoverageCategory, classifySector } from './newsClassifier.js';

test('classifyCoverageCategory uses conservative deterministic rules', () => {
  const fixtures = [
    ['Company reports quarterly earnings above expectations', 'Earnings'],
    ['Broker raises price target after investor day', 'Analyst Ratings'],
    ['Shares upgraded to Buy as margins improve', 'Upgrades'],
    ['Board declares quarterly dividend for shareholders', 'Dividends'],
    ['Company opens a new regional office', 'General']
  ];

  for (const [title, expectedCategory] of fixtures) {
    assert.equal(classifyCoverageCategory({ title }), expectedCategory);
  }
});

test('classifyCoverageCategory gives explicit upgrades precedence over rating language', () => {
  assert.equal(
    classifyCoverageCategory({ title: 'Analyst upgrades shares and raises price target' }),
    'Upgrades'
  );
});

test('classifySector prefers consistent Marketaux entity industry metadata', () => {
  assert.equal(classifySector({
    title: 'Company provides a business update',
    entities: [
      { type: 'equity', industry: 'Technology' },
      { type: 'equity', industry: 'Technology' }
    ]
  }), 'Technology');

  assert.equal(classifySector({
    title: 'Companies announce a joint initiative',
    entities: [
      { type: 'equity', industry: 'Technology' },
      { type: 'equity', industry: 'Healthcare' }
    ]
  }), 'Unclassified');
});

test('classifySector uses small text fallbacks when entity metadata is unavailable', () => {
  const fixtures = [
    ['Biotech company reports clinical trial results', 'Biotech'],
    ['Semiconductor demand strengthens for chipmakers', 'Technology'],
    ['Health insurer updates its annual outlook', 'Healthcare'],
    ['Regional bank outlines a new capital plan', 'Financials'],
    ['Oil producer approves a new development project', 'Energy'],
    ['Retailer sees resilient consumer demand', 'Consumer'],
    ['Industrial company opens a new facility', 'Unclassified']
  ];

  for (const [title, expectedSector] of fixtures) {
    assert.equal(classifySector({ title }), expectedSector);
  }
});
