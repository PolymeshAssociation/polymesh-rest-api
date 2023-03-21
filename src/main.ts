/* istanbul ignore file */

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '~/app.module';
import { parseAuthStrategyConfig } from '~/auth/auth.utils';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';
import { AppErrorToHttpResponseFilter } from '~/common/filters/app-error-to-http-response.filter';
import { LoggingInterceptor } from '~/common/interceptors/logging.interceptor';
import { WebhookResponseCodeInterceptor } from '~/common/interceptors/webhook-response-code.interceptor';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

async function bootstrap(): Promise<void> {
  // App setup
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    })
  );
  const logger = new PolymeshLogger();
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(logger),
    new WebhookResponseCodeInterceptor()
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppErrorToHttpResponseFilter(httpAdapter));

  // Swagger
  const options = new DocumentBuilder()
    .setTitle('Polymesh REST API')
    .setDescription('RESTful access to the Polymesh blockchain')
    .setVersion('2.5.0-alpha.3.16');

  const configService = app.get<ConfigService>(ConfigService);

  const authStrategiesFromEnv = configService.getOrThrow('AUTH_STRATEGY');
  const authStrategies = parseAuthStrategyConfig(authStrategiesFromEnv);

  const isApiKeyStrategyConfigured = authStrategies.includes(AuthStrategy.ApiKey);
  if (isApiKeyStrategyConfigured) {
    options.addApiKey({
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
    });
  }

  const document = SwaggerModule.createDocument(app, options.build());
  if (isApiKeyStrategyConfigured) {
    document.security = [{ api_key: [] }]; // Apply the API key globally to all operations
  }
  SwaggerModule.setup('/', app, document);

  // Fetch port from env and listen
  const port = configService.get('PORT', 3000);
  await app.listen(port);
}
bootstrap();
