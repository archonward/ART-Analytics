export function buildErrorResponse(message) {
  return {
    status: 'error',
    error: message
  };
}

export function buildNotResearchedResponse({ ticker }) {
  return {
    status: 'not_researched',
    ticker,
    message: `We have not published research coverage for ${ticker} yet.`
  };
}

export function buildCoveredResponse(report) {
  return {
    status: 'covered',
    ...report
  };
}

export function buildMarketDataResponse(marketData) {
  return {
    status: 'ok',
    ...marketData
  };
}

export function buildMarketDataUnavailableResponse({ ticker, message }) {
  return {
    status: 'unavailable',
    ticker,
    message
  };
}