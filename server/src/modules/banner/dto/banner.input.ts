import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

@InputType({ description: 'Banner 新增/更新入参' })
export class BannerUpsertInput {
  @Field(() => String, { description: '标题' })
  @IsNotEmpty()
  title: string;

  @Field(() => String, { description: '图片URL' })
  @IsNotEmpty()
  imageUrl: string;

  @Field(() => ID, { description: '跳转酒店ID' })
  targetHotelId: string;

  @Field(() => Int, { defaultValue: 0, description: '排序（数值越小越靠前）' })
  @IsOptional()
  @IsInt()
  sort: number;

  @Field(() => Boolean, { defaultValue: true, description: '是否启用' })
  enabled: boolean;

  @Field(() => String, { nullable: true, description: '开始时间（ISO 字符串，可选）' })
  @IsOptional()
  startAt?: string;

  @Field(() => String, { nullable: true, description: '结束时间（ISO 字符串，可选）' })
  @IsOptional()
  endAt?: string;
}
