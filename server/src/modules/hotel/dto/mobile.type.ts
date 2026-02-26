import { Field, ID, ObjectType } from '@nestjs/graphql';
import { NearbyPoiItem } from '../../poi/dto/poi.type';
import { RoomTypeEntity } from 'src/modules/roomType/models/room-type.entity';

import { HotelImageEntity } from '../../hotelImage/models/hotel-image.entity';

@ObjectType({ description: '移动端 Banner' })
export class MobileBanner {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  imageUrl: string;

  @Field(() => String, { nullable: true })
  redirectHotelId?: string | null;
}

@ObjectType({ description: '热门城市' })
export class MobileCity {
  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;
}

@ObjectType({ description: '快捷设施（移动端）' })
export class MobileFacility {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;
}

@ObjectType({ description: '首页配置（移动端）' })
export class MobileHomeConfig {
  @Field(() => [MobileBanner])
  banners: MobileBanner[];

  @Field(() => [MobileCity])
  cities: MobileCity[];

  @Field(() => [MobileFacility])
  facilities: MobileFacility[];
}

@ObjectType({ description: '酒店列表项（移动端）' })
export class MobileHotelListItem {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  hotelNo?: string | null;

  @Field(() => String)
  name: string;

  @Field(() => [HotelImageEntity], { nullable: true, description: '酒店图片列表' })
  images?: HotelImageEntity[] | [];

  @Field(() => Number, { nullable: true })
  score?: number | null;

  @Field(() => Number, { nullable: true, description: '起步价' })
  minPrice?: number | null;

  @Field(() => Number, { nullable: true, description: '距离(公里)' })
  distance?: number | null;

  @Field(() => String, { nullable: true, description: '距离文案' })
  distanceText?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => Number, { nullable: true })
  favoriteCount?: number | null;

  @Field(() => Number, { nullable: true, description: '最低起价（自动由房型价格计算）' })
  miniPrice?: number | null;

  @Field(() => Number, { nullable: true, description: '酒店星级（0-10）' })
  starLevel?: number | null;

  @Field(() => String, { nullable: true })
  latitude?: string | null;

  @Field(() => String, { nullable: true })
  longitude?: string | null;

  @Field(() => String, { nullable: true, description: '开业时间（YYYY-MM-DD 格式）' })
  openSince?: string | null;



  @Field(() => [RoomTypeEntity], { nullable: true })
  roomType?: [RoomTypeEntity] | [];
}

@ObjectType({ description: '酒店列表返回（移动端）' })
export class HotelConnection {
  @Field(() => [MobileHotelListItem])
  items: MobileHotelListItem[];

  @Field(() => Number)
  total: number;
}

@ObjectType({ description: '房型信息（移动端）' })
export class MobileRoom {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  coverImage?: string | null;

  @Field(() => Number)
  price: number;

  @Field(() => Number, { nullable: true })
  stock?: number | null;

  @Field(() => String, { nullable: true })
  bedType?: string | null;

  @Field(() => Boolean, { nullable: true })
  hasBreakfast?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  refundable?: boolean | null;

  @Field(() => Number, { nullable: true })
  area?: number | null;

  @Field(() => Boolean, { nullable: true })
  hasWindow?: boolean | null;

  @Field(() => Number, { nullable: true })
  maxGuests?: number | null;

  //加两个
}

@ObjectType({ description: '酒店详情（移动端）' })
export class MobileHotelDetail {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Number, { nullable: true })
  favoriteCount?: number | null;

  @Field(() => [String])
  images: string[];

  @Field(() => [String])
  facilities: string[];

  @Field(() => [MobileRoom])
  rooms: MobileRoom[];

  @Field(() => [NearbyPoiItem], { nullable: true })
  nearbyPoi?: NearbyPoiItem[];
  //新增
  @Field(() => Number, { nullable: true })
  starLevel?: number | null; // 星级

  @Field(() => String, { nullable: true })
  city?: string | null; // 城市编码

  @Field(() => String, { nullable: true })
  nameEn?: string | null; // 英文名称

  @Field(() => String, { nullable: true })
  brand?: string | null; // 品牌

  @Field(() => Number, { nullable: true })
  score?: number | null; // 评分（decimal转number）

  @Field(() => String, { nullable: true })
  phone?: string | null; // 电话

  @Field(() => Number, { nullable: true })
  longitude?: number | null; // 经度

  @Field(() => Number, { nullable: true })
  latitude?: number | null; // 纬度

  @Field(() => String,{ nullable:true })
  openSince?:string | null;

  @Field(() => String, { nullable: true })
  province?: string | null; // 省份

  @Field(() => String, { nullable: true })
  district?: string | null; // 区县

  @Field(() => Number, { nullable: true })
  commentCount?: number | null; // 评价数
}

@ObjectType({ description: 'HotelConnection结果' })
export class HotelConnectionResult {
  @Field(() => Number)
  code: number;

  @Field(() => String)
  message: string;

  @Field(() => HotelConnection, { nullable: true })
  data?: HotelConnection;
}

@ObjectType({ description: '首页配置结果' })
export class MobileHomeConfigResult {
  @Field(() => Number)
  code: number;

  @Field(() => String)
  message: string;

  @Field(() => MobileHomeConfig, { nullable: true })
  data?: MobileHomeConfig;
}

@ObjectType({ description: '酒店详情结果' })
export class MobileHotelDetailResult {
  @Field(() => Number)
  code: number;

  @Field(() => String)
  message: string;

  @Field(() => MobileHotelDetail, { nullable: true })
  data?: MobileHotelDetail;
}
