import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '@prisma/client';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/signup', () => {
    it('should create a new tenant and owner user', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send({
          tenantName: 'Test Corp',
          tenantSlug: 'test-corp-e2e',
          name: 'Test Owner',
          email: 'owner-e2e@test.com',
          password: 'TestPass123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('email', 'owner-e2e@test.com');
          expect(res.body.user).toHaveProperty('tenant', 'test-corp-e2e');
        });
    });

    it('should reject duplicate tenant slug', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send({
          tenantName: 'Test Corp 2',
          tenantSlug: 'test-corp-e2e',
          name: 'Test Owner 2',
          email: 'owner2-e2e@test.com',
          password: 'TestPass123!',
        })
        .expect(409);
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'owner-e2e@test.com',
          password: 'TestPass123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'owner-e2e@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return current user with roles', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'owner-e2e@test.com');
          expect(res.body.roleAssignments).toBeInstanceOf(Array);
          expect(res.body.roleAssignments[0]).toHaveProperty('role', Role.OWNER);
        });
    });

    it('should reject without token', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .expect(401);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.accessToken).not.toBe(accessToken);
      expect(res.body.refreshToken).not.toBe(refreshToken);

      // Update tokens for logout test
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout and revoke session', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(201);
    });

    it('should reject revoked refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });
});

