import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from '../../user/models/user.entity';

@ObjectType({ description: '认证返回（含 Token 与用户信息）' })
export class AuthPayload {
  @Field(() => String, { description: '访问令牌（JWT）' })
  accessToken: string;

  @Field(() => UserEntity, { description: '用户信息' })
  user: UserEntity;
}
