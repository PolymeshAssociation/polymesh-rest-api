/* istanbul ignore file */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

import polymeshConfig from './config/polymesh.config';
import { POLYMESH_API } from './polymesh.consts';
import { PolymeshService } from './polymesh.service';

@Module({
  imports: [ConfigModule.forFeature(polymeshConfig)],
  providers: [
    PolymeshService,
    {
      provide: POLYMESH_API,
      useFactory: async (configuration: ConfigType<typeof polymeshConfig>): Promise<Polymesh> => {
        return Polymesh.connect(configuration);
      },
      inject: [polymeshConfig.KEY],
    },
  ],
  exports: [PolymeshService],
})
export class PolymeshModule {}
