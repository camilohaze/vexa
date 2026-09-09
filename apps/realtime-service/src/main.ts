import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { startTelemetry } from '@vexa/core';
import { AppModule } from './app/app.module';

startTelemetry({ serviceName: 'vexa-realtime', prometheusPort: 9465 });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', '').split(',').filter(Boolean),
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  Logger.log(`Realtime service on http://localhost:${port} (ws namespace /realtime)`);
}

bootstrap();
