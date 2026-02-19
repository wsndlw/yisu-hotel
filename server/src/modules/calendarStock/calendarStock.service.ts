import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CalendarStockEntity } from './models/calendar-stock.entity';

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

function enumerateDates(start: string, end: string): string[] {
  if (end < start) throw new BadRequestException('endDate 不能早于 startDate');
  const out: string[] = [];
  let d = new Date(start + 'T00:00:00.000Z');
  const endD = new Date(end + 'T00:00:00.000Z');
  while (d <= endD) {
    out.push(toDateStr(d));
    d = new Date(d.getTime() + 24 * 3600 * 1000);
  }
  return out;
}

@Injectable()
export class CalendarStockService {
  constructor(
    @InjectRepository(CalendarStockEntity)
    private readonly repo: Repository<CalendarStockEntity>,
  ) {}

  async list(roomTypeId: string, startDate: string, endDate: string) {
    return this.repo.find({
      where: { roomTypeId, date: Between(startDate, endDate) },
      order: { date: 'ASC' },
    });
  }

  //批量设置
  async batchSet(roomTypeId: string, startDate: string, endDate: string, stock: number) {
    const dates = enumerateDates(startDate, endDate);
    const rows = dates.map((date) => this.repo.create({ roomTypeId, date, stock }));
    await this.repo.upsert(rows, ['roomTypeId', 'date']);
    return true;
  }

  //清空
  async clearRange(roomTypeId: string, startDate: string, endDate: string) {
    if (endDate < startDate) throw new BadRequestException('endDate 不能早于 startDate');
    await this.repo.delete({ roomTypeId, date: Between(startDate, endDate) });
    return true;
  }
}
