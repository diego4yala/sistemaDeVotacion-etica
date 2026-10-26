import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

describe('Rate limit del login (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Antes de cargar la app (la configuración se lee al importar): límite real de 5 intentos.
    process.env.LOGIN_INTENTOS_POR_MINUTO = '5';
    const { crearApp, escenarioBase } = await import('./utils');
    prisma = new PrismaClient();
    await escenarioBase(prisma);
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('permite 5 intentos por minuto por IP y código, y bloquea el sexto', async () => {
    const servidor = app.getHttpServer();
    const estados: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await request(servidor).post('/api/auth/login').send({ codigo: '20000003', password: 'mala-clave' });
      estados.push(r.status);
    }
    expect(estados).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it('el contador es por código: otro código desde la misma IP no está bloqueado', async () => {
    const r = await request(app.getHttpServer()).post('/api/auth/login').send({ codigo: '20000001', password: 'mala-clave' });
    expect(r.status).toBe(401);
  });
});
