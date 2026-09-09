import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { startTelemetry } from '@vexa/core';
import { AppModule } from './app/app.module';

startTelemetry({ serviceName: 'vexa-matching', prometheusPort: 9466 });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableShutdownHooks();
  const port = config.get<number>('PORT', 3002);
  await app.listen(port);
  Logger.log(`Matching service on http://localhost:${port}`);
}

bootstrap();
