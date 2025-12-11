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
  CreateAppointmentDto,
  Slot,
  SlotsQuery,
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
    queryFn: async () => {
      const user = await authService.me();
      // Mapear roleAssignments para roles se necessário
      if (user && 'roleAssignments' in user) {
        return {
          ...user,
          roles: (user as any).roleAssignments || [],
        } as User;
      }
      return user;
    },
    ...options,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; phone?: string; password?: string }) => {
      const response = await authService.updateMe(data);
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
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

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, id, data }: { filialId: string; id: string; data: any }) => {
      const response = await api.professionals.update(filialId, id, data);
      return response.data;
    },
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', filialId] });
    },
  });
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filialId, id }: { filialId: string; id: string }) =>
      api.professionals.delete(filialId, id),
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['professionals', filialId] });
    },
  });
}

// Working Periods hooks
export function useWorkingPeriods(filialId: string | undefined, professionalId: string | undefined) {
  return useQuery({
    queryKey: ['periods', filialId, professionalId],
    queryFn: async () => {
      if (!filialId || !professionalId) throw new Error('IDs required');
      const response = await api.professionals.getPeriods(filialId, professionalId);
      return response.data;
    },
    enabled: !!filialId && !!professionalId,
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, professionalId, data }: any) => {
      const response = await api.professionals.createPeriod(filialId, professionalId, data);
      return response.data;
    },
    onSuccess: (_, { filialId, professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['periods', filialId, professionalId] });
    },
  });
}

export function useDeletePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filialId, professionalId, periodId }: any) =>
      api.professionals.deletePeriod(filialId, professionalId, periodId),
    onSuccess: (_, { filialId, professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['periods', filialId, professionalId] });
    },
  });
}

// Blocks hooks
export function useBlocks(professionalId: string | undefined, params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['blocks', professionalId, params],
    queryFn: async () => {
      if (!professionalId) throw new Error('Professional ID required');
      const response = await api.professionals.getBlocks(professionalId, params);
      return response.data;
    },
    enabled: !!professionalId,
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ professionalId, data }: any) => {
      const response = await api.professionals.createBlock(professionalId, data);
      return response.data;
    },
    onSuccess: (_, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['blocks', professionalId] });
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ professionalId, blockId }: any) =>
      api.professionals.deleteBlock(professionalId, blockId),
    onSuccess: (_, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ['blocks', professionalId] });
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

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, id, data }: any) => {
      const response = await api.services.update(filialId, id, data);
      return response.data;
    },
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', filialId] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filialId, id }: { filialId: string; id: string }) =>
      api.services.delete(filialId, id),
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', filialId] });
    },
  });
}

export function useLinkProfessionalToService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filialId, serviceId, professionalId }: any) =>
      api.services.linkProfessional(filialId, serviceId, professionalId),
    onSuccess: (_, { filialId }) => {
      queryClient.invalidateQueries({ queryKey: ['services', filialId] });
    },
  });
}

export function useUnlinkProfessionalFromService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filialId, serviceId, professionalId }: any) =>
      api.services.unlinkProfessional(filialId, serviceId, professionalId),
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

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: any) => {
      const response = await api.customers.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.customers.delete(id),
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
      const backendData = response.data;
      
      // Mapear estrutura do backend para o formato esperado pelo frontend
      return {
        summary: {
          totalAppointments: backendData.summary?.appointments || 0,
          confirmedAppointments: backendData.summary?.appointments || 0,
          canceledAppointments: backendData.summary?.cancellations || 0,
          cancelRate: backendData.summary?.cancelRate || 0,
          occupancyRate: backendData.summary?.occupancyPct || 0,
          revenue: 0, // TODO: Calcular receita quando backend retornar
          bySource: backendData.summary?.bySource,
          byCustomerType: backendData.summary?.byCustomerType,
        },
        timeseries: (backendData.timeseries?.byDay || []).map((day: any) => ({
          date: day.date,
          appointments: day.appointments || 0,
          revenue: 0, // TODO: Calcular receita quando backend retornar
        })),
        performance: {
          avgDurationMinutes: backendData.summary?.avgDurationMin || 0,
          avgBufferMinutes: 0, // TODO: Calcular quando backend retornar
          peakHours: [], // TODO: Calcular quando backend retornar
        },
        serviceMix: (backendData.serviceMix || []).map((service: any) => ({
          serviceId: service.serviceId,
          serviceName: service.name || service.serviceName,
          count: service.count || 0,
          revenue: 0, // TODO: Calcular receita quando backend retornar
        })),
        heatmap: (backendData.heatmap?.weekdayHour || []).map((item: any) => ({
          weekday: item.weekday,
          hour: item.hour,
          count: item.appointments || 0,
        })),
      };
    },
    enabled: !!filialId && !!params.from && !!params.to,
  });
}

// Appointments hooks
export function useAppointments(params?: {
  filialId?: string;
  professionalId?: string;
  from?: string;
  to?: string;
  status?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const response = await api.appointments.list(params);
      return response.data;
    },
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      if (!id) throw new Error('ID required');
      const response = await api.appointments.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateInternalAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ filialId, data }: { filialId: string; data: any }) => {
      const response = await api.appointments.createInternal(filialId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.appointments.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.appointments.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Users hooks
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.users.list();
      // Mapear roleAssignments para roles (backend retorna roleAssignments, frontend espera roles)
      const users = response.data.map((user: any) => ({
        ...user,
        roles: user.roleAssignments || [],
      }));
      return users;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.users.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.users.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: any) => api.users.assignRole(userId, data),
    onSuccess: () => {
      // Invalidar e refetch imediatamente para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: any) => api.users.removeRole(userId, roleId),
    onSuccess: () => {
      // Invalidar e refetch imediatamente para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });
}

// Public hooks for booking portal
export function usePublicFiliais(tenant: string | undefined) {
  return useQuery({
    queryKey: ['public', 'filiais', tenant],
    queryFn: async () => {
      if (!tenant) throw new Error('Tenant required');
      try {
        const response = await api.filiais.listPublic(tenant);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching filiais:', error);
        throw new Error(
          error?.response?.data?.message || 
          error?.message || 
          'Erro ao carregar filiais. Verifique se o tenant está correto.'
        );
      }
    },
    enabled: !!tenant,
    retry: 1,
  });
}

export function usePublicServices(params: { tenant: string; filialId: string; professionalId?: string } | undefined) {
  return useQuery({
    queryKey: ['public', 'services', params],
    queryFn: async () => {
      if (!params) throw new Error('Params required');
      const response = await api.services.listPublic(params);
      return response.data;
    },
    enabled: !!params && !!params.tenant && !!params.filialId,
  });
}

export function usePublicSlots(params: SlotsQuery | undefined) {
  return useQuery({
    queryKey: ['public', 'slots', params],
    queryFn: async () => {
      if (!params) throw new Error('Params required');
      const response = await api.appointments.getSlots(params);
      return response.data;
    },
    enabled: !!params && !!params.tenant && !!params.filialId && !!params.date && !!params.serviceIds,
  });
}

export function useCreatePublicAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenant, data }: { tenant: string; data: CreateAppointmentDto }) => {
      const response = await api.appointments.createPublic(tenant, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'slots'] });
    },
  });
}

