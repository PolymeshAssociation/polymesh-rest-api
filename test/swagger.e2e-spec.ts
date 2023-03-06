import { HttpModule } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';

describe('Swagger E2E Spec', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // This is to avoid jest sometimes tearing down too slowly and issuing a warning
    await new Promise(resolve => setTimeout(resolve, 5000));
    await app.close();
  });

  it('should generate swagger spec', async () => {
    const config = new DocumentBuilder()
      .setTitle('Polymesh REST API')
      .setDescription('RESTful access to the Polymesh blockchain')
      .setVersion('1.0');

    const document = SwaggerModule.createDocument(app, config.build());
    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  });
});
