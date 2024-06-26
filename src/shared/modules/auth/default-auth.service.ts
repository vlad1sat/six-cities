import {AuthService} from './auth-service.interface';
import {inject, injectable} from 'inversify';
import {Component} from '../../types';
import {Logger} from '../../libs/logger';
import {UserService} from '../user';
import {Config, RestSchema} from '../../libs/config';
import {UserEntity} from '../user';
import * as crypto from 'node:crypto';
import {TokenPayload} from './types/token-payload.type';
import {SignJWT} from 'jose';
import {JWT_ALGORITHM, JWT_EXPIRED} from './auth.constant';
import {LoginUserDto} from '../user/dto/login-user.dto';
import {UserNotFoundException, UserPasswordIncorrectException} from './exceptions';

@injectable()
export class DefaultAuthService implements AuthService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
  ) {}

  public async authenticate(user: UserEntity): Promise<string> {
    const jwtSecret = this.config.get('JWT_SECRET');
    const secretKey = crypto.createSecretKey(jwtSecret, 'utf-8');
    const tokenPayload: TokenPayload = {
      email: user.email,
      name: user.name,
      id: user.id
    };

    this.logger.info(`Create token for ${user.email}`);
    return new SignJWT(tokenPayload)
      .setProtectedHeader({alg: JWT_ALGORITHM})
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRED)
      .sign(secretKey);
  }

  public async verify(dto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`User with ${dto.email} not found`);
      throw new UserNotFoundException();
    }

    if (!user.verifyPassword(dto.password, this.config.get('SALT'))) {
      this.logger.warn(`Incorrect password for ${dto.email}`);
      throw new UserPasswordIncorrectException();
    }

    return user;
  }
}
