import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Roles } from '../../common/decorators/roles.decorator';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/models/user.entity';
import { HotelEntity, HotelStatus } from './models/hotel.entity';
import { AdminDashboardStats, DailyNewHotel, NewHotelItem } from './dto/stats.type';

function stableNumberFromString(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % mod;
  }
  return h;
}

@Resolver()
export class StatsResolver {
  constructor(@InjectRepository(HotelEntity) private readonly hotelRepo: Repository<HotelEntity>) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => AdminDashboardStats, { description: '管理员仪表盘统计（部分为演示数据）' })
  async adminDashboardStats(@Args('topN', { type: () => Int, defaultValue: 10, description: '展示数量' }) topN: number) {
    // 真实：近7天每日新增酒店数
    const days: DailyNewHotel[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, count: 0 });
    }

    const hotels = await this.hotelRepo.find({ relations: ['merchant'] });

    const dayMap = new Map(days.map((d) => [d.date, d]));
    for (const h of hotels) {
      const dateStr = h.createdAt.toISOString().slice(0, 10);
      const item = dayMap.get(dateStr);
      if (item) item.count += 1;
    }

    const hotelCount = hotels.length;

    // 近7日新增酒店列表
    const newHotels: NewHotelItem[] = hotels
      .filter((h) => {
        const dateStr = h.createdAt.toISOString().slice(0, 10);
        return dayMap.has(dateStr);
      })
      .map((h) => ({
        hotelId: h.id,
        hotelName: h.nameZh,
        merchantName: h.merchant?.username || '-',
        createdDate: h.createdAt.toISOString().slice(0, 10),
      }))
      .sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1));

    const limitedNewHotels = newHotels.slice(0, Math.max(1, Math.min(50, topN)));

    const newHotelCount = days.reduce((sum, d) => sum + d.count, 0);
    const pendingHotelCount = hotels.filter((h) => h.status === HotelStatus.REVIEWING).length;

    // 演示：平台总交易额（稳定随机整数）
    const revenue = 500000 + stableNumberFromString(String(newHotelCount + hotelCount), 5000000);

    const stats: AdminDashboardStats = {
      totalRevenue: revenue,
      hotelCount,
      newHotelCount,
      pendingHotelCount,
      newHotels: limitedNewHotels,
      dailyNewHotels: days,
    };
    console.log('newHotels', stats);
    return stats;
  }
}
