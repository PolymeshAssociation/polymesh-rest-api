/* istanbul ignore file */

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  // App setup
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger
  const options = new DocumentBuilder()
    .setTitle('Polymesh REST API')
    .setDescription('RESTful access to the Polymesh blockchain')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/', app, document);

  // Fetch port from env and listen
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get('PORT', 3000);
  await app.listen(port);
}
bootstrap();
