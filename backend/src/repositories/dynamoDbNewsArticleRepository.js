import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamoClient.js';
import { validateNewsArticle } from '../utils/newsValidator.js';
import { assertNewsArticleRepository } from './newsArticleRepository.js';

export const NEWS_FEED_KEY = 'NEWS';
export const NEWS_RECORD_SCHEMA_VERSION = 1;
export const DEFAULT_NEWS_RETENTION_DAYS = 90;

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }

  return value.trim();
}

function assertArticle(article) {
  const validation = validateNewsArticle(article);

  if (!validation.valid) {
    throw new TypeError(`News article data is invalid: ${validation.errors.join('; ')}`);
  }
}

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('News repository clock must return a valid date.');
  }

  return date;
}

function isDuplicateWrite(error) {
  return error?.name === 'ConditionalCheckFailedException';
}

export function toNewsRecord(article, {
  provider,
  retrievedAt,
  retentionDays
}) {
  assertArticle(article);

  const retrievalDate = toDate(retrievedAt);
  const expiresAt = Math.floor(
    (retrievalDate.getTime() + retentionDays * 24 * 60 * 60 * 1000) / 1000
  );

  return {
    ...article,
    tickers: [...article.tickers],
    feedKey: NEWS_FEED_KEY,
    publishedKey: `${article.publishedAt}#${article.id}`,
    retrievedAt: retrievalDate.toISOString(),
    provider,
    expiresAt,
    schemaVersion: NEWS_RECORD_SCHEMA_VERSION
  };
}

export function fromNewsRecord(record) {
  const article = {
    id: record?.id,
    headline: record?.headline,
    summary: record?.summary,
    source: record?.source,
    publishedAt: record?.publishedAt,
    url: record?.url,
    coverageCategory: record?.coverageCategory,
    sector: record?.sector,
    tickers: Array.isArray(record?.tickers) ? [...record.tickers] : record?.tickers
  };
  const validation = validateNewsArticle(article);

  if (!validation.valid) {
    const recordId = typeof record?.id === 'string' ? ` ${record.id}` : '';
    throw new TypeError(
      `Persisted news article${recordId} is invalid: ${validation.errors.join('; ')}`
    );
  }

  return article;
}

export function createDynamoDbNewsArticleRepository({
  client = docClient,
  tableName = process.env.NEWS_DYNAMODB_TABLE_NAME,
  indexName = process.env.NEWS_DYNAMODB_FEED_INDEX_NAME,
  provider = 'marketaux',
  retentionDays = DEFAULT_NEWS_RETENTION_DAYS,
  now = () => new Date()
} = {}) {
  const resolvedTableName = requireNonEmptyString(tableName, 'News DynamoDB table name');
  const resolvedIndexName = requireNonEmptyString(indexName, 'News DynamoDB feed index name');
  const resolvedProvider = requireNonEmptyString(provider, 'News provider');

  if (!client || typeof client.send !== 'function') {
    throw new TypeError('News DynamoDB client must implement send().');
  }

  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new TypeError('News retention days must be a positive integer.');
  }

  return assertNewsArticleRepository({
    async saveArticles(articles) {
      if (!Array.isArray(articles)) {
        throw new TypeError('News articles must be an array.');
      }

      const retrievedAt = toDate(now());

      await Promise.all(articles.map(async (article) => {
        const item = toNewsRecord(article, {
          provider: resolvedProvider,
          retrievedAt,
          retentionDays
        });

        try {
          await client.send(new PutCommand({
            TableName: resolvedTableName,
            Item: item,
            ConditionExpression: 'attribute_not_exists(id)'
          }));
        } catch (error) {
          if (!isDuplicateWrite(error)) {
            throw error;
          }
        }
      }));
    },

    async listLatestArticles(limit) {
      if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError('News article limit must be a positive integer.');
      }

      const result = await client.send(new QueryCommand({
        TableName: resolvedTableName,
        IndexName: resolvedIndexName,
        KeyConditionExpression: '#feedKey = :feedKey',
        ExpressionAttributeNames: {
          '#feedKey': 'feedKey'
        },
        ExpressionAttributeValues: {
          ':feedKey': NEWS_FEED_KEY
        },
        ScanIndexForward: false,
        Limit: limit
      }));

      if (result.Items !== undefined && !Array.isArray(result.Items)) {
        throw new TypeError('DynamoDB news query returned an invalid item collection.');
      }

      return (result.Items || []).map(fromNewsRecord);
    }
  });
}
