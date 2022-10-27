import { Module } from '@nestjs/common';

import { DatastoreModule } from '~/datastore/datastore.module';
import { UsersController } from '~/users/users.controller';
import { UsersService } from '~/users/users.service';

/**
 * responsible for the REST API's users
 */
@Module({
  imports: [DatastoreModule.register()],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
