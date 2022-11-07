import { Injectable } from '@nestjs/common';

import { CreateUserDto } from '~/users/dto/create-user.dto';
import { UserModel } from '~/users/model/user.model';
import { UsersRepo } from '~/users/repo/user.repo';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UsersRepo) {}

  public async getByName(name: string): Promise<UserModel> {
    return this.userRepo.findByName(name);
  }

  public async createUser(params: CreateUserDto): Promise<UserModel> {
    const user = await this.userRepo.createUser(params);
    return user;
  }
}
