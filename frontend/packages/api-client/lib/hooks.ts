// React Query hooks para uso nos componentes
// Este arquivo exporta hooks personalizados que usam React Query

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { authService } from './auth';
import { api } from './services';
import type {
  LoginDto,
  SignupDto,
  AuthResponse,
  User,
  Filial,
  CreateFilialDto,
  UpdateFilialDto,
  Professional,
  CreateProfessionalDto,
  Service,
  CreateServiceDto,
  Customer,
  CreateCustomerDto,
  Metrics,
  MetricsQuery,
} from '../types';

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SignupDto) => authService.signup(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useMe(options?: UseQueryOptions<User>) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    ...options,
  });
}

// Filiais hooks
export function useFiliais() {
  return useQuery({
    queryKey: ['filiais'],
    queryFn: async () => {
      const response = await api.filiais.list();
      return response.data;
    },
  });
}

export function useFilial(id: string | undefined) {
  return useQuery({
    queryKey: ['filiais', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');
      const response = await api.filiais.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateFilial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFilialDto) => {
      const response = await api.filiais.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] });
    },
  });
}

export function useUpdateFilial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFilialDto }) => {
      const response = await api.filiais.update(id, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] });
      queryClient.invalidateQueries({ queryKey: ['filiais', id] });
    },
  });
}

export function useDeleteFilial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.filiais.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiais'] });
    },
  });
}

// Professionals hooks
export function useProfessionals(filialId: string | undefined) {
  return useQuery({
    queryKey: ['professionals', filialId],
    queryFn: async () => {
      if (!filialId) throw new Error('Filial ID required');
      const response = await api.professionals.list(filialId);
      return response.data;
    },
    enabled: !!filialId,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, data }: { filialId: string; data: CreateProfessionalDto }) => {
      const response = await api.professionals.create(filialId, data);
      return response.data;
    },
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', filialId] });
    },
  });
}

// Services hooks
export function useServices(filialId: string | undefined) {
  return useQuery({
    queryKey: ['services', filialId],
    queryFn: async () => {
      if (!filialId) throw new Error('Filial ID required');
      const response = await api.services.list(filialId);
      return response.data;
    },
    enabled: !!filialId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, data }: { filialId: string; data: CreateServiceDto }) => {
      const response = await api.services.create(filialId, data);
      return response.data;
    },
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', filialId] });
    },
  });
}

// Customers hooks
export function useCustomers(filialId?: string) {
  return useQuery({
    queryKey: ['customers', filialId],
    queryFn: async () => {
      const response = await api.customers.list(filialId ? { filialId } : undefined);
      return response.data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerDto) => {
      const response = await api.customers.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Metrics hooks
export function useMetrics(filialId: string | undefined, params: MetricsQuery) {
  return useQuery({
    queryKey: ['metrics', filialId, params],
    queryFn: async () => {
      if (!filialId) throw new Error('Filial ID required');
      const response = await api.metrics.get(filialId, params);
      return response.data;
    },
    enabled: !!filialId && !!params.from && !!params.to,
  });
}

