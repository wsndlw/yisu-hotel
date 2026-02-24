import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthResult } from './dto/result-auth.output';
import { LoginInput, RegisterInput } from './dto/auth.input';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';
// ===== 邮箱验证码功能 =====
import { Result } from '../../common/dto/result.type';

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

  // ===== 邮箱验证码功能：发送验证码 =====
  @Mutation(() => Result, { description: '发送邮箱验证码' })
  async sendEmailCode(@Args('email') email: string): Promise<Result> {
    return this.auth.sendEmailCode(email);
  }

  // ===== 邮箱验证码功能：邮箱验证码登录 =====
  @Mutation(() => Result, { description: '邮箱验证码登录' })
  async emailLogin(
    @Args('email') email: string,
    @Args('code') code: string,
  ): Promise<Result> {
    return this.auth.emailLogin(email, code);
  }

  // ===== 邮箱验证码功能：邮箱验证码注册 =====
  @Mutation(() => Result, { description: '邮箱验证码注册' })
  async emailRegister(
    @Args('email') email: string,
    @Args('code') code: string,
    @Args('password') password: string,
    @Args('role') role: string,
  ): Promise<Result> {
    return this.auth.emailRegister(email, code, password, role);
  }
}
