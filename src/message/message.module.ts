/* istanbul ignore file */

import { DynamicModule, Module } from '@nestjs/common';

import { ArtemisModule } from '~/message/artemis/artemis.module';
import { readArtemisFromEnv } from '~/message/artemis/utils';
import { LocalMessageModule } from '~/message/local/local-message.module';

/**
 * responsible for selecting a module to manage messages
 *
 * @note defaults to LocalMessageModule
 */
@Module({})
export class MessageModule {
  public static registerAsync(): DynamicModule {
    const artemisConfig = readArtemisFromEnv();

    if (artemisConfig.configured) {
      return {
        providers: [{ provide: 'ARTEMIS_CONFIG', useValue: artemisConfig }],
        module: ArtemisModule,
        exports: [ArtemisModule],
      };
    } else {
      return {
        module: LocalMessageModule,
        exports: [LocalMessageModule],
      };
    }
  }
}
