/* istanbul ignore file */

import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '~/app.module';
import { parseAuthStrategyConfig } from '~/auth/auth.utils';
import { AuthStrategy } from '~/auth/strategies/strategies.consts';
import { AppErrorToHttpResponseFilter } from '~/common/filters/app-error-to-http-response.filter';
import { LoggingInterceptor } from '~/common/interceptors/logging.interceptor';
import { WebhookResponseCodeInterceptor } from '~/common/interceptors/webhook-response-code.interceptor';
import { swaggerDescription, swaggerTitle } from '~/common/utils';
import { DeveloperTestingService } from '~/developer-testing/developer-testing.service';
import { CoverageInterceptor } from '~/developer-testing/interceptors/coverage.interceptor';
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

// This service was originally designed with node v14, this ensures a backwards compatible run time
const unhandledRejectionLogger = new Logger('UnhandledPromise');
process.on('unhandledRejection', reason => {
  unhandledRejectionLogger.warn(`unhandled rejection, reason: ${reason}`);
});

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

  // Swagger
  const options = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('5.1.0');

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

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(logger),
    new WebhookResponseCodeInterceptor()
  );

  // If developer service is present use an interceptor to track coverage
  const developerService = app.get(DeveloperTestingService);
  if (developerService) {
    developerService.loadSwagger(document);
    app.useGlobalInterceptors(new CoverageInterceptor(developerService));
  }

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppErrorToHttpResponseFilter(httpAdapter));

  // Fetch port from env and listen
  const port = configService.get('PORT', 3000);

  app.enableShutdownHooks();

  await app.listen(port);
}
bootstrap();
