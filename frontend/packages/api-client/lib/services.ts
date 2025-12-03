import { getApiClient } from './api-client';
import type {
  Tenant,
  UpdateTenantDto,
  Filial,
  CreateFilialDto,
  UpdateFilialDto,
  UpdateSettingsDto,
  Professional,
  CreateProfessionalDto,
  UpdateProfessionalDto,
  WorkingPeriod,
  CreatePeriodDto,
  BlockedTime,
  CreateBlockDto,
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Appointment,
  CreateAppointmentDto,
  CreateInternalAppointmentDto,
  CreateCustomerAppointmentDto,
  UpdateAppointmentDto,
  CancelAppointmentDto,
  Slot,
  SlotsQuery,
  Metrics,
  MetricsQuery,
  User,
} from '../types';

const client = () => getApiClient().axios;

// Tenants
export const tenantsApi = {
  getMe: () => client().get<Tenant>('/v1/admin/tenants/me'),
  update: (data: UpdateTenantDto) => client().patch<Tenant>('/v1/admin/tenants/me', data),
};

// Filiais
export const filiaisApi = {
  create: (data: CreateFilialDto) => client().post<Filial>('/v1/admin/filiais', data),
  list: () => client().get<Filial[]>('/v1/admin/filiais'),
  getById: (id: string) => client().get<Filial>(`/v1/admin/filiais/${id}`),
  update: (id: string, data: UpdateFilialDto) => client().patch<Filial>(`/v1/admin/filiais/${id}`, data),
  delete: (id: string) => client().delete(`/v1/admin/filiais/${id}`),
  updateSettings: (id: string, data: UpdateSettingsDto) =>
    client().patch(`/v1/admin/filiais/${id}/settings`, data),
  // Public
  listPublic: (tenant: string) => client().get<Filial[]>('/v1/public/filiais', { params: { tenant } }),
};

// Professionals
export const professionalsApi = {
  create: (filialId: string, data: CreateProfessionalDto) =>
    client().post<Professional>(`/v1/admin/filiais/${filialId}/professionals`, data),
  list: (filialId: string) => client().get<Professional[]>(`/v1/admin/filiais/${filialId}/professionals`),
  getById: (filialId: string, id: string) =>
    client().get<Professional>(`/v1/admin/filiais/${filialId}/professionals/${id}`),
  update: (filialId: string, id: string, data: UpdateProfessionalDto) =>
    client().patch<Professional>(`/v1/admin/filiais/${filialId}/professionals/${id}`, data),
  delete: (filialId: string, id: string) =>
    client().delete(`/v1/admin/filiais/${filialId}/professionals/${id}`),
  
  // Periods
  getPeriods: (filialId: string, professionalId: string) =>
    client().get<WorkingPeriod[]>(`/v1/admin/filiais/${filialId}/professionals/${professionalId}/periods`),
  createPeriod: (filialId: string, professionalId: string, data: CreatePeriodDto) =>
    client().post<WorkingPeriod>(`/v1/admin/filiais/${filialId}/professionals/${professionalId}/periods`, data),
  deletePeriod: (filialId: string, professionalId: string, periodId: string) =>
    client().delete(`/v1/admin/filiais/${filialId}/professionals/${professionalId}/periods/${periodId}`),
  
  // Blocks
  getBlocks: (professionalId: string, params?: { from?: string; to?: string }) =>
    client().get<BlockedTime[]>(`/v1/admin/professionals/${professionalId}/blocks`, { params }),
  createBlock: (professionalId: string, data: CreateBlockDto) =>
    client().post<BlockedTime>(`/v1/admin/professionals/${professionalId}/blocks`, data),
  deleteBlock: (professionalId: string, blockId: string) =>
    client().delete(`/v1/admin/professionals/${professionalId}/blocks/${blockId}`),
};

// Services
export const servicesApi = {
  create: (filialId: string, data: CreateServiceDto) =>
    client().post<Service>(`/v1/admin/filiais/${filialId}/services`, data),
  list: (filialId: string) => client().get<Service[]>(`/v1/admin/filiais/${filialId}/services`),
  update: (filialId: string, id: string, data: UpdateServiceDto) =>
    client().patch<Service>(`/v1/admin/filiais/${filialId}/services/${id}`, data),
  delete: (filialId: string, id: string) => client().delete(`/v1/admin/filiais/${filialId}/services/${id}`),
  
  // Professional linking
  linkProfessional: (filialId: string, serviceId: string, professionalId: string) =>
    client().post(`/v1/admin/filiais/${filialId}/services/${serviceId}/professionals/${professionalId}`),
  unlinkProfessional: (filialId: string, serviceId: string, professionalId: string) =>
    client().delete(`/v1/admin/filiais/${filialId}/services/${serviceId}/professionals/${professionalId}`),
  
  // Public
  listPublic: (params: { tenant: string; filialId: string; professionalId?: string }) =>
    client().get<Service[]>('/v1/public/services', { params }),
};

// Customers
export const customersApi = {
  create: (data: CreateCustomerDto) => client().post<Customer>('/v1/admin/customers', data),
  list: (params?: { filialId?: string }) => client().get<Customer[]>('/v1/admin/customers', { params }),
  getById: (id: string) => client().get<Customer>(`/v1/admin/customers/${id}`),
  update: (id: string, data: UpdateCustomerDto) => client().patch<Customer>(`/v1/admin/customers/${id}`, data),
  delete: (id: string) => client().delete(`/v1/admin/customers/${id}`),
};

// Appointments
export const appointmentsApi = {
  createInternal: (filialId: string, data: CreateInternalAppointmentDto) =>
    client().post<Appointment>(`/v1/admin/filiais/${filialId}/appointments`, data),
  
  list: (params?: {
    filialId?: string;
    professionalId?: string;
    from?: string;
    to?: string;
    status?: string;
    customerId?: string;
  }) => client().get<Appointment[]>('/v1/admin/appointments', { params }),
  
  getById: (id: string) =>
    client().get<Appointment>(`/v1/admin/appointments/${id}`),
  
  update: (id: string, data: UpdateAppointmentDto) =>
    client().patch<Appointment>(`/v1/admin/appointments/${id}`, data),
  
  cancel: (id: string, data: CancelAppointmentDto) =>
    client().patch<Appointment>(`/v1/admin/appointments/${id}/cancel`, data),
  
  // Slots públicos
  getSlots: (params: SlotsQuery) => client().get<Slot[]>('/v1/public/slots', { params }),
  
  // Public appointment creation
  createPublic: (tenant: string, data: CreateAppointmentDto) =>
    client().post<Appointment>('/v1/public/appointments', data, { params: { tenant } }),
};

// Customer Auth
export const customerAuthApi = {
  sendMagicLink: (tenant: string, email: string) =>
    client().post<{ sent: boolean; message: string; devLink?: string }>(
      '/v1/customer/auth/send-magic-link',
      { email },
      { params: { tenant } }
    ),
  verifyMagicLink: (token: string, tenant: string) =>
    client().get<{ user: any; accessToken: string; refreshToken: string }>(
      '/v1/customer/auth/verify-magic-link',
      { params: { token, tenant } }
    ),
};

// Customer Appointments
export const customerAppointmentsApi = {
  list: (params?: {
    from?: string;
    to?: string;
    status?: string;
  }) => client().get<Appointment[]>('/v1/customer/appointments', { params }),
  
  getById: (id: string) =>
    client().get<Appointment>(`/v1/customer/appointments/${id}`),
  
  create: (data: CreateCustomerAppointmentDto) =>
    client().post<Appointment>('/v1/customer/appointments', data),
  
  cancel: (id: string, data: CancelAppointmentDto) =>
    client().patch<Appointment>(`/v1/customer/appointments/${id}/cancel`, data),
  
  getHistory: () =>
    client().get<Appointment[]>('/v1/customer/appointments/history'),
  
  getServiceHistory: () =>
    client().get<Array<{
      serviceIds: string[];
      serviceNames: string[];
      lastUsedAt: string;
      appointmentId: string;
      count: number;
    }>>('/v1/customer/appointments/service-history'),
};

// Users
export const usersApi = {
  create: (data: { name: string; email: string; password: string; phone?: string }) =>
    client().post<User>('/v1/admin/users', data),
  list: () => client().get<User[]>('/v1/admin/users'),
  getById: (id: string) => client().get<User>(`/v1/admin/users/${id}`),
  update: (id: string, data: { name?: string; email?: string; phone?: string; password?: string }) =>
    client().patch<User>(`/v1/admin/users/${id}`, data),
  delete: (id: string) => client().delete(`/v1/admin/users/${id}`),
  getRoles: (id: string) => client().get(`/v1/admin/users/${id}/roles`),
  assignRole: (id: string, data: { role: string; filialId?: string }) =>
    client().post(`/v1/admin/users/${id}/roles`, data),
  removeRole: (id: string, roleId: string) => client().delete(`/v1/admin/users/${id}/roles/${roleId}`),
};

// Metrics
export const metricsApi = {
  get: (filialId: string, params: MetricsQuery) =>
    client().get<Metrics>(`/v1/admin/filiais/${filialId}/metrics`, { params }),
};

// Export all as a single API object
export const api = {
  tenants: tenantsApi,
  filiais: filiaisApi,
  professionals: professionalsApi,
  services: servicesApi,
  customers: customersApi,
  appointments: appointmentsApi,
  customerAuth: customerAuthApi,
  customerAppointments: customerAppointmentsApi,
  users: usersApi,
  metrics: metricsApi,
};

