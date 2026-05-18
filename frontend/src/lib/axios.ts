import axios from 'axios';

function snakeToCamel(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(snakeToCamel);
  if (typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camelKey] = snakeToCamel((value as Record<string, unknown>)[key]);
  }
  return result;
}

function camelToSnake(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(camelToSnake);
  if (typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = camelToSnake((value as Record<string, unknown>)[key]);
  }
  return result;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.data = camelToSnake(config.data);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const result = snakeToCamel(response.data) as any
    if (result && result.success === false) {
      return Promise.reject(result)
    }
    return result
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const data = error.response?.data;
    return Promise.reject(data ? snakeToCamel(data) : { success: false, error: '网络错误' });
  }
);

export const uploadWithProgress = (
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
) => {
  return apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
};

export default apiClient;