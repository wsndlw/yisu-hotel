import { Injectable } from '@nestjs/common';
import { RoomTypeService } from '../roomType/roomType.service';
import { CalendarPriceService } from '../calendarPrice/calendarPrice.service';
import { CalendarStockService } from '../calendarStock/calendarStock.service';
import { RoomTypeCalendar, RoomTypeCalendarDay } from './common/calendar.type';

function enumerateDates(start: string, end: string): string[] {
  const out: string[] = [];
  let d = new Date(start + 'T00:00:00.000Z');
  const endD = new Date(end + 'T00:00:00.000Z');
  while (d <= endD) {
    out.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 24 * 3600 * 1000);
  }
  return out;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly roomTypeService: RoomTypeService,
    private readonly priceService: CalendarPriceService,
    private readonly stockService: CalendarStockService,
  ) {}

  /**
   * 获取房型某日期范围内的可售日历：优先取日历覆盖，否则回退到房型 basePrice/stock。
   */
  async getRoomTypeCalendar(roomTypeId: string, startDate: string, endDate: string): Promise<RoomTypeCalendar> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);

    const [prices, stocks] = await Promise.all([
      this.priceService.list(roomTypeId, startDate, endDate),
      this.stockService.list(roomTypeId, startDate, endDate),
    ]);

    const priceMap = new Map(prices.map((p) => [p.date, p.price]));
    const stockMap = new Map(stocks.map((s) => [s.date, s.stock]));

    const days: RoomTypeCalendarDay[] = enumerateDates(startDate, endDate).map((date) => ({
      date,
      price: priceMap.get(date) ?? Number(roomType.basePrice),
      stock: stockMap.has(date) ? stockMap.get(date)! : (roomType.stock ?? null),
    }));

    return { roomTypeId, days };
  }

  /**
   * 检查房型在日期范围内是否可订（每晚都要有库存）
   * 
   * @param roomTypeId 房型ID
   * @param checkIn 入住日期（YYYY-MM-DD）
   * @param checkOut 离店日期（YYYY-MM-DD）
   * @returns 是否可订（每晚库存 > 0）
   */
  async checkAvailability(roomTypeId: string, checkIn: string, checkOut: string): Promise<boolean> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
    if (!roomType) return false;

    // 计算住宿天数（入住日到离店日前一天）
    // 例如：2025-01-01 入住，2025-01-03 离店，住 2 晚（1月1日、1月2日）
    const nights: string[] = [];
    let d = new Date(checkIn + 'T00:00:00.000Z');
    const endD = new Date(checkOut + 'T00:00:00.000Z');
    while (d < endD) {
      nights.push(d.toISOString().slice(0, 10));
      d = new Date(d.getTime() + 24 * 3600 * 1000);
    }

    if (nights.length === 0) return false;

    // 查询这些日期的日历库存
    const stocks = await this.stockService.list(roomTypeId, nights[0], nights[nights.length - 1]);
    const stockMap = new Map(stocks.map((s) => [s.date, s.stock]));

    // 检查每一晚：优先用日历库存，否则用房型基础库存
    for (const night of nights) {
      const stock = stockMap.has(night) ? stockMap.get(night)! : (roomType.stock ?? 0);
      if (stock <= 0) return false; // 任意一晚无库存则不可订
    }

    return true;
  }

  /**
   * 计算房型在日期范围内的总价（考虑日历价格覆盖）
   * 
   * @param roomTypeId 房型ID
   * @param checkIn 入住日期（YYYY-MM-DD）
   * @param checkOut 离店日期（YYYY-MM-DD）
   * @returns 总价（元）
   */
  async getDateRangePrice(roomTypeId: string, checkIn: string, checkOut: string): Promise<number> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
    if (!roomType) return 0;

    // 住宿天数
    const nights: string[] = [];
    let d = new Date(checkIn + 'T00:00:00.000Z');
    const endD = new Date(checkOut + 'T00:00:00.000Z');
    while (d < endD) {
      nights.push(d.toISOString().slice(0, 10));
      d = new Date(d.getTime() + 24 * 3600 * 1000);
    }

    if (nights.length === 0) return 0;

    // 查询日历价格
    const prices = await this.priceService.list(roomTypeId, nights[0], nights[nights.length - 1]);
    const priceMap = new Map(prices.map((p) => [p.date, p.price]));

    // 累加每晚价格：优先用日历价格，否则用基础价格
    let total = 0;
    for (const night of nights) {
      const price = priceMap.has(night) ? Number(priceMap.get(night)!) : Number(roomType.basePrice);
      total += price;
    }

    return total;
  }
}
