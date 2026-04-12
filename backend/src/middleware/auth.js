import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamoClient.js';

export async function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Missing API key.'
    });
  }

  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { apiKey }
    }));

    const record = result.Item;

    if (!record || !record.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or inactive API key.'
      });
    }

    // Fire-and-forget: update lastUsed timestamp
    docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { apiKey },
      UpdateExpression: 'SET lastUsed = :now',
      ExpressionAttributeValues: { ':now': new Date().toISOString() }
    })).catch(console.error);

    req.clientId = record.clientId;
    return next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Auth check failed.'
    });
  }
}