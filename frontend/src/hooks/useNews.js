import { useEffect, useState } from 'react';
import { API_BASE, API_HEADERS } from '../config/api';

export default function useNews() {
  const [articles, setArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState('');

  useEffect(() => {
    async function loadNews() {
      try {
        setNewsLoading(true);
        setNewsError('');

        const response = await fetch(`${API_BASE}/api/news`, {
          headers: API_HEADERS
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load news articles.');
        }

        if (data.status !== 'ok' || !Array.isArray(data.articles)) {
          throw new Error('The news service returned an invalid response.');
        }

        setArticles(data.articles);
      } catch (error) {
        setArticles([]);
        setNewsError(error.message);
      } finally {
        setNewsLoading(false);
      }
    }

    loadNews();
  }, []);

  return {
    articles,
    newsLoading,
    newsError
  };
}
