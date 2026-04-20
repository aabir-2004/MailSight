import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('maillens-store');
  if (raw) {
    try {
      const store = JSON.parse(raw);
      const token = store?.state?.user?.id;
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch (_) {}
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('maillens-store');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// ─── Mock helpers (used when backend is offline) ─────────────────────────────
export const isMockMode = () => import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_API_URL;

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
