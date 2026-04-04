import { useEffect, useRef, useState } from 'react';
import { fetchReportQa } from '../api/reportQa';

export default function useReportQa(ticker) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerResult, setAnswerResult] = useState(null);
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const activeRequestRef = useRef(0);

  useEffect(() => {
    activeRequestRef.current += 1;
    setQuestion('');
    setSubmittedQuestion('');
    setLoading(false);
    setError('');
    setAnswerResult(null);
  }, [ticker]);

  async function submitQuestion(nextQuestion) {
    const normalizedTicker = String(ticker || '').trim().toUpperCase();
    const normalizedQuestion = String(nextQuestion ?? question).trim();

    if (!normalizedTicker) {
      return;
    }

    if (!normalizedQuestion) {
      setError('Enter a question about this report.');
      return;
    }

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoading(true);
    setError('');
    setAnswerResult(null);
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
      setAnswerResult(data);
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
    setAnswerResult(null);
  }

  return {
    question,
    setQuestion,
    submittedQuestion,
    loading,
    error,
    answerResult,
    submitQuestion,
    clearAnswer
  };
}
