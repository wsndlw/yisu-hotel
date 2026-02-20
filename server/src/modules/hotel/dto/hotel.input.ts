import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { HotelStatus } from '../models/hotel.entity';

@InputType({ description: '酒店创建/更新入参' })
export class HotelUpsertInput {
  @Field(() => Boolean, { description: '是否提交审核（true=提交审核，false=保存草稿）' })
  isSubmit: boolean;

  @Field(() => String, { description: '酒店名称（中文）' })
  @IsNotEmpty()
  nameZh: string;

  @Field(() => String, { nullable: true, description: '酒店名称（英文，可选）' })
  @IsOptional()
  nameEn?: string;

  @Field(() => String, { nullable: true, description: '酒店地址（用于展示）' })
  @IsNotEmpty({ groups: ['SUBMIT'] })
  @IsOptional({ groups: ['DRAFT'] })
  address?: string;

  @Field(() => Number, { nullable: true, description: '纬度（地图选点）' })
  @IsOptional()
  latitude?: number;

  @Field(() => Number, { nullable: true, description: '经度（地图选点）' })
  @IsOptional()
  longitude?: number;

  @Field(() => String, { nullable: true, description: '所属城市' })
  @IsNotEmpty({ groups: ['SUBMIT'] })
  @IsOptional({ groups: ['DRAFT'] })
  city?: string;

  @Field(() => Int, { nullable: true, description: '星级（0-10）' })
  @IsInt({ groups: ['SUBMIT'] })
  @Min(0, { groups: ['SUBMIT'] })
  @Max(10, { groups: ['SUBMIT'] })
  @IsOptional({ groups: ['DRAFT'] })
  starLevel?: number;

  @Field(() => String, { nullable: true, description: '开业时间（YYYY-MM-DD）' })
  @IsOptional()
  @IsDateString()
  openSince?: string;

  @Field(() => [ID], { nullable: true, description: '标签ID列表（从标签库中选择，可选）' })
  @IsOptional()
  @IsArray()
  tagIds?: string[];

  @Field(() => [ID], { nullable: true, description: '设施ID列表（从设施库中选择，可选）' })
  @IsOptional()
  facilityIds?: string[];

  @Field(() => [String], { nullable: true, description: '附近信息（可选）' })
  @IsOptional()
  nearby?: string[];

  @Field(() => String, { nullable: true, description: '优惠/折扣描述（可选）' })
  @IsOptional()
  discountInfo?: string;
}

@InputType({ description: '酒店列表查询入参' })
export class HotelListInput {
  @Field(() => String, { nullable: true, description: '所属城市（可选）' })
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true, description: '关键词（可选，匹配酒店名称/地址）' })
  @IsOptional()
  keyword?: string;

  @Field(() => String, { nullable: true, description: '商户名称关键词（可选，匹配商户用户名）' })
  @IsOptional()
  merchantKeyword?: string;

  @Field(() => Int, { nullable: true, description: '星级（可选）' })
  @IsOptional()
  @IsInt()
  starLevel?: number;

  @Field(() => [ID], { nullable: true, description: '按标签筛选（标签ID）' })
  @IsOptional()
  tagIds?: string[];

  @Field(() => [ID], { nullable: true, description: '按设施筛选（设施ID）' })
  @IsOptional()
  facilityIds?: string[];

  @Field(() => HotelStatus, { nullable: true, description: '酒店状态（可选，管理端常用）' })
  @IsOptional()
  status?: HotelStatus;

  @Field(() => Int, { defaultValue: 1, description: '页码（从1开始）' })
  @IsInt()
  page: number;

  @Field(() => Int, { defaultValue: 10, description: '每页数量' })
  @IsInt()
  pageSize: number;
}

@InputType({ description: '设置酒店图片入参' })
export class SetHotelImagesInput {
  @Field(() => ID, { description: '酒店ID' })
  hotelId: string;

  @Field(() => [String], { description: '图片URL列表' })
  urls: string[];
}

@InputType({ description: '房型创建/更新入参' })
export class RoomTypeUpsertInput {
  @Field(() => String, { description: '房型名称' })
  @IsNotEmpty()
  name: string;

  @Field(() => Number, { description: '房型基础价格' })
  basePrice: number;

  @Field(() => Int, { nullable: true, description: '可住人数（可选）' })
  @IsOptional()
  maxGuests?: number;

  @Field(() => String, { nullable: true, description: '床型（可选）' })
  @IsOptional()
  bedType?: string;

  @Field(() => Int, { nullable: true, description: '库存（可选）' })
  @IsOptional()
  stock?: number;

  @Field(() => String, { nullable: true, description: '房型图片（JSON 字符串）' })
  @IsOptional()
  images?: string;

  @Field(() => Boolean, { nullable: true, description: '是否开售' })
  @IsOptional()
  isOnSale?: boolean;

  @Field(() => Boolean, { nullable: true, description: '含早' })
  @IsOptional()
  hasBreakfast?: boolean;

  @Field(() => Boolean, { nullable: true, description: '可退' })
  @IsOptional()
  refundable?: boolean;

  @Field(() => Number, { nullable: true, description: '房间面积(㎡)' })
  @IsOptional()
  area?: number;

  @Field(() => String, { nullable: true, description: '楼层' })
  @IsOptional()
  floor?: string;

  @Field(() => Boolean, { nullable: true, description: '有窗' })
  @IsOptional()
  hasWindow?: boolean;

  @Field(() => Int, { nullable: true, description: '排序（可选）' })
  @IsOptional()
  sortOrder?: number;
}

@InputType({ description: '房型运营调整入参' })
export class RoomTypeOpsInput {
  @Field(() => Number, { nullable: true, description: '房型基础价格' })
  basePrice?: number;

  @Field(() => Int, { nullable: true, description: '库存' })
  stock?: number;

  @Field(() => Boolean, { nullable: true, description: '是否开售' })
  isOnSale?: boolean;

  @Field(() => Boolean, { nullable: true, description: '含早' })
  hasBreakfast?: boolean;

  @Field(() => Boolean, { nullable: true, description: '可退' })
  refundable?: boolean;
}

// /**
//  * 【移动端专用】酒店列表查询条件
//  */
// @InputType({ description: '【移动端】酒店列表查询入参 - 支持多维度筛选' })
// export class HotelH5ListInput {
//   @Field(() => Int, { nullable: true, defaultValue: 1, description: '页码（从1开始）' })
//   @IsOptional()
//   @IsInt()
//   page?: number;

//   @Field(() => Int, { nullable: true, defaultValue: 10, description: '每页数量' })
//   @IsOptional()
//   @IsInt()
//   pageSize?: number;

//   @Field(() => String, { nullable: true, description: '城市编码或城市名称' })
//   @IsOptional()
//   city?: string;

//   @Field(() => String, { nullable: true, description: '搜索关键词（酒店名称）' })
//   @IsOptional()
//   keyword?: string;

//   @Field(() => Int, { nullable: true, description: '星级筛选（0-5）' })
//   @IsOptional()
//   @IsInt()
//   starLevel?: number;

//   @Field(() => Number, { nullable: true, description: '最低价格' })
//   @IsOptional()
//   minPrice?: number;

//   @Field(() => Number, { nullable: true, description: '最高价格' })
//   @IsOptional()
//   maxPrice?: number;

//   @Field(() => [ID], { nullable: true, description: '标签ID数组（多选）' })
//   @IsOptional()
//   tagIds?: string[];

//   @Field(() => [ID], { nullable: true, description: '设施ID数组（多选）' })
//   @IsOptional()
//   facilityIds?: string[];

//   @Field(() => Number, { nullable: true, description: '用户当前纬度（用于计算距离）' })
//   @IsOptional()
//   latitude?: number;

//   @Field(() => Number, { nullable: true, description: '用户当前经度（用于计算距离）' })
//   @IsOptional()
//   longitude?: number;

//   @Field(() => String, {
//     nullable: true,
//     description: '排序方式：distance（距离）、price（价格）、starLevel（星级）',
//   })
//   @IsOptional()
//   sortBy?: string;
// }
