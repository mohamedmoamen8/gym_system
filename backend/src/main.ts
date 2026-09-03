import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { SettingsService } from './settings/settings.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS — allow the Vite dev server and same-origin production
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe — strips unknown fields, returns readable errors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve uploaded photos as static files at /uploads/photos/<filename>
  app.useStaticAssets(join(__dirname, '..', 'storage'), {
    prefix: '/uploads',
  });

  // All API routes live under /api
  app.setGlobalPrefix('api');

  // Seed default gym settings on first run
  const settingsService = app.get(SettingsService);
  await settingsService.seed();

  // Seed default owner account on first run
  const authService = app.get(AuthService);
  await authService.seedDefaultOwner();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🏋️  Gym backend running on http://localhost:${port}/api`);
}
bootstrap();
