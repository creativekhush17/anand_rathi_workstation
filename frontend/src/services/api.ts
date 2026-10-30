const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'https://anand-rathi-workstation.onrender.com';

const TOKEN_KEY = 'ar_access_token';
const REFRESH_TOKEN_KEY = 'ar_refresh_token';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parse failure for error response
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export async function checkApiHealth(): Promise<boolean> {
  const hosts = [API_BASE_URL, 'https://anand-rathi-workstation.onrender.com', 'http://127.0.0.1:8000', 'http://localhost:8000'];
  for (const host of hosts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${host}/health`, { signal: controller.signal, mode: 'cors' });
      clearTimeout(timeoutId);
      if (res.ok) return true;
    } catch {
      // try next host
    }
  }
  return false;
}
