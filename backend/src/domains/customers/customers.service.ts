import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PhoneType } from '@prisma/client';

/**
 * Normalize phone number to E.164 format (simplified)
 * In production, use a library like libphonenumber-js
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with country code, return with +
  if (digits.length >= 10) {
    return `+${digits}`;
  }
  
  return phone; // Return as-is if can't normalize
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create customer from internal request (admin/operator creating appointment)
   */
  async findOrCreateFromInternal(
    tenantId: string,
    data: {
      name: string;
      phone?: string;
      email?: string;
      document?: string;
      documentType?: string;
      filialId?: string;
    },
  ): Promise<{ customer: any | null; customerType: 'REGISTERED' | 'IDENTIFIED_NO_LOGIN' | 'WALKIN_NAME_ONLY' }> {
    // If no identifying data, return null (will create WALKIN_NAME_ONLY appointment)
    if (!data.phone && !data.email && !data.document) {
      return { customer: null, customerType: 'WALKIN_NAME_ONLY' };
    }

    // Try to find existing customer
    let customer: any = null;

    // Priority 1: Search by document
    if (data.document) {
      customer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          document: data.document,
        },
        include: {
          phones: true,
        },
      });
    }

    // Priority 2: Search by email
    if (!customer && data.email) {
      customer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          email: data.email,
        },
        include: {
          phones: true,
        },
      });
    }

    // Priority 3: Search by phone
    if (!customer && data.phone) {
      const normalizedPhone = normalizePhone(data.phone);
      const phoneRecord = await this.prisma.customerPhone.findFirst({
        where: {
          phone: normalizedPhone,
        },
        include: {
          customer: {
            include: {
              phones: true,
            },
          },
        },
      });

      if (phoneRecord && phoneRecord.customer.tenantId === tenantId) {
        customer = phoneRecord.customer;
      }
    }

    // If found, return existing customer
    if (customer) {
      const customerType = customer.userId ? 'REGISTERED' : 'IDENTIFIED_NO_LOGIN';
      return { customer, customerType };
    }

    // Create new customer
    customer = await this.prisma.customer.create({
      data: {
        tenantId,
        filialId: data.filialId,
        name: data.name,
        email: data.email,
        document: data.document,
        documentType: data.documentType,
      },
      include: {
        phones: true,
      },
    });

    // Add phone if provided
    if (data.phone) {
      await this.prisma.customerPhone.create({
        data: {
          customerId: customer.id,
          phone: normalizePhone(data.phone),
          type: PhoneType.MOBILE,
          isPrimary: true,
        },
      });

      // Re-fetch to include phone
      const refetched = await this.prisma.customer.findUnique({
        where: { id: customer.id },
        include: { phones: true },
      });
      if (refetched) {
        customer = refetched;
      }
    }

    return { customer, customerType: 'IDENTIFIED_NO_LOGIN' };
  }

  /**
   * Find or create customer from WhatsApp integration
   */
  async findOrCreateFromWhatsapp(
    tenantId: string,
    whatsappNumber: string,
    name?: string,
  ): Promise<{ customer: any; customerType: 'REGISTERED' | 'IDENTIFIED_NO_LOGIN' }> {
    const normalizedPhone = normalizePhone(whatsappNumber);

    // Try to find by phone
    const phoneRecord = await this.prisma.customerPhone.findFirst({
      where: {
        phone: normalizedPhone,
      },
      include: {
        customer: {
          include: {
            phones: true,
          },
        },
      },
    });

    if (phoneRecord && phoneRecord.customer.tenantId === tenantId) {
      const customerType = phoneRecord.customer.userId ? 'REGISTERED' : 'IDENTIFIED_NO_LOGIN';
      return { customer: phoneRecord.customer, customerType };
    }

    // Create new customer
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        name: name || `Cliente WhatsApp ${normalizedPhone.slice(-4)}`,
      },
      include: {
        phones: true,
      },
    });

    // Add WhatsApp phone
    await this.prisma.customerPhone.create({
      data: {
        customerId: customer.id,
        phone: normalizedPhone,
        type: PhoneType.WHATSAPP,
        isPrimary: true,
      },
    });

    // Re-fetch to include phone
    const updatedCustomer = await this.prisma.customer.findUnique({
      where: { id: customer.id },
      include: { phones: true },
    });

    return { customer: updatedCustomer, customerType: 'IDENTIFIED_NO_LOGIN' };
  }

  /**
   * Create a new customer (admin endpoint)
   */
  async create(tenantId: string, dto: CreateCustomerDto) {
    // Check if document already exists
    if (dto.document) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          document: dto.document,
        },
      });

      if (existing) {
        throw new ConflictException('Customer with this document already exists');
      }
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        filialId: dto.filialId,
        name: dto.name,
        email: dto.email,
        document: dto.document,
        documentType: dto.documentType,
      },
      include: {
        phones: true,
      },
    });

    // Add phones if provided
    if (dto.phones && dto.phones.length > 0) {
      await this.prisma.customerPhone.createMany({
        data: dto.phones.map((phone) => ({
          customerId: customer.id,
          phone: normalizePhone(phone.phone),
          type: phone.type,
          isPrimary: phone.isPrimary ?? false,
        })),
      });

      // Re-fetch to include phones
      return this.prisma.customer.findUnique({
        where: { id: customer.id },
        include: { phones: true },
      });
    }

    return customer;
  }

  /**
   * Find all customers in tenant
   */
  async findAll(tenantId: string, filialId?: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        ...(filialId && { filialId }),
      },
      include: {
        phones: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find one customer
   */
  async findOne(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
      include: {
        phones: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointments: {
          include: {
            professional: {
              select: { id: true, name: true },
            },
            filial: {
              select: { id: true, name: true },
            },
          },
          orderBy: {
            startsAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Find customer by phone
   */
  async findByPhone(phone: string) {
    const normalizedPhone = normalizePhone(phone);
    
    const phoneRecord = await this.prisma.customerPhone.findFirst({
      where: {
        phone: normalizedPhone,
      },
      include: {
        customer: {
          include: {
            phones: true,
          },
        },
      },
    });

    return phoneRecord?.customer || null;
  }

  /**
   * Find customer by document
   */
  async findByDocument(tenantId: string, document: string) {
    return this.prisma.customer.findFirst({
      where: {
        tenantId,
        document,
      },
      include: {
        phones: true,
      },
    });
  }

  /**
   * Find customer by email
   */
  async findByEmail(tenantId: string, email: string) {
    return this.prisma.customer.findFirst({
      where: {
        tenantId,
        email,
      },
      include: {
        phones: true,
      },
    });
  }

  /**
   * Update customer
   */
  async update(tenantId: string, customerId: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(tenantId, customerId);

    // Check if new document conflicts
    if (dto.document && dto.document !== customer.document) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          document: dto.document,
          id: { not: customerId },
        },
      });

      if (existing) {
        throw new ConflictException('Customer with this document already exists');
      }
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        name: dto.name,
        email: dto.email,
        document: dto.document,
        documentType: dto.documentType,
        filialId: dto.filialId,
      },
      include: {
        phones: true,
      },
    });
  }

  /**
   * Add phone to customer
   */
  async addPhone(
    customerId: string,
    phone: string,
    type: PhoneType,
    isPrimary = false,
  ) {
    const normalizedPhone = normalizePhone(phone);

    // If setting as primary, unset other primary phones
    if (isPrimary) {
      await this.prisma.customerPhone.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerPhone.create({
      data: {
        customerId,
        phone: normalizedPhone,
        type,
        isPrimary,
      },
    });
  }

  /**
   * Delete customer (only if no appointments)
   */
  async delete(tenantId: string, customerId: string) {
    const customer = await this.findOne(tenantId, customerId);

    if (customer.appointments && customer.appointments.length > 0) {
      throw new ConflictException('Cannot delete customer with appointments');
    }

    // Delete phones first
    await this.prisma.customerPhone.deleteMany({
      where: { customerId },
    });

    // Delete customer
    await this.prisma.customer.delete({
      where: { id: customerId },
    });

    return { message: 'Customer deleted successfully' };
  }
}
