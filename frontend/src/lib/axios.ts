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
    response.data = snakeToCamel(response.data);
    if (response.data && (response.data as Record<string, unknown>).success === false) {
      return Promise.reject(response.data);
    }
    return response;
  },
  (error) => {
    // 如果是从 success 拦截器中 reject 的后端响应（success=false），直接透传
    if (error && typeof error === 'object' && (error as Record<string, unknown>).success === false) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    const data = error.response?.data;
    const normalized = data ? snakeToCamel(data) : { success: false, error: '网络错误' };
    return Promise.reject({
      ...(normalized as Record<string, unknown>),
      status: error.response?.status,
    });
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
