import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditRecordEntity, HotelAuditAction } from './models/audit-record.entity';
import { AuditRecordQueryInput } from './dto/audit.input';
import { AuditRecordListResult, AuditRecordView } from './dto/audit.type';
import { HotelService } from '../hotel/hotel.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditRecordEntity)
    private readonly repo: Repository<AuditRecordEntity>,
    @Inject(forwardRef(() => HotelService))
    private readonly hotelService: HotelService,
    private readonly userService: UserService,
  ) {}

  async addRecord(params: {
    hotelId: string;
    action: HotelAuditAction;
    operatorId?: string | null;
    reason?: string | null;
  }) {
    const record = this.repo.create(params);
    return this.repo.save(record);
  }

  async deleteByHotelId(hotelId: string) {
    await this.repo.delete({ hotelId });
  }

  async listRecords(input: AuditRecordQueryInput): Promise<AuditRecordListResult> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;

    const where: any = {};
    if (input.hotelId) where.hotelId = input.hotelId;
    if (input.action) where.action = input.action;
    if (input.operatorId) where.operatorId = input.operatorId;

    if (input.startDate && input.endDate) {
      const start = new Date(`${input.startDate}T00:00:00.000Z`);
      const end = new Date(`${input.endDate}T23:59:59.999Z`);
      where.createdAt = Between(start, end);
    }

    const [list, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const hotelIds = Array.from(new Set(list.map((r) => r.hotelId)));
    const operatorIds = Array.from(new Set(list.map((r) => r.operatorId).filter(Boolean))) as string[];

    const hotels = await Promise.all(hotelIds.map((id) => this.hotelService.getHotelById(id)));
    const hotelMap = new Map(hotels.map((h) => [h.id, h.nameZh]));

    const operators = await Promise.all(operatorIds.map((id) => this.userService.findById(id)));
    const operatorMap = new Map(operators.filter(Boolean).map((u) => [u!.id, u!.username]));

    const items: AuditRecordView[] = list.map((r) => ({
      ...r,
      hotelName: hotelMap.get(r.hotelId) ?? null,
      operatorName: r.operatorId ? operatorMap.get(r.operatorId) ?? null : null,
    }));

    return { items, total };
  }
}
