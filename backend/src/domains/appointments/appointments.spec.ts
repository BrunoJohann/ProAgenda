import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { FiliaisService } from '../filiais/filiais.service';
import { SchedulingService } from '../scheduling/scheduling.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    service: {
      findMany: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    blockedTime: {
      findFirst: jest.fn(),
    },
    professionalService: {
      findMany: jest.fn(),
    },
  };

  const mockTenantsService = {
    findBySlug: jest.fn().mockResolvedValue({ id: 'tenant-1', slug: 'test' }),
  };

  const mockFiliaisService = {
    findOne: jest.fn().mockResolvedValue({ id: 'filial-1', name: 'Test Filial' }),
  };

  const mockSchedulingService = {
    getAvailableSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: FiliaisService, useValue: mockFiliaisService },
        { provide: SchedulingService, useValue: mockSchedulingService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create appointment with anti-overbooking', async () => {
      const dto = {
        filialId: 'filial-1',
        serviceIds: ['service-1'],
        date: '2025-11-10',
        start: '2025-11-10T14:00:00Z',
        professionalId: 'prof-1',
        customer: {
          name: 'Test Customer',
          phone: '+5511999999999',
        },
      };

      mockPrismaService.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          durationMinutes: 30,
          bufferMinutes: 5,
        },
      ]);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          professionalService: {
            findMany: jest.fn().mockResolvedValue([{ id: 'ps-1' }]),
          },
          blockedTime: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          appointment: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'appt-1',
              startsAt: new Date(dto.start),
              endsAt: new Date('2025-11-10T14:35:00Z'),
            }),
          },
          appointmentService: {
            create: jest.fn(),
          },
          appointmentStatusHistory: {
            create: jest.fn(),
          },
        });
      });

      const result = await service.create('test', dto);

      expect(result).toHaveProperty('id', 'appt-1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw conflict if slot is taken', async () => {
      const dto = {
        filialId: 'filial-1',
        serviceIds: ['service-1'],
        date: '2025-11-10',
        start: '2025-11-10T14:00:00Z',
        professionalId: 'prof-1',
        customer: {
          name: 'Test Customer',
          phone: '+5511999999999',
        },
      };

      mockPrismaService.service.findMany.mockResolvedValue([
        {
          id: 'service-1',
          durationMinutes: 30,
          bufferMinutes: 5,
        },
      ]);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          professionalService: {
            findMany: jest.fn().mockResolvedValue([{ id: 'ps-1' }]),
          },
          blockedTime: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          appointment: {
            findFirst: jest.fn().mockResolvedValue({ id: 'existing-appt' }),
          },
        });
      });

      await expect(service.create('test', dto)).rejects.toThrow('no longer available');
    });
  });

  describe('cancel', () => {
    it('should cancel appointment and create history', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        id: 'appt-1',
        status: 'CONFIRMED',
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          appointment: {
            update: jest.fn().mockResolvedValue({ id: 'appt-1', status: 'CANCELED' }),
          },
          appointmentStatusHistory: {
            create: jest.fn(),
          },
        });
      });

      const result = await service.cancel('test', 'appt-1', { reason: 'Test' });

      expect(result).toHaveProperty('status', 'CANCELED');
    });

    it('should reject canceling already canceled appointment', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue({
        id: 'appt-1',
        status: 'CANCELED',
      });

      await expect(service.cancel('test', 'appt-1', {})).rejects.toThrow('already canceled');
    });
  });
});

