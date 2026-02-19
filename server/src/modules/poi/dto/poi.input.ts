import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType({ description: '创建/更新 POI' })
export class PoiUpsertInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  city: string;

  @Field(() => String)
  @IsNotEmpty()
  type: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  latitude?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  longitude?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  address?: string;

  @Field(() => Number, { nullable: true, description: '基础热度评分' })
  @IsOptional()
  baseScore?: number;
}

@InputType({ description: '酒店附近 POI 查询' })
export class NearbyPoiQueryInput {
  @Field(() => ID)
  hotelId: string;

  @Field(() => String, { nullable: true, description: '类型过滤' })
  @IsOptional()
  type?: string;

  @Field(() => Int, { defaultValue: 5, description: '半径（km）' })
  @IsOptional()
  radiusKm?: number;

  @Field(() => Int, { defaultValue: 20, description: '最大数量' })
  @IsOptional()
  limit?: number;
}

@InputType({ description: '关联 POI 到酒店' })
export class PoiListQueryInput {
  @Field(() => String, { description: '城市' })
  city: string;

  @Field(() => String, { nullable: true, description: '类型过滤' })
  @IsOptional()
  type?: string;

  @Field(() => String, { nullable: true, description: '关键词' })
  @IsOptional()
  keyword?: string;

  @Field(() => Int, { defaultValue: 50, description: '最大数量' })
  @IsOptional()
  limit?: number;
}

@InputType()
export class HotelPoiLinkInput {
  @Field(() => ID)
  hotelId: string;

  @Field(() => ID)
  poiId: string;
}
