import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../user/models/user.entity';

@InputType({ description: '注册入参' })
export class RegisterInput {
  @Field(() => String, { description: '用户名' })
  @IsNotEmpty()
  username: string;

  @Field(() => String, { description: '密码（至少6位）' })
  @MinLength(6)
  password: string;

  @Field(() => UserRole, { description: '角色（商户/管理员）' })
  @IsIn([UserRole.MERCHANT, UserRole.ADMIN])
  role: UserRole;
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
