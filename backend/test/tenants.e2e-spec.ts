import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tenants (e2e)', () => {
  let app: INestApplication;
  let ownerAccessToken: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Create a test tenant and get owner token
    const signupResponse = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({
        tenantName: 'Test Tenant Update',
        tenantSlug: 'test-tenant-update',
        name: 'Test Owner',
        email: 'owner-tenant-test@test.com',
        password: 'TestPass123!',
      });

    ownerAccessToken = signupResponse.body.accessToken;

    // Create an admin user for testing permissions
    await request(app.getHttpServer())
      .post('/v1/admin/users')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        name: 'Admin User',
        email: 'admin-tenant-test@test.com',
        password: 'AdminPass123!',
      });

    // Login as admin to get token
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'admin-tenant-test@test.com',
        password: 'AdminPass123!',
      });

    adminAccessToken = adminLoginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/admin/tenants/me', () => {
    it('should return tenant information for owner', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Tenant Update');
          expect(res.body).toHaveProperty('slug', 'test-tenant-update');
          expect(res.body).toHaveProperty('stats');
          expect(res.body.stats).toHaveProperty('filiais');
          expect(res.body.stats).toHaveProperty('users');
        });
    });

    it('should reject without authentication', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/tenants/me')
        .expect(401);
    });
  });

  describe('PATCH /v1/admin/tenants/me', () => {
    it('should update tenant name as owner', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          tenantName: 'Updated Tenant Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated Tenant Name');
          expect(res.body).toHaveProperty('slug', 'test-tenant-update');
          expect(res.body).toHaveProperty('message', 'Tenant updated successfully');
        });
    });

    it('should update tenant slug as owner', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          tenantSlug: 'test-tenant-updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'test-tenant-updated');
          expect(res.body).toHaveProperty('message', 'Tenant updated successfully');
        });
    });

    it('should update both name and slug', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          tenantName: 'Final Tenant Name',
          tenantSlug: 'final-tenant-slug',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Final Tenant Name');
          expect(res.body).toHaveProperty('slug', 'final-tenant-slug');
        });
    });

    it('should reject invalid slug format', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          tenantSlug: 'Invalid Slug With Spaces',
        })
        .expect(400);
    });

    it('should reject slug with uppercase letters', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${ownerAccessToken}`)
        .send({
          tenantSlug: 'InvalidSlug',
        })
        .expect(400);
    });

    it('should reject admin trying to update tenant (only owner allowed)', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          tenantName: 'Should Not Work',
        })
        .expect(403);
    });

    it('should reject without authentication', () => {
      return request(app.getHttpServer())
        .patch('/v1/admin/tenants/me')
        .send({
          tenantName: 'Should Not Work',
        })
        .expect(401);
    });
  });
});

