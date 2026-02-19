import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType({ description: '标签新增/更新入参（管理员）' })
export class TagUpsertInput {
  @Field(() => String, { description: '标签名称' })
  @IsNotEmpty()
  name: string;

  @Field(() => Boolean, { defaultValue: true, description: '是否启用' })
  @IsOptional()
  enabled?: boolean;
}

@InputType({ description: '设施新增/更新入参（管理员）' })
export class FacilityUpsertInput {
  @Field(() => String, { description: '设施名称' })
  @IsNotEmpty()
  name: string;

  @Field(() => Boolean, { defaultValue: true, description: '是否启用' })
  @IsOptional()
  enabled?: boolean;
}

@InputType({ description: '启用/禁用入参（管理员）' })
export class EnableInput {
  @Field(() => ID, { description: 'ID' })
  id: string;

  @Field(() => Boolean, { description: '是否启用' })
  enabled: boolean;
}
