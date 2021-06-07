import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { POLYMESH_API } from './polymesh.consts';
import polymeshConfig from './config/polymesh.config';
import { PolymeshService } from './polymesh.service';
import { Polymesh } from '@polymathnetwork/polymesh-sdk';

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
