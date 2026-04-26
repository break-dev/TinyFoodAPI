import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'body-parser';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default bodyParser
  });

  // Enable body-parser with a larger limit for payloads
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  const logger = new Logger(); // logger para el proceso de arranque

  // acceder a las variables de entorno
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3000;

  // CONFIGURACIONES GLOBALES

  // aplicar reglas de DTOS
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // asegurrar que la app no se apague abruptamente
  app.enableShutdownHooks();

  // filtro de excepciones (comentado porque no de importó ni se halló FiltroExcepcion)
  // app.useGlobalFilters(new FiltroExcepcion());

  // cors
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(PORT, '0.0.0.0');
  logger.log(
    `Aplicación corriendo en http://${configService.get('HOST') || '0.0.0.0'}:${PORT}/api`,
  );
}

void bootstrap();
