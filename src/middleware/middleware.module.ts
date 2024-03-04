/* istanbul ignore file */

import { DynamicModule, forwardRef, Module } from '@nestjs/common';

import { ConfidentialAccountsModule } from '~/confidential-accounts/confidential-accounts.module';
import { ConfidentialAssetsModule } from '~/confidential-assets/confidential-assets.module';
import { ConfidentialAssetsMiddlewareController } from '~/middleware/confidential-assets-middleware/confidential-assets-middleware.controller';

@Module({})
export class MiddlewareModule {
  static register(): DynamicModule {
    const controllers = [];

    const middlewareUrl = process.env.POLYMESH_MIDDLEWARE_V2_URL || '';

    if (middlewareUrl.length) {
      controllers.push(ConfidentialAssetsMiddlewareController);
    }

    return {
      module: MiddlewareModule,
      imports: [
        forwardRef(() => ConfidentialAssetsModule),
        forwardRef(() => ConfidentialAccountsModule),
      ],
      controllers,
      providers: [],
      exports: [],
    };
  }
}
