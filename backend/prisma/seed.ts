import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme',
    },
  });
  console.log('✅ Created tenant: acme');

  // Create filiais
  const centro = await prisma.filial.create({
    data: {
      tenantId: tenant.id,
      name: 'Centro',
      slug: 'centro',
      timezone: 'America/Sao_Paulo',
      address: 'Rua das Flores, 123 - Centro',
      phone: '+5511999990001',
    },
  });

  const moinhos = await prisma.filial.create({
    data: {
      tenantId: tenant.id,
      name: 'Moinhos',
      slug: 'moinhos',
      timezone: 'America/Sao_Paulo',
      address: 'Av. dos Moinhos, 456',
      phone: '+5511999990002',
    },
  });

  // Create filial settings
  await prisma.filialSettings.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      slotGranularity: 15,
    },
  });

  await prisma.filialSettings.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      slotGranularity: null, // Uses .env default
    },
  });
  console.log('✅ Created filiais with settings');

  // Create users
  const ownerPassword = await argon2.hash('owner123');
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Owner User',
      email: 'owner@acme.com',
      passwordHash: ownerPassword,
      isEmailVerified: true,
    },
  });

  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Admin User',
      email: 'admin@acme.com',
      passwordHash: adminPassword,
      isEmailVerified: true,
    },
  });

  const managerPassword = await argon2.hash('manager123');
  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Manager User',
      email: 'manager@acme.com',
      passwordHash: managerPassword,
      isEmailVerified: true,
    },
  });

  const operatorPassword = await argon2.hash('operator123');
  const operator = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Operator User',
      email: 'operator@acme.com',
      passwordHash: operatorPassword,
      isEmailVerified: true,
    },
  });

  const profUserPassword = await argon2.hash('prof123');
  const profUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'João Silva',
      email: 'joao@acme.com',
      passwordHash: profUserPassword,
      isEmailVerified: true,
    },
  });

  // Create customer user (with login)
  const customerPassword = await argon2.hash('customer123');
  const customerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Roberto Cliente',
      email: 'roberto@example.com',
      passwordHash: customerPassword,
      isEmailVerified: true,
    },
  });

  console.log('✅ Created users');

  // Create role assignments
  await prisma.roleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: owner.id,
      role: Role.OWNER,
    },
  });

  await prisma.roleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      role: Role.ADMIN,
    },
  });

  await prisma.roleAssignment.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: manager.id,
        role: Role.MANAGER,
        filialId: centro.id,
      },
      {
        tenantId: tenant.id,
        userId: manager.id,
        role: Role.MANAGER,
        filialId: moinhos.id,
      },
    ],
  });

  await prisma.roleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: operator.id,
      role: Role.OPERATOR,
      filialId: centro.id,
    },
  });

  // Assign customer role
  await prisma.roleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: customerUser.id,
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Created role assignments');

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      userId: customerUser.id, // Customer with login (REGISTERED)
      name: 'Roberto Cliente',
      email: 'roberto@example.com',
      document: '12345678900',
      documentType: 'CPF',
    },
  });

  // Add phones for customer1
  await prisma.customerPhone.createMany({
    data: [
      {
        customerId: customer1.id,
        phone: '+5511999998888',
        type: 'WHATSAPP',
        isPrimary: true,
      },
      {
        customerId: customer1.id,
        phone: '+5511988887777',
        type: 'MOBILE',
        isPrimary: false,
      },
    ],
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      name: 'Maria Oliveira',
      email: 'maria.oliveira@example.com',
      document: '98765432100',
      documentType: 'CPF',
    },
  });

  await prisma.customerPhone.create({
    data: {
      customerId: customer2.id,
      phone: '+5511977776666',
      type: 'WHATSAPP',
      isPrimary: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Carlos Souza',
      email: 'carlos@example.com',
    },
  });

  await prisma.customerPhone.create({
    data: {
      customerId: customer3.id,
      phone: '+5511988887777',
      type: 'MOBILE',
      isPrimary: true,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      name: 'Ana Paula Ferreira',
      email: 'ana.paula@example.com',
    },
  });

  await prisma.customerPhone.createMany({
    data: [
      {
        customerId: customer4.id,
        phone: '+5511966665555',
        type: 'WHATSAPP',
        isPrimary: true,
      },
      {
        customerId: customer4.id,
        phone: '+5511944443333',
        type: 'HOME',
        isPrimary: false,
      },
    ],
  });

  const customer5 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Paulo Mendes',
    },
  });

  await prisma.customerPhone.create({
    data: {
      customerId: customer5.id,
      phone: '+5511955554444',
      type: 'WHATSAPP',
      isPrimary: true,
    },
  });

  console.log('✅ Created customers and phones');

  // Create professionals
  const prof1Centro = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      userId: profUser.id,
      name: 'João Silva',
      bio: 'Barbeiro experiente com 10+ anos',
      specialties: 'Corte, Barba, Design',
      timezone: 'America/Sao_Paulo',
      isActive: true,
    },
  });

  const prof2Centro = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      name: 'Maria Santos',
      bio: 'Especialista em cortes modernos',
      specialties: 'Corte, Coloração',
      timezone: 'America/Sao_Paulo',
      isActive: true,
    },
  });

  const prof1Moinhos = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      name: 'Pedro Costa',
      bio: 'Barbeiro clássico',
      specialties: 'Corte, Barba',
      timezone: 'America/Sao_Paulo',
      isActive: true,
    },
  });

  const prof2Moinhos = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      name: 'Ana Lima',
      bio: 'Estilista profissional',
      specialties: 'Corte, Penteado',
      timezone: 'America/Sao_Paulo',
      isActive: true,
    },
  });

  console.log('✅ Created professionals');

  // Assign role to professional user
  await prisma.roleAssignment.create({
    data: {
      tenantId: tenant.id,
      userId: profUser.id,
      role: Role.PROFESSIONAL,
      filialId: centro.id,
    },
  });

  // Create working periods (Mon-Sat, 9-12 and 14-18)
  const professionals = [prof1Centro, prof2Centro, prof1Moinhos, prof2Moinhos];
  for (const prof of professionals) {
    for (let weekday = 1; weekday <= 6; weekday++) {
      await prisma.workingPeriod.createMany({
        data: [
          {
            tenantId: tenant.id,
            professionalId: prof.id,
            weekday,
            startMinutes: 9 * 60, // 9:00
            endMinutes: 12 * 60, // 12:00
          },
          {
            tenantId: tenant.id,
            professionalId: prof.id,
            weekday,
            startMinutes: 14 * 60, // 14:00
            endMinutes: 18 * 60, // 18:00
          },
        ],
      });
    }
  }
  console.log('✅ Created working periods');

  // Create services
  const corteCentro = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      name: 'Corte de Cabelo',
      durationMinutes: 30,
      bufferMinutes: 5,
      priceCents: 5000,
      isActive: true,
    },
  });

  const barbaCentro = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      name: 'Barba',
      durationMinutes: 25,
      bufferMinutes: 5,
      priceCents: 3500,
      isActive: true,
    },
  });

  const sobrancelhaCentro = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      name: 'Sobrancelha',
      durationMinutes: 15,
      bufferMinutes: 0,
      priceCents: 2000,
      isActive: true,
    },
  });

  const corteMoinhos = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      name: 'Corte de Cabelo',
      durationMinutes: 30,
      bufferMinutes: 5,
      priceCents: 5500,
      isActive: true,
    },
  });

  const barbaMoinhos = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      name: 'Barba',
      durationMinutes: 25,
      bufferMinutes: 5,
      priceCents: 4000,
      isActive: true,
    },
  });

  console.log('✅ Created services');

  // Link services to professionals
  await prisma.professionalService.createMany({
    data: [
      // Centro
      { tenantId: tenant.id, professionalId: prof1Centro.id, serviceId: corteCentro.id },
      { tenantId: tenant.id, professionalId: prof1Centro.id, serviceId: barbaCentro.id },
      { tenantId: tenant.id, professionalId: prof1Centro.id, serviceId: sobrancelhaCentro.id },
      { tenantId: tenant.id, professionalId: prof2Centro.id, serviceId: corteCentro.id },
      { tenantId: tenant.id, professionalId: prof2Centro.id, serviceId: sobrancelhaCentro.id },
      // Moinhos
      { tenantId: tenant.id, professionalId: prof1Moinhos.id, serviceId: corteMoinhos.id },
      { tenantId: tenant.id, professionalId: prof1Moinhos.id, serviceId: barbaMoinhos.id },
      { tenantId: tenant.id, professionalId: prof2Moinhos.id, serviceId: corteMoinhos.id },
    ],
  });
  console.log('✅ Linked services to professionals');

  // Create some blocks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(13, 0, 0, 0);

  await prisma.blockedTime.create({
    data: {
      tenantId: tenant.id,
      professionalId: prof1Centro.id,
      startsAt: tomorrow,
      endsAt: tomorrowEnd,
      reason: 'Lunch break',
    },
  });
  console.log('✅ Created blocks');

  // Create some appointments
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const appt1End = new Date(nextWeek);
  appt1End.setMinutes(appt1End.getMinutes() + 35); // 30 + 5 buffer

  const appt1 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      professionalId: prof1Centro.id,
      startsAt: nextWeek,
      endsAt: appt1End,
      customerId: customer3.id,
      customerName: 'Carlos Souza',
      customerPhone: '+5511988887777',
      customerEmail: 'carlos@example.com',
      customerType: 'IDENTIFIED_NO_LOGIN',
      source: 'INTERNAL',
      status: 'CONFIRMED',
      notes: 'Cliente regular',
    },
  });

  await prisma.appointmentService.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt1.id,
      serviceId: corteCentro.id,
      order: 0,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt1.id,
      toStatus: 'CONFIRMED',
      reason: 'Appointment created',
    },
  });

  // Create a canceled appointment
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(15, 0, 0, 0);

  const appt2End = new Date(yesterday);
  appt2End.setMinutes(appt2End.getMinutes() + 30);

  const appt2 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      professionalId: prof2Centro.id,
      startsAt: yesterday,
      endsAt: appt2End,
      customerId: customer2.id,
      customerName: 'Maria Oliveira',
      customerPhone: '+5511977776666',
      customerEmail: 'maria.oliveira@example.com',
      customerType: 'IDENTIFIED_NO_LOGIN',
      source: 'CUSTOMER_PORTAL',
      status: 'CANCELED',
    },
  });

  await prisma.appointmentService.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt2.id,
      serviceId: corteCentro.id,
      order: 0,
    },
  });

  await prisma.appointmentStatusHistory.createMany({
    data: [
      {
        tenantId: tenant.id,
        appointmentId: appt2.id,
        toStatus: 'CONFIRMED',
        reason: 'Appointment created',
      },
      {
        tenantId: tenant.id,
        appointmentId: appt2.id,
        fromStatus: 'CONFIRMED',
        toStatus: 'CANCELED',
        reason: 'Customer canceled',
      },
    ],
  });

  // Create appointment from customer portal (registered customer)
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  nextMonth.setHours(14, 30, 0, 0);

  const appt3End = new Date(nextMonth);
  appt3End.setMinutes(appt3End.getMinutes() + 60); // 30 + 25 + 5

  const appt3 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      professionalId: prof1Centro.id,
      startsAt: nextMonth,
      endsAt: appt3End,
      customerId: customer1.id,
      customerName: 'Roberto Cliente',
      customerPhone: '+5511999998888',
      customerEmail: 'roberto@example.com',
      customerType: 'REGISTERED',
      source: 'CUSTOMER_PORTAL',
      status: 'CONFIRMED',
    },
  });

  await prisma.appointmentService.createMany({
    data: [
      {
        tenantId: tenant.id,
        appointmentId: appt3.id,
        serviceId: corteCentro.id,
        order: 0,
      },
      {
        tenantId: tenant.id,
        appointmentId: appt3.id,
        serviceId: barbaCentro.id,
        order: 1,
      },
    ],
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt3.id,
      toStatus: 'CONFIRMED',
      reason: 'Appointment created via customer portal',
    },
  });

  // Create appointment from WhatsApp
  const nextWeek2 = new Date();
  nextWeek2.setDate(nextWeek2.getDate() + 8);
  nextWeek2.setHours(16, 0, 0, 0);

  const appt4End = new Date(nextWeek2);
  appt4End.setMinutes(appt4End.getMinutes() + 30);

  const appt4 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      filialId: moinhos.id,
      professionalId: prof1Moinhos.id,
      startsAt: nextWeek2,
      endsAt: appt4End,
      customerId: customer5.id,
      customerName: 'Paulo Mendes',
      customerPhone: '+5511955554444',
      customerType: 'IDENTIFIED_NO_LOGIN',
      source: 'WHATSAPP',
      status: 'CONFIRMED',
      notes: 'Agendamento via WhatsApp',
    },
  });

  await prisma.appointmentService.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt4.id,
      serviceId: corteMoinhos.id,
      order: 0,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt4.id,
      toStatus: 'CONFIRMED',
      reason: 'Appointment created via WhatsApp',
    },
  });

  // Create walk-in appointment (no customer record)
  const today = new Date();
  today.setHours(11, 0, 0, 0);

  const appt5End = new Date(today);
  appt5End.setMinutes(appt5End.getMinutes() + 20);

  const appt5 = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      filialId: centro.id,
      professionalId: prof2Centro.id,
      startsAt: today,
      endsAt: appt5End,
      customerName: 'Walk-in Cliente',
      customerType: 'WALKIN_NAME_ONLY',
      source: 'INTERNAL',
      status: 'CONFIRMED',
    },
  });

  await prisma.appointmentService.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt5.id,
      serviceId: sobrancelhaCentro.id,
      order: 0,
    },
  });

  await prisma.appointmentStatusHistory.create({
    data: {
      tenantId: tenant.id,
      appointmentId: appt5.id,
      toStatus: 'CONFIRMED',
      reason: 'Walk-in appointment',
    },
  });

  console.log('✅ Created appointments');

  // Create a pending invitation
  const inviteToken = 'sample-token-hash';
  const inviteExpiry = new Date();
  inviteExpiry.setDate(inviteExpiry.getDate() + 3);

  await prisma.invitation.create({
    data: {
      tenantId: tenant.id,
      professionalId: prof2Moinhos.id,
      filialId: moinhos.id,
      email: 'ana.lima@example.com',
      tokenHash: inviteToken,
      status: 'PENDING',
      expiresAt: inviteExpiry,
    },
  });
  console.log('✅ Created invitation');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Test credentials:');
  console.log('   Owner:        owner@acme.com / owner123');
  console.log('   Admin:        admin@acme.com / admin123');
  console.log('   Manager:      manager@acme.com / manager123');
  console.log('   Operator:     operator@acme.com / operator123');
  console.log('   Professional: joao@acme.com / prof123');
  console.log('   Customer:     roberto@example.com / customer123');
  console.log('\n🏢 Tenant: acme');
  console.log('🏪 Filiais: centro, moinhos');
  console.log('👥 Customers: 5 customers with various phone types');
  console.log('📅 Appointments: 5 appointments (INTERNAL, CUSTOMER_PORTAL, WHATSAPP sources)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

