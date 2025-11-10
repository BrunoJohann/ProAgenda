import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    filial: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    professional: {
      count: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySlug', () => {
    it('should return tenant when found', async () => {
      const mockTenant = { id: 'tenant-1', slug: 'acme', name: 'Acme Corp', createdAt: new Date() };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('acme');

      expect(result).toEqual(mockTenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' },
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenant', () => {
    const mockTenant = { 
      id: 'tenant-1', 
      slug: 'acme', 
      name: 'Acme Corp', 
      createdAt: new Date() 
    };

    it('should update tenant name successfully', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        name: 'Acme Corporation',
      });

      const result = await service.updateTenant('acme', { tenantName: 'Acme Corporation' });

      expect(result.name).toBe('Acme Corporation');
      expect(result.message).toBe('Tenant updated successfully');
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { name: 'Acme Corporation' },
      });
    });

    it('should update tenant slug successfully', async () => {
      mockPrismaService.tenant.findUnique
        .mockResolvedValueOnce(mockTenant) // findBySlug
        .mockResolvedValueOnce(null); // check for existing slug

      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        slug: 'acme-corp',
      });

      const result = await service.updateTenant('acme', { tenantSlug: 'acme-corp' });

      expect(result.slug).toBe('acme-corp');
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should throw ConflictException when new slug already exists', async () => {
      const existingTenant = { id: 'tenant-2', slug: 'existing', name: 'Existing', createdAt: new Date() };
      
      mockPrismaService.tenant.findUnique
        .mockResolvedValueOnce(mockTenant) // findBySlug
        .mockResolvedValueOnce(existingTenant); // check for existing slug

      await expect(service.updateTenant('acme', { tenantSlug: 'existing' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update both name and slug', async () => {
      mockPrismaService.tenant.findUnique
        .mockResolvedValueOnce(mockTenant) // findBySlug
        .mockResolvedValueOnce(null); // check for existing slug

      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        name: 'Acme Corporation',
        slug: 'acme-corp',
      });

      const result = await service.updateTenant('acme', {
        tenantName: 'Acme Corporation',
        tenantSlug: 'acme-corp',
      });

      expect(result.name).toBe('Acme Corporation');
      expect(result.slug).toBe('acme-corp');
    });

    it('should not check slug uniqueness if slug is not changing', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        name: 'Acme Corporation',
      });

      await service.updateTenant('acme', { tenantName: 'Acme Corporation', tenantSlug: 'acme' });

      // Should only call findUnique once (for findBySlug), not for checking slug
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTenantInfo', () => {
    it('should return tenant with stats', async () => {
      const mockTenant = { id: 'tenant-1', slug: 'acme', name: 'Acme Corp', createdAt: new Date() };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.$transaction.mockResolvedValue([5, 10, 8, 100]);

      const result = await service.getTenantInfo('acme');

      expect(result).toEqual({
        ...mockTenant,
        stats: {
          filiais: 5,
          users: 10,
          professionals: 8,
          appointments: 100,
        },
      });
    });
  });
});

