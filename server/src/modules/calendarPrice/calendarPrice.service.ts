import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CalendarPriceEntity } from './models/calendar-price.entity';

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
export class CalendarPriceService {
  constructor(
    @InjectRepository(CalendarPriceEntity)
    private readonly repo: Repository<CalendarPriceEntity>,
  ) {}

  async list(roomTypeId: string, startDate: string, endDate: string) {
    return this.repo.find({
      where: { roomTypeId, date: Between(startDate, endDate) },
      order: { date: 'ASC' },
    });
  }

  async batchSet(roomTypeId: string, startDate: string, endDate: string, price: number) {
    const dates = enumerateDates(startDate, endDate);
    const rows = dates.map((date) => this.repo.create({ roomTypeId, date, price }));
    // sqlite 支持 save + unique index，会变成 insert 失败；这里用 upsert
    await this.repo.upsert(rows, ['roomTypeId', 'date']);
    return true;
  }

  async clearRange(roomTypeId: string, startDate: string, endDate: string) {
    if (endDate < startDate) throw new BadRequestException('endDate 不能早于 startDate');
    await this.repo.delete({ roomTypeId, date: Between(startDate, endDate) });
    return true;
  }
}
