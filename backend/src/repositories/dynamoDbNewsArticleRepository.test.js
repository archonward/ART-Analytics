import test from 'node:test';
import assert from 'node:assert/strict';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { validateNewsArticles } from '../utils/newsValidator.js';
import {
  createDynamoDbNewsArticleRepository,
  DEFAULT_NEWS_RETENTION_DAYS,
  NEWS_FEED_KEY,
  NEWS_RECORD_SCHEMA_VERSION
} from './dynamoDbNewsArticleRepository.js';

function clone(value) {
  return structuredClone(value);
}

function createArticle(id, publishedAt, overrides = {}) {
  return {
    id,
    headline: `Headline for ${id}`,
    summary: `Summary for ${id}`,
    source: 'Test Publisher',
    publishedAt,
    url: `https://example.com/news/${id}`,
    coverageCategory: 'General',
    sector: 'Unclassified',
    tickers: [],
    ...overrides
  };
}

function createFakeDynamoDbClient(initialItems = []) {
  const itemsById = new Map(initialItems.map((item) => [item.id, clone(item)]));
  const commands = [];

  return {
    commands,
    itemsById,
    async send(command) {
      commands.push(command);

      if (command instanceof PutCommand) {
        const item = clone(command.input.Item);

        if (itemsById.has(item.id)) {
          const error = new Error('Duplicate item');
          error.name = 'ConditionalCheckFailedException';
          throw error;
        }

        itemsById.set(item.id, item);
        return {};
      }

      if (command instanceof QueryCommand) {
        const items = [...itemsById.values()]
          .filter((item) => item.feedKey === command.input.ExpressionAttributeValues[':feedKey'])
          .sort((left, right) => right.publishedKey.localeCompare(left.publishedKey))
          .slice(0, command.input.Limit)
          .map(clone);

        return { Items: items };
      }

      throw new Error(`Unexpected command: ${command.constructor.name}`);
    }
  };
}

function createRepository(client, overrides = {}) {
  return createDynamoDbNewsArticleRepository({
    client,
    tableName: 'art-analytics-news-test',
    indexName: 'feedKey-publishedKey-index',
    now: () => new Date('2026-08-13T09:00:00.000Z'),
    ...overrides
  });
}

test('DynamoDB news repository maps normalized articles to persistence records', async () => {
  const client = createFakeDynamoDbClient();
  const repository = createRepository(client);
  const article = createArticle('article-1', '2026-08-13T08:00:00.000Z', {
    coverageCategory: 'Earnings',
    sector: 'Technology',
    tickers: ['AAPL']
  });

  await repository.saveArticles([article]);

  assert.equal(client.commands.length, 1);
  assert.ok(client.commands[0] instanceof PutCommand);
  assert.deepEqual(client.commands[0].input, {
    TableName: 'art-analytics-news-test',
    Item: {
      ...article,
      feedKey: NEWS_FEED_KEY,
      publishedKey: '2026-08-13T08:00:00.000Z#article-1',
      retrievedAt: '2026-08-13T09:00:00.000Z',
      provider: 'marketaux',
      expiresAt: 1794387600,
      schemaVersion: NEWS_RECORD_SCHEMA_VERSION
    },
    ConditionExpression: 'attribute_not_exists(id)'
  });
  assert.equal(DEFAULT_NEWS_RETENTION_DAYS, 90);
});

test('DynamoDB news repository treats duplicate article IDs as no-op writes', async () => {
  const client = createFakeDynamoDbClient();
  const repository = createRepository(client);
  const original = createArticle('duplicate-id', '2026-08-13T08:00:00.000Z');

  await repository.saveArticles([original]);
  await repository.saveArticles([{
    ...original,
    headline: 'This duplicate must not overwrite the first record'
  }]);

  assert.equal(client.itemsById.size, 1);
  assert.equal(client.itemsById.get('duplicate-id').headline, original.headline);
  assert.equal(client.commands.length, 2);
});

test('DynamoDB news repository queries newest-first and respects the limit', async () => {
  const client = createFakeDynamoDbClient();
  const repository = createRepository(client);
  await repository.saveArticles([
    createArticle('oldest', '2026-08-11T08:00:00.000Z'),
    createArticle('newest', '2026-08-13T08:00:00.000Z'),
    createArticle('middle', '2026-08-12T08:00:00.000Z')
  ]);

  const articles = await repository.listLatestArticles(2);
  const query = client.commands.at(-1);

  assert.deepEqual(articles.map((article) => article.id), ['newest', 'middle']);
  assert.ok(query instanceof QueryCommand);
  assert.equal(query.input.IndexName, 'feedKey-publishedKey-index');
  assert.equal(query.input.ScanIndexForward, false);
  assert.equal(query.input.Limit, 2);
});

test('DynamoDB news repository reconstructs only normalized public fields', async () => {
  const client = createFakeDynamoDbClient();
  const repository = createRepository(client);
  const article = createArticle('public-contract', '2026-08-13T08:00:00.000Z', {
    tickers: ['NVDA']
  });

  await repository.saveArticles([article]);
  const articles = await repository.listLatestArticles(10);

  assert.deepEqual(articles, [article]);
  assert.equal(validateNewsArticles(articles).valid, true);
  assert.equal(Object.hasOwn(articles[0], 'feedKey'), false);
  assert.equal(Object.hasOwn(articles[0], 'expiresAt'), false);
});

test('DynamoDB news repository rejects malformed persisted articles', async () => {
  const client = createFakeDynamoDbClient([{
    id: 'malformed',
    feedKey: NEWS_FEED_KEY,
    publishedKey: '2026-08-13T08:00:00.000Z#malformed',
    publishedAt: '2026-08-13T08:00:00.000Z',
    tickers: []
  }]);
  const repository = createRepository(client);

  await assert.rejects(
    repository.listLatestArticles(10),
    /Persisted news article malformed is invalid/
  );
});
