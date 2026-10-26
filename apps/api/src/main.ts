import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp } from './bootstrap';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Detrás del proxy de Vite: usar la IP real del cliente para el rate limit.
  app.set('trust proxy', 'loopback');
  configurarApp(app);
  app.enableShutdownHooks();
  await app.listen(config.port);
  Logger.log(`API escuchando en http://localhost:${config.port}/api`, 'Bootstrap');
}

bootstrap();
