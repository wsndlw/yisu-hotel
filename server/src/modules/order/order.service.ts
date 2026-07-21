import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CalendarPriceEntity } from '../calendarPrice/models/calendar-price.entity';
import { CalendarStockEntity } from '../calendarStock/models/calendar-stock.entity';
import { HotelEntity, HotelStatus } from '../hotel/models/hotel.entity';
import { RoomTypeEntity } from '../roomType/models/room-type.entity';
import { UserEntity, UserRole } from '../user/models/user.entity';
import { CreateOrderInput, OrderPaginationInput } from './dto/order.input';
import { OrderEntity, OrderStatus } from './models/order.entity';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function enumerateNights(checkIn: string, checkOut: string): string[] {
  if (!DATE_PATTERN.test(checkIn) || !DATE_PATTERN.test(checkOut)) {
    throw new BadRequestException('入住和离店日期格式必须为 YYYY-MM-DD');
  }

  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== checkIn ||
    end.toISOString().slice(0, 10) !== checkOut ||
    end <= start
  ) {
    throw new BadRequestException('离店日期必须晚于入住日期');
  }

  const nights: string[] = [];
  for (let timestamp = start.getTime(); timestamp < end.getTime(); timestamp += DAY_MS) {
    nights.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return nights;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async createOrder(user: UserEntity, input: CreateOrderInput): Promise<OrderEntity> {
    this.assertCustomer(user);
    this.validateCreateInput(input);
    const nights = enumerateNights(input.checkIn, input.checkOut);

    return this.dataSource.transaction(async (manager) => {
      // 锁定房型可串行化同一房型的库存检查和扣减，防止并发超卖。
      const roomType = await manager.findOne(RoomTypeEntity, {
        where: { id: input.roomTypeId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!roomType || roomType.hotelId !== input.hotelId) {
        throw new NotFoundException('酒店或房型不存在');
      }
      if (roomType.isOnSale !== true) throw new BadRequestException('该房型当前不可预订');
      if (roomType.maxGuests != null && input.guestCount > roomType.maxGuests) {
        throw new BadRequestException('入住人数超过房型可住人数');
      }

      const hotel = await manager.findOne(HotelEntity, { where: { id: input.hotelId } });
      if (!hotel) throw new NotFoundException('酒店不存在');
      if (hotel.status !== HotelStatus.PUBLISHED) throw new BadRequestException('该酒店当前不可预订');

      const stockRows = await manager.find(CalendarStockEntity, {
        where: { roomTypeId: roomType.id, date: In(nights) },
        lock: { mode: 'pessimistic_write' },
      });
      const priceRows = await manager.find(CalendarPriceEntity, {
        where: { roomTypeId: roomType.id, date: In(nights) },
      });

      const inventoryDates = await this.deductInventory(manager, roomType, nights, stockRows);

      const priceByDate = new Map(priceRows.map((row) => [row.date, Number(row.price)]));
      const totalAmount = nights.reduce(
        (sum, date) => sum + (priceByDate.get(date) ?? Number(roomType.basePrice)),
        0,
      );
      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        throw new BadRequestException('订单价格计算失败');
      }

      const order = manager.create(OrderEntity, {
        userId: user.id,
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        hotelName: hotel.nameZh,
        roomTypeName: roomType.name,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guestCount: input.guestCount,
        guestName: input.guestName.trim(),
        guestPhone: input.guestPhone.trim(),
        totalAmount,
        inventoryDates,
        status: OrderStatus.PENDING,
      });
      return manager.save(order);
    });
  }

  async cancelOrder(user: UserEntity, id: string): Promise<OrderEntity> {
    this.assertCustomer(user);

    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('订单不存在');
      if (order.userId !== user.id) throw new ForbiddenException('无权操作该订单');
      if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status)) {
        throw new BadRequestException('当前订单状态不可取消');
      }

      const nights = order.inventoryDates ?? [];
      const stockRows = nights.length
        ? await manager.find(CalendarStockEntity, {
            where: { roomTypeId: order.roomTypeId, date: In(nights) },
            lock: { mode: 'pessimistic_write' },
          })
        : [];
      for (const row of stockRows) row.stock += 1;
      if (stockRows.length > 0) await manager.save(stockRows);

      order.status = OrderStatus.CANCELLED;
      return manager.save(order);
    });
  }

  async myOrders(user: UserEntity, pagination?: OrderPaginationInput) {
    this.assertCustomer(user);
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    if (!Number.isInteger(page) || page < 1) throw new BadRequestException('页码必须为正整数');
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('每页数量必须为 1 到 100 的整数');
    }
    const [items, total] = await this.orderRepo.findAndCount({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async getOrder(user: UserEntity, id: string): Promise<OrderEntity> {
    this.assertCustomer(user);
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== user.id) throw new ForbiddenException('无权查看该订单');
    return order;
  }

  private assertCustomer(user: UserEntity) {
    if (!user?.id) throw new ForbiddenException('请先登录');
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException('仅消费者可操作订单');
  }

  private validateCreateInput(input: CreateOrderInput) {
    if (!input.hotelId?.trim() || !input.roomTypeId?.trim()) {
      throw new BadRequestException('酒店和房型不能为空');
    }
    if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 20) {
      throw new BadRequestException('入住人数必须为 1 到 20 的整数');
    }
    if (!input.guestName?.trim() || input.guestName.trim().length > 64) {
      throw new BadRequestException('请输入有效的入住人姓名');
    }
    if (!/^\+?[0-9][0-9\s-]{5,30}$/.test(input.guestPhone?.trim() ?? '')) {
      throw new BadRequestException('请输入有效的入住人手机号');
    }
  }

  private async deductInventory(
    manager: EntityManager,
    roomType: RoomTypeEntity,
    nights: string[],
    stockRows: CalendarStockEntity[],
  ): Promise<string[]> {
    const stockByDate = new Map(stockRows.map((row) => [row.date, row]));
    const rowsToSave: CalendarStockEntity[] = [];
    const inventoryDates: string[] = [];

    for (const date of nights) {
      const existing = stockByDate.get(date);
      if (existing) {
        if (existing.stock <= 0) throw new BadRequestException(`${date} 库存不足`);
        existing.stock -= 1;
        rowsToSave.push(existing);
        inventoryDates.push(date);
        continue;
      }

      // 基础库存为空沿用现有语义：不限库存；有值时落一条按天库存快照。
      if (roomType.stock == null) continue;
      if (roomType.stock <= 0) throw new BadRequestException(`${date} 库存不足`);
      rowsToSave.push(
        manager.create(CalendarStockEntity, {
          roomTypeId: roomType.id,
          date,
          stock: roomType.stock - 1,
        }),
      );
      inventoryDates.push(date);
    }

    if (rowsToSave.length > 0) await manager.save(rowsToSave);
    return inventoryDates;
  }
}
