import { Router } from 'express';
import { listNewsArticles } from '../services/newsService.js';
import { buildErrorResponse, buildNewsResponse } from '../utils/responseBuilders.js';

const newsRouter = Router();

newsRouter.get('/', async (_, res) => {
  try {
    const articles = await listNewsArticles();
    return res.json(buildNewsResponse(articles));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildErrorResponse('Failed to load news articles.')
    );
  }
});

export default newsRouter;
