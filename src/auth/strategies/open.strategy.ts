import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-custom';

import { AuthStrategy } from '~/auth/strategies/strategies.conts';
import { openAuthUser } from '~/users/user.consts';

/**
 * authenticates with a default user
 *
 * @note this is intended for development or read only purposes. This should not be used with a signer
 */
@Injectable()
export class OpenStrategy extends PassportStrategy(Strategy, AuthStrategy.open) {
  constructor() {
    const verifyEveryone: VerifyCallback = (req, done) => done(null, openAuthUser);

    super(verifyEveryone);
  }
}
