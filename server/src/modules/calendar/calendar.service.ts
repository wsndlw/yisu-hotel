import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomTypeService } from '../roomType/roomType.service';
import { CalendarPriceService } from '../calendarPrice/calendarPrice.service';
import { CalendarStockService } from '../calendarStock/calendarStock.service';
import { HotelMinPriceCalendar, RoomTypeCalendar, RoomTypeCalendarDay } from './common/calendar.type';
import { HotelEntity, HotelStatus } from '../hotel/models/hotel.entity';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_CALENDAR_DAYS = 90;
const MAX_CALENDAR_DAYS = 366;
const BUSINESS_TIME_ZONE = 'Asia/Shanghai';

function assertDate(value: string, fieldName: string): string {
  if (!DATE_RE.test(value)) {
    throw new BadRequestException(`${fieldName} 必须是 YYYY-MM-DD 格式`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${fieldName} 不是有效日期`);
  }

  return value;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function countDaysInclusive(start: string, end: string): number {
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime();
  return Math.floor((endTime - startTime) / (24 * 3600 * 1000)) + 1;
}

function getBusinessToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

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
    @InjectRepository(HotelEntity)
    private readonly hotelRepo: Repository<HotelEntity>,
    private readonly roomTypeService: RoomTypeService,
    private readonly priceService: CalendarPriceService,
    private readonly stockService: CalendarStockService,
  ) { }

  private resolveRange(startDate?: string, endDate?: string) {
    const start = startDate ? assertDate(startDate, 'startDate') : getBusinessToday();
    const end = endDate ? assertDate(endDate, 'endDate') : addDays(start, DEFAULT_CALENDAR_DAYS - 1);

    if (end < start) {
      throw new BadRequestException('endDate 不能早于 startDate');
    }

    const rangeDays = countDaysInclusive(start, end);
    if (rangeDays > MAX_CALENDAR_DAYS) {
      throw new BadRequestException(`日期范围不能超过 ${MAX_CALENDAR_DAYS} 天`);
    }

    return { start, end };
  }

  async getHotelMinPriceCalendar(
    hotelId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HotelMinPriceCalendar> {
    const { start, end } = this.resolveRange(startDate, endDate);
    const hotel = await this.hotelRepo.findOne({
      where: { id: hotelId, status: HotelStatus.PUBLISHED },
      relations: ['roomTypes'],
    });

    if (!hotel) {
      throw new NotFoundException('酒店不存在或未发布');
    }

    const dateList = enumerateDates(start, end);
    const roomTypes = (hotel.roomTypes || []).filter((room) => Number(room.isOnSale) === 1);
    const roomCalendars = await Promise.all(
      roomTypes.map(async (room) => {
        const [prices, stocks] = await Promise.all([
          this.priceService.list(room.id, start, end),
          this.stockService.list(room.id, start, end),
        ]);

        return {
          room,
          priceMap: new Map(prices.map((item) => [item.date, Number(item.price)])),
          stockMap: new Map(stocks.map((item) => [item.date, Number(item.stock)])),
        };
      }),
    );

    const days = dateList.map((date) => {
      let minPrice: number | null = null;
      let minPriceStock: number | null = 0;

      for (const { room, priceMap, stockMap } of roomCalendars) {
        const stock = stockMap.has(date)
          ? stockMap.get(date)!
          : room.stock == null
            ? null
            : Number(room.stock);

        if (stock !== null && stock <= 0) {
          continue;
        }

        const price = priceMap.has(date) ? priceMap.get(date)! : Number(room.basePrice);
        if (!Number.isFinite(price) || price < 0) {
          continue;
        }

        if (minPrice === null || price < minPrice) {
          minPrice = price;
          minPriceStock = stock;
          continue;
        }

        if (price === minPrice) {
          minPriceStock = minPriceStock === null || stock === null ? null : minPriceStock + stock;
        }
      }

      return {
        date,
        price: minPrice,
        available: minPrice !== null,
        stock: minPrice === null ? 0 : minPriceStock,
      };
    });

    return { hotelId, days };
  }

  /**
   * 获取房型某日期范围内的可售日历：优先取日历覆盖，否则回退到房型 basePrice/stock。
   */
  async getRoomTypeCalendar(roomTypeId: string, startDate: string, endDate: string): Promise<RoomTypeCalendar> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);

    const [prices, stocks] = await Promise.all([
      this.priceService.list(roomTypeId, startDate, endDate),
      this.stockService.list(roomTypeId, startDate, endDate),
    ]);

    const priceMap = new Map(prices.map((p) => [p.date, Number(p.price)]));
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
  // async checkAvailability(roomTypeId: string, checkIn: string, checkOut: string): Promise<boolean> {
  //   const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
  //   if (!roomType) return false;

  //   // 计算住宿天数（入住日到离店日前一天）
  //   // 例如：2025-01-01 入住，2025-01-03 离店，住 2 晚（1月1日、1月2日）
  //   const nights: string[] = [];
  //   let d = new Date(checkIn + 'T00:00:00.000Z');
  //   const endD = new Date(checkOut + 'T00:00:00.000Z');
  //   while (d < endD) {
  //     nights.push(d.toISOString().slice(0, 10));
  //     d = new Date(d.getTime() + 24 * 3600 * 1000);
  //   }

  //   if (nights.length === 0) return false;

  //   // 查询这些日期的日历库存
  //   const stocks = await this.stockService.list(roomTypeId, nights[0], nights[nights.length - 1]);
  //   const stockMap = new Map(stocks.map((s) => [s.date, s.stock]));

  //   // 检查每一晚：优先用日历库存，否则用房型基础库存
  //   for (const night of nights) {
  //     if (stockMap.has(night)) {
  //       const stock = stockMap.get(night)!;
  //       if (stock <= 0) return false;
  //       continue;
  //     }

  //     // 未设置日历库存，回退到基础库存；若基础库存为空则视为可订
  //     if (roomType.stock == null) continue;
  //     if (roomType.stock <= 0) return false;
  //   }

  //   return true;
  // }

  // CalendarService
async checkAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  baseStock?: number | null // 新增：可从外部直接传入基础库存
): Promise<boolean> {
  // 1. 优先使用传入的 baseStock，未传则查询数据库兜底
  let defaultStock = baseStock;
  if (defaultStock === undefined) {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
    if (!roomType) return false;
    defaultStock = roomType.stock;
  }

  // 2. 修复时区/夏令时 Bug，使用纯 UTC 日期推算
  const nights: string[] = [];
  const d = new Date(`${checkIn}T00:00:00.000Z`);
  const endD = new Date(`${checkOut}T00:00:00.000Z`);
  while (d < endD) {
    nights.push(d.toISOString().split('T')[0]);
    d.setUTCDate(d.getUTCDate() + 1);
  }

  if (nights.length === 0) return false;

  // 3. 查询这段时间的日历库存
  const stocks = await this.stockService.list(roomTypeId, nights[0], nights[nights.length - 1]);
  const stockMap = new Map(stocks.map((s) => [s.date, s.stock]));

  // 4. 原汁原味的严谨业务逻辑校验
  for (const night of nights) {
    if (stockMap.has(night)) {
      const stock = stockMap.get(night)!;
      if (stock <= 0) return false;
      continue;
    }
    if (defaultStock == null) continue;
    if (defaultStock <= 0) return false;
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
