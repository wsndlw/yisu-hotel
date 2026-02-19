import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, MinLength } from 'class-validator';

@InputType({ description: '更新当前用户信息入参' })
export class UpdateMeInput {
  @Field(() => String, { nullable: true, description: '新用户名（可选）' })
  @IsOptional()
  username?: string;

  @Field(() => String, { nullable: true, description: '新密码（可选，至少6位）' })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @Field(() => String, { nullable: true, description: '头像URL（可选）' })
  @IsOptional()
  avatarUrl?: string;

  @Field(() => [String], { nullable: true, description: '常用标签ID（可选）' })
  @IsOptional()
  preferredTagIds?: string[];

  @Field(() => [String], { nullable: true, description: '常用设施ID（可选）' })
  @IsOptional()
  preferredFacilityIds?: string[];
}
