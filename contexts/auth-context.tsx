import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiPost, setTokenGetter } from '@/services/api';
import { User, AuthResponse, ApiError } from '@/types/api';

const TOKEN_KEY = '@eco_relais_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, role: 'client' | 'partner') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Expose le token au service API
  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  // Hydration : charger le token persisté au démarrage
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY)
      .then(async (saved) => {
        if (saved) {
          setToken(saved);
          // Récupérer le profil avec le token sauvegardé
          try {
            // On importe dynamiquement pour éviter la circularité avec setTokenGetter
            setTokenGetter(() => saved);
            const { apiGet } = await import('@/services/api');
            const data = await apiGet<{ user: User }>('/api/users/profile');
            setUser(data.user);
          } catch {
            // Token expiré ou invalide → nettoyer
            await AsyncStorage.removeItem(TOKEN_KEY);
            setToken(null);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<AuthResponse>('/api/auth/login', { email, password });
    await persist(data.token, data.user);
  }, [persist]);

  const register = useCallback(async (firstName: string, lastName: string, email: string, password: string, role: 'client' | 'partner') => {
    const data = await apiPost<AuthResponse>('/api/auth/register', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role,
    });
    await persist(data.token, data.user);
  }, [persist]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { ApiError };
