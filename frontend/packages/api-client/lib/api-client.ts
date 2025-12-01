import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiError } from '../types';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        // Se o erro for 401 e temos refresh token, tentar renovar
        if (error.response?.status === 401 && refreshToken && originalRequest) {
          try {
            const response = await axios.post(`${this.baseURL}/v1/auth/refresh`, {
              refreshToken,
            });

            const { accessToken: newAccessToken } = response.data;
            accessToken = newAccessToken;

            // Salvar no localStorage se estiver no browser
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', newAccessToken);
            }

            // Retry request original
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Se falhar ao renovar, limpar tokens e redirecionar para login
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;

    // Salvar no localStorage se estiver no browser
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  }

  clearAuth() {
    accessToken = null;
    refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  getAccessToken() {
    return accessToken;
  }

  loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      const access = localStorage.getItem('accessToken');
      const refresh = localStorage.getItem('refreshToken');
      if (access && refresh) {
        accessToken = access;
        refreshToken = refresh;
      }
    }
  }

  get axios() {
    return this.client;
  }
}

// Instância singleton
let apiClient: ApiClient | null = null;

export function getApiClient(baseURL?: string): ApiClient {
  if (!apiClient) {
    const url = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    apiClient = new ApiClient(url);
    // Carregar tokens do localStorage ao inicializar
    apiClient.loadTokensFromStorage();
  }
  return apiClient;
}

export function clearApiClient() {
  apiClient = null;
}

