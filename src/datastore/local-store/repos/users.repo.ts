import { Injectable } from '@nestjs/common';

import { AppConflictError, AppNotFoundError } from '~/common/errors';
import { CreateUserDto } from '~/users/dto/create-user.dto';
import { UserModel } from '~/users/model/user.model';
import { UsersRepo } from '~/users/repo/user.repo';
import { defaultUser } from '~/users/user.consts';

@Injectable()
export class LocalUserRepo implements UsersRepo {
  private users: Record<string, UserModel> = { [defaultUser.id]: defaultUser };
  private _nextId = 0;

  public async createUser(params: CreateUserDto): Promise<UserModel> {
    const { name } = params;
    const existingUser = this.getUserByName(name);
    if (existingUser) {
      throw new AppConflictError(name, UsersRepo.type);
    }

    const id = this.nextId();
    const user = { id, ...params };
    this.users[id] = user;

    return user;
  }

  public async findByName(name: string): Promise<UserModel> {
    const storedUser = this.getUserByName(name);
    if (!storedUser) {
      throw new AppNotFoundError(name, UsersRepo.type);
    }
    return storedUser;
  }

  private getUserByName(name: string): UserModel | undefined {
    return Object.values(this.users).find(user => user.name === name);
  }

  private nextId(): string {
    this._nextId += 1;

    return String(this._nextId);
  }
}
