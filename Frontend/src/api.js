
import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://anish-portfolio-vo07.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const assetUrl = (url) => {
  if (!url) return '';

  // Return absolute URLs as they are
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Remove trailing slash and combine with the file path
  const serverUrl = API_URL.replace(/\/api\/?$/, '');

  return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default api;

