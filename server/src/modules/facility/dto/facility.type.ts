import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { FacilityType, FacilityCategory } from '../models/facility.entity';

/**
 * 设施创建/更新入参
 */
@InputType({ description: '设施创建/更新入参' })
export class FacilityUpsertInput {
  @Field(() => ID, { nullable: true, description: '设施ID（为空则新增）' })
  id?: string;

  @Field(() => String, { description: '设施名称' })
  name: string;

  @Field(() => FacilityType, { description: '设施类型' })
  type: FacilityType;

  @Field(() => FacilityCategory, { description: '设施分类（必填）' })
  category: FacilityCategory;

  @Field(() => Boolean, { nullable: true, description: '是否启用', defaultValue: true })
  enabled?: boolean;
}

/**
 * 设施启用/禁用入参
 */
@InputType({ description: '设施启用/禁用入参' })
export class FacilityEnableInput {
  @Field(() => ID, { description: '设施ID' })
  id: string;

  @Field(() => Boolean, { description: '是否启用' })
  enabled: boolean;
}
