import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: '新增酒店记录（近7天）' })
export class NewHotelItem {
  @Field(() => String, { description: '酒店ID' })
  hotelId: string;

  @Field(() => String, { description: '酒店名称' })
  hotelName: string;

  @Field(() => String, { description: '商户名称' })
  merchantName: string;

  @Field(() => String, { description: '创建日期（YYYY-MM-DD）' })
  createdDate: string;
}

@ObjectType({ description: '每日新增酒店数' })
export class DailyNewHotel {
  @Field(() => String, { description: '日期（YYYY-MM-DD）' })
  date: string;

  @Field(() => Int, { description: '新增酒店数' })
  count: number;
}

@ObjectType({ description: '管理员仪表盘统计数据' })
export class AdminDashboardStats {
  @Field(() => Number, { description: '平台总交易额（演示用）' })
  totalRevenue: number;

  @Field(() => [NewHotelItem], { description: '近7日新增酒店列表' })
  newHotels: NewHotelItem[];

  @Field(() => Int, { description: '酒店总数（真实）' })
  hotelCount: number;

  @Field(() => Int, { description: '近7日新增酒店总数（真实）' })
  newHotelCount: number;

  @Field(() => Int, { description: '待审核酒店数（真实）' })
  pendingHotelCount: number;

  @Field(() => [DailyNewHotel], { description: '近7日每日新增酒店数（真实统计）' })
  dailyNewHotels: DailyNewHotel[];
}
