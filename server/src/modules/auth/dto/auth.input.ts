import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../user/models/user.entity';

@InputType({ description: '注册入参' })
export class RegisterInput {
  @Field(() => String, { description: '用户名' })
  @IsNotEmpty()
  username: string;

  @Field(() => String, { description: '密码（至少6位）' })
  @MinLength(6)
  password: string;

  @Field(() => UserRole, {
    nullable: true,
    description: '角色；不传则默认为消费者 CUSTOMER。商户/管理员后台注册时显式传入 MERCHANT 或 ADMIN',
  })
  @IsOptional()
  @IsIn([UserRole.CUSTOMER, UserRole.MERCHANT, UserRole.ADMIN])
  role?: UserRole;

    @Field(() => String, { nullable: true, description: '邮箱地址（邮箱注册时必填）' })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @Field(() => String, { nullable: true, description: '邮箱验证码（邮箱注册时必填）' })
  @IsOptional()
  emailCode?: string;
}

@InputType({ description: '登录入参' })
export class LoginInput {
  @Field(() => String, { description: '用户名' })
  @IsNotEmpty()
  username: string;

  @Field(() => String, { description: '密码' })
  @IsNotEmpty()
  password: string;
}
