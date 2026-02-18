import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApiError } from '@/types/api';

function getBaseUrl(): string {
  // Variable définie dans .env (EXPO_PUBLIC_ = accessible dans le bundle)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3000';
    // Fallback : IP du PC via l'URL Expo (Expo Go sur appareil physique)
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    if (host) return `http://${host}:3000`;
  }

  return 'https://api.eco-relais.fr';
}

const BASE_URL = getBaseUrl();

let _getToken: (() => string | null) | null = null;

export function setTokenGetter(getter: () => string | null) {
  _getToken = getter;
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };

  const token = _getToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: ApiError = {
      message: data?.message ?? data?.error ?? 'Une erreur est survenue.',
      statusCode: res.status,
    };
    throw error;
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}
