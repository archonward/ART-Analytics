import { API_BASE, API_HEADERS } from '../config/api';

export async function fetchReportQa({ ticker, question, topK }) {
  const payload = {
    ticker,
    question
  };

  if (typeof topK === 'number' && Number.isFinite(topK) && topK > 0) {
    payload.topK = topK;
  }

  const response = await fetch(`${API_BASE}/api/report-qa`, {
    method: 'POST',
    headers: {
      ...API_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Could not ask the report.');
  }

  return data;
}