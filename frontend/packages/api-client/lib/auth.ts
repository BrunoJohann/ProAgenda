import { getApiClient } from './api-client';
import type { LoginDto, SignupDto, AuthResponse, User } from '../types';

export class AuthService {
  private client = getApiClient();

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.client.axios.post<AuthResponse>('/v1/auth/login', data);
    const { accessToken, refreshToken } = response.data;
    this.client.setTokens(accessToken, refreshToken);
    return response.data;
  }

  async signup(data: SignupDto): Promise<AuthResponse> {
    const response = await this.client.axios.post<AuthResponse>('/v1/auth/signup', data);
    const { accessToken, refreshToken } = response.data;
    this.client.setTokens(accessToken, refreshToken);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        await this.client.axios.post('/v1/auth/logout', { refreshToken });
      }
    } finally {
      this.client.clearAuth();
    }
  }

  async me(): Promise<User> {
    const response = await this.client.axios.get<User>('/v1/auth/me');
    return response.data;
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await this.client.axios.post<{ accessToken: string; refreshToken: string }>(
      '/v1/auth/refresh',
      { refreshToken: token }
    );
    const { accessToken, refreshToken } = response.data;
    this.client.setTokens(accessToken, refreshToken);
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.client.getAccessToken();
  }
}

export const authService = new AuthService();

