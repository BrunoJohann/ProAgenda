// Types baseados no backend

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  PROFESSIONAL = 'PROFESSIONAL',
  ANALYST = 'ANALYST',
  CUSTOMER = 'CUSTOMER',
}

export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
}

export enum CustomerType {
  REGISTERED = 'REGISTERED',
  IDENTIFIED_NO_LOGIN = 'IDENTIFIED_NO_LOGIN',
  WALKIN_NAME_ONLY = 'WALKIN_NAME_ONLY',
}

export enum AppointmentSource {
  INTERNAL = 'INTERNAL',
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',
  WHATSAPP = 'WHATSAPP',
  INTEGRATION = 'INTEGRATION',
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tenantId?: string;
  roles: RoleAssignment[];
}

export interface RoleAssignment {
  id: string;
  role: Role;
  filialId?: string;
  filial?: Filial;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface UpdateTenantDto {
  tenantName?: string;
  tenantSlug?: string;
}

// Filial Types
export interface Filial {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  timezone: string;
  address?: string;
  phone?: string;
  slug: string;
  createdAt: string;
  settings?: FilialSettings;
}

export interface FilialSettings {
  id: string;
  filialId: string;
  slotGranularity?: number;
}

export interface CreateFilialDto {
  name: string;
  slug: string;
  timezone: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface UpdateFilialDto {
  name?: string;
  slug?: string;
  timezone?: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface UpdateSettingsDto {
  slotGranularity?: number;
}

// Professional Types
export interface Professional {
  id: string;
  tenantId: string;
  filialId: string;
  userId?: string;
  name: string;
  bio?: string;
  specialties?: string;
  isActive: boolean;
  timezone?: string;
  createdAt: string;
  user?: User;
  filial?: Filial;
}

export interface CreateProfessionalDto {
  name: string;
  bio?: string;
  specialties?: string;
  timezone?: string;
}

export interface UpdateProfessionalDto {
  name?: string;
  bio?: string;
  specialties?: string;
  isActive?: boolean;
  timezone?: string;
}

export interface WorkingPeriod {
  id: string;
  professionalId: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  createdAt: string;
}

export interface CreatePeriodDto {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export interface BlockedTime {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export interface CreateBlockDto {
  startsAt: string;
  endsAt: string;
  reason?: string;
}

// Service Types
export interface Service {
  id: string;
  tenantId: string;
  filialId: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  isActive: boolean;
}

export interface CreateServiceDto {
  name: string;
  durationMinutes: number;
  bufferMinutes?: number;
  priceCents: number;
}

export interface UpdateServiceDto {
  name?: string;
  durationMinutes?: number;
  bufferMinutes?: number;
  priceCents?: number;
  isActive?: boolean;
}

// Customer Types
export interface Customer {
  id: string;
  tenantId: string;
  filialId?: string;
  name: string;
  email?: string;
  document?: string;
  documentType?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  document?: string;
  documentType?: string;
  filialId?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  document?: string;
  documentType?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  tenantId: string;
  filialId: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType: CustomerType;
  source: AppointmentSource;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  professional?: Professional;
  customer?: Customer;
  services?: AppointmentService[];
}

export interface AppointmentService {
  id: string;
  serviceId: string;
  service?: Service;
  order?: number;
}

export interface CreateAppointmentDto {
  filialId: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  start: string; // ISO 8601
  professionalId?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
}

export interface CreateInternalAppointmentDto {
  filialId: string;
  date: string; // YYYY-MM-DD
  start: string; // ISO 8601
  serviceIds: string[];
  professionalId?: string;
  customerId?: string;
  newCustomer?: {
    name: string;
    phone?: string;
    email?: string;
    document?: string;
    documentType?: string;
  };
  notes?: string;
}

export interface CreateCustomerAppointmentDto {
  filialId: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  start: string; // ISO 8601
  professionalId?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  professionalId?: string;
  serviceIds?: string[];
  date?: string; // YYYY-MM-DD
  start?: string; // ISO 8601
  customerId?: string;
  newCustomer?: {
    name: string;
    phone?: string;
    email?: string;
    document?: string;
    documentType?: string;
  };
  notes?: string;
}

export interface CancelAppointmentDto {
  reason?: string;
}

// Slots Types
export interface SlotsQuery {
  tenant: string;
  filialId: string;
  date: string;
  serviceIds: string;
  professionalId?: string;
}

export interface Slot {
  start: string; // ISO 8601 string
  end: string; // ISO 8601 string
  professionalOptions: Array<{
    professionalId: string;
    professionalName: string;
  }>;
  recommendedProfessionalId: string;
}

// Metrics Types
export interface MetricsQuery {
  from: string;
  to: string;
}

export interface Metrics {
  summary: MetricsSummary;
  timeseries: TimeseriesData[];
  performance: PerformanceMetrics;
  serviceMix: ServiceMixItem[];
  heatmap: HeatmapData[];
}

export interface MetricsSummary {
  totalAppointments: number;
  confirmedAppointments: number;
  canceledAppointments: number;
  cancelRate: number;
  occupancyRate: number;
  revenue: number;
  bySource?: Record<string, number>;
  byCustomerType?: Record<string, number>;
}

export interface TimeseriesData {
  date: string;
  appointments: number;
  revenue: number;
}

export interface PerformanceMetrics {
  avgDurationMinutes: number;
  avgBufferMinutes: number;
  peakHours: number[];
}

export interface ServiceMixItem {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

export interface HeatmapData {
  weekday: number;
  hour: number;
  count: number;
}

// API Error
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

