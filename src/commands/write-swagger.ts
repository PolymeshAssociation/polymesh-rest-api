import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

import { AppModule } from '~/app.module';
import { swaggerDescription, swaggerTitle } from '~/common/utils';

const writeSwaggerSpec = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('1.0');

  const document = SwaggerModule.createDocument(app, config.build());
  writeFileSync('./polymesh-rest-api-swagger-spec.json', JSON.stringify(document));
  process.exit();
};
writeSwaggerSpec();
