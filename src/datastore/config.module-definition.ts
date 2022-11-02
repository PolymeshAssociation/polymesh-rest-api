import { ConfigurableModuleBuilder } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataStoreModuleOptions {}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<DataStoreModuleOptions>().build();
