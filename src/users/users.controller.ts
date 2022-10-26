import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { CreateUserDto } from '~/users/dto/create-user.dto';
import { UserModel } from '~/users/model/user.model';
import { UsersService } from '~/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Create a new REST API user',
    description: 'This endpoint creates a new REST API user',
  })
  @ApiOkResponse({
    description: 'The newly created user',
    type: UserModel,
  })
  @Post('/create')
  async createUser(@Body() params: CreateUserDto): Promise<UserModel> {
    return this.usersService.createUser(params);
  }
}
