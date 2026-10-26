import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { api, ApiError } from './api';
import type { Usuario } from './tipos';

interface Auth {
  usuario: Usuario | null;
  cargando: boolean;
  login: (codigo: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const login = useMutation({
    mutationFn: ({ codigo, password }: { codigo: string; password: string }) => api.login(codigo, password),
    onSuccess: (usuario) => {
      queryClient.clear();
      queryClient.setQueryData(['me'], usuario);
    },
  });

  const valor: Auth = {
    usuario: me.data ?? null,
    cargando: me.isLoading,
    login: (codigo, password) => login.mutateAsync({ codigo, password }),
    logout: async () => {
      await api.logout().catch(() => undefined);
      queryClient.clear();
      queryClient.setQueryData(['me'], null);
    },
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
