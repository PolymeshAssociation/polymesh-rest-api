import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';

import { AuthStrategy } from '~/auth/strategies/strategies.consts';
import { defaultUser } from '~/users/user.consts';

/**
 * authenticates with a default user
 *
 * @note this is intended for development or read only purposes. This strategy should **not** be used with a signer holding production keys
 */
@Injectable()
export class OpenStrategy extends PassportStrategy(Strategy, AuthStrategy.Open) {
  public validate(): Express.User {
    return defaultUser;
  }
}
