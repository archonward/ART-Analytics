export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const API_HEADERS = {
  'x-api-key': import.meta.env.VITE_API_KEY || ''
};