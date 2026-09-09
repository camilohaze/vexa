import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.getOrThrow<string>('DATABASE_URL'),
    ssl: config.get<boolean>('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: config.get<boolean>('DATABASE_SYNCHRONIZE', false),
    // Las migraciones SQL viven en db/migrations (webpack empaqueta a un solo archivo,
    // por lo que no se pueden usar migraciones TypeORM de archivos). Aplicar con psql.
    logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn', 'schema'] : ['error'],
  };
}
