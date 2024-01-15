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
import { PolymeshLogger } from '~/logger/polymesh-logger.service';

// This service was originally designed with node v14, this ensures a backwards compatible run time
// Ideally we wouldn't need this function, but I am unable to find the cause when submitting SDK transactions that fail validation
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
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(logger),
    new WebhookResponseCodeInterceptor()
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppErrorToHttpResponseFilter(httpAdapter));

  // Swagger
  const options = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion('5.0.0-alpha.4');

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

  app.enableShutdownHooks();

  await app.listen(port);
}
bootstrap();
