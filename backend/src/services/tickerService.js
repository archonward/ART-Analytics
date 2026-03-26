const tickerPattern = /^[A-Z]{1,5}$/;

export function validateTickerFormat(ticker) {
  if (!tickerPattern.test(ticker)) {
    return {
      valid: false,
      reason: 'Please enter a valid stock ticker (1-5 uppercase letters).'
    };
  }

  return {
    valid: true
  };
}