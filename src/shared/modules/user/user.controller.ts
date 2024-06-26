import {
  BaseController,
  HttpError,
  HttpMethod, UploadFileMiddleware,
  ValidateDtoMiddleware,
  ValidateObjectIdMiddleware
} from '../../libs/rest';
import {inject, injectable} from 'inversify';
import {Component} from '../../types';
import {Logger} from '../../libs/logger';
import {Request, Response} from 'express';
import {CreateUserRequest} from './create-user-request.type';
import {UserService} from './user-service.interface';
import {Config, RestSchema} from '../../libs/config';
import {StatusCodes} from 'http-status-codes';
import {fillDTO} from '../../helpers';
import {UserRdo} from './rdo/user.rdo';
import {LoginUserRequest} from './login-user-request.type';
import {CreateUserDto} from './dto/create-user.dto';
import {LoginUserDto} from './dto/login-user.dto';
import {AuthService} from '../auth';
import {LoggedUserRdo} from './rdo/logged-user.rdo';
import {UploadUserAvatarRdo} from './rdo/upload-user-avatar.rdo';
import {RegisteredUserRdo} from './rdo/registered-user.rdo';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly configService: Config<RestSchema>,
    @inject(Component.AuthService) private readonly authService: AuthService,
  ) {
    super(logger);
    this.logger.info('Register routes for UserController…');

    this.addRoute({
      path: '/register',
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [new ValidateDtoMiddleware(CreateUserDto)]
    });

    this.addRoute({
      path: '/login',
      method: HttpMethod.Post,
      handler: this.login
    });

    this.addRoute({
      path: '/login',
      method: HttpMethod.Get,
      handler: this.checkAuth,
      middlewares: [new ValidateDtoMiddleware(LoginUserDto)]
    });

    this.addRoute({
      path: '/:userId/avatar',
      method: HttpMethod.Post,
      handler: this.uploadAvatar,
      middlewares: [
        new ValidateObjectIdMiddleware('userId'),
        new UploadFileMiddleware(this.configService.get('UPLOAD_DIRECTORY'), 'avatar')
      ]
    });

    this.addRoute({
      path: '/logout',
      method: HttpMethod.Delete,
      handler: this.logout,
    });
  }

  public async create({body}: CreateUserRequest, res: Response): Promise<void> {
    const existUser = await this.userService.findByEmail(body.email);

    if (existUser) {
      throw new HttpError(
        StatusCodes.CONFLICT,
        `User with email «${body.email}» exists.`,
        'UserController'
      );
    }

    const result = await this.userService.create(body, this.configService.get('SALT'));
    this.created(res, fillDTO(RegisteredUserRdo, result));
  }

  public async login({body}: LoginUserRequest, res: Response): Promise<void> {
    const user = await this.authService.verify(body);
    const token = await this.authService.authenticate(user);
    const responseData = fillDTO(LoggedUserRdo, {
      email: user.email,
      token,
      avatar: user.avatarUrl
    });
    this.ok(res, responseData);
  }

  public async checkAuth({ body: { email }}: LoginUserRequest, res: Response): Promise<void> {
    const foundedUser = await this.userService.findByEmail(email);

    if (!foundedUser) {
      throw new HttpError(
        StatusCodes.UNAUTHORIZED,
        'Unauthorized',
        'UserController'
      );
    }

    this.ok(res, fillDTO(UserRdo, foundedUser));
  }

  public async uploadAvatar({params, file}: Request, res: Response): Promise<void> {
    const {userId} = params;
    const uploadFile = {avatarPath: file?.filename};
    await this.userService.updateById(userId, uploadFile);
    this.created(res, fillDTO(UploadUserAvatarRdo, {filepath: uploadFile.avatarPath}));
  }

  public async logout(_req: Request, res: Response): Promise<void> {
    this.ok(res, null);
  }
}
