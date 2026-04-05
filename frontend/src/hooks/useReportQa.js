import { useEffect, useRef, useState } from 'react';
import { fetchReportQa } from '../api/reportQa';

const MAX_HISTORY_ITEMS = 6;

export default function useReportQa(ticker) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [historyByTicker, setHistoryByTicker] = useState({});
  const activeRequestRef = useRef(0);
  const normalizedTicker = String(ticker || '').trim().toUpperCase();
  const history = historyByTicker[normalizedTicker] || [];
  const latestEntry = history[0] || null;

  useEffect(() => {
    activeRequestRef.current += 1;
    setQuestion('');
    setSubmittedQuestion('');
    setLoading(false);
    setError('');
  }, [ticker]);

  async function submitQuestion(nextQuestion) {
    const normalizedQuestion = String(nextQuestion ?? question).trim();

    if (!normalizedTicker) {
      return;
    }

    if (!normalizedQuestion) {
      setError('Enter a question about this report.');
      return;
    }

    if (loading && normalizedQuestion === submittedQuestion) {
      return;
    }

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoading(true);
    setError('');
    setSubmittedQuestion(normalizedQuestion);

    try {
      const data = await fetchReportQa({
        ticker: normalizedTicker,
        question: normalizedQuestion
      });

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setQuestion(normalizedQuestion);
      setHistoryByTicker((previous) => {
        const nextEntry = {
          id: `${normalizedTicker}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ticker: normalizedTicker,
          question: data.question || normalizedQuestion,
          answer: data.answer,
          grounded: Boolean(data.grounded),
          citations: data.citations || [],
          createdAt: Date.now()
        };
        const existingHistory = previous[normalizedTicker] || [];
        const dedupedHistory = existingHistory.filter((entry) => (
          !(entry.question === nextEntry.question && entry.answer === nextEntry.answer)
        ));

        return {
          ...previous,
          [normalizedTicker]: [nextEntry, ...dedupedHistory].slice(0, MAX_HISTORY_ITEMS)
        };
      });
    } catch (requestError) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      setError(requestError.message);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }

  function clearAnswer() {
    activeRequestRef.current += 1;
    setQuestion('');
    setSubmittedQuestion('');
    setError('');
    setLoading(false);
  }

  return {
    question,
    setQuestion,
    submittedQuestion,
    loading,
    error,
    latestEntry,
    history,
    submitQuestion,
    clearAnswer
  };
}
