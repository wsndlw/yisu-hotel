import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResult } from './dto/result-auth.output';
import { LoginInput, RegisterInput } from './dto/auth.input';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthResult, { description: '注册账号（可选择商户/管理员角色）' })
  async register(
    @Args('input', { description: '注册信息' }) input: RegisterInput,
  ): Promise<AuthResult> {
    try {
      const data = await this.auth.register(input);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '注册成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Mutation(() => AuthResult, { description: '账号登录（返回 JWT Token）' })
  async login(
    @Args('input', { description: '登录信息' }) input: LoginInput,
  ): Promise<AuthResult> {
    try {
      const data = await this.auth.login(input);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '登录成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
