import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { CalendarPriceEntity } from '../src/modules/calendarPrice/models/calendar-price.entity';
import { CalendarStockEntity } from '../src/modules/calendarStock/models/calendar-stock.entity';
import { FacilityEntity } from '../src/modules/facility/models/facility.entity';
import { HotelEntity, HotelStatus } from '../src/modules/hotel/models/hotel.entity';
import { HotelImageEntity } from '../src/modules/hotelImage/models/hotel-image.entity';
import { OrderModule } from '../src/modules/order/order.module';
import { OrderEntity, OrderStatus } from '../src/modules/order/models/order.entity';
import { OrderService } from '../src/modules/order/order.service';
import { RoomTypeEntity } from '../src/modules/roomType/models/room-type.entity';
import { UserEntity, UserRole } from '../src/modules/user/models/user.entity';
import { UserModule } from '../src/modules/user/user.module';

describe('Order acceptance (integration)', () => {
  jest.setTimeout(30_000);

  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authService: AuthService;
  let orderService: OrderService;
  let hotel: HotelEntity;
  let roomType: RoomTypeEntity;

  beforeAll(async () => {
    // FacilityEntity 使用 MySQL enum；仅在 SQL.js 验收进程中改为兼容映射。
    for (const column of getMetadataArgsStorage().columns) {
      if (
        column.target === FacilityEntity &&
        (column.propertyName === 'type' || column.propertyName === 'category')
      ) {
        column.options.type = 'simple-enum';
      }
    }

    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          retryAttempts: 0,
          synchronize: true,
          dropSchema: true,
          entities: [
            UserEntity,
            HotelEntity,
            RoomTypeEntity,
            HotelImageEntity,
            FacilityEntity,
            CalendarPriceEntity,
            CalendarStockEntity,
            OrderEntity,
          ],
        }),
        AuthModule,
        UserModule,
        OrderModule,
      ],
    }).compile();

    dataSource = moduleFixture.get(DataSource);
    authService = moduleFixture.get(AuthService);
    orderService = moduleFixture.get(OrderService);

    const merchant = await dataSource.getRepository(UserEntity).save({
      username: 'p4-merchant',
      passwordHash: await bcrypt.hash('merchant-pass', 4),
      role: UserRole.MERCHANT,
    });
    hotel = await dataSource.getRepository(HotelEntity).save({
      nameZh: 'P4 验收酒店',
      merchantId: merchant.id,
      status: HotelStatus.PUBLISHED,
      hasEverPublished: true,
    });
    roomType = await dataSource.getRepository(RoomTypeEntity).save({
      hotelId: hotel.id,
      name: 'P4 验收房型',
      basePrice: 200,
      maxGuests: 2,
      stock: 3,
      isOnSale: true,
      sortOrder: 0,
    });
    await dataSource.getRepository(CalendarPriceEntity).save({
      roomTypeId: roomType.id,
      date: '2026-08-01',
      price: 250,
    });
  });

  afterAll(async () => {
    await moduleFixture?.close();
  });

  it('isolates customer orders and cancels an owned order with inventory rollback', async () => {
    const registration = await authService.register({
      username: 'p4-customer',
      password: 'customer-pass',
    });
    expect(registration.user.role).toBe(UserRole.CUSTOMER);

    const login = await authService.login({
      username: 'p4-customer',
      password: 'customer-pass',
    });
    expect(login.user.role).toBe(UserRole.CUSTOMER);
    expect(login.accessToken).toEqual(expect.any(String));

    const input = {
      hotelId: hotel.id,
      roomTypeId: roomType.id,
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      guestCount: 2,
      guestName: '验收用户',
      guestPhone: '13800138000',
    };

    await expect(
      orderService.createOrder(undefined as unknown as UserEntity, input),
    ).rejects.toThrow('请先登录');

    const created = await orderService.createOrder(login.user, input);
    expect(created.status).toBe(OrderStatus.PENDING);
    // 8 月 1 日使用日历价 250，8 月 2 日回退基础价 200。
    expect(Number(created.totalAmount)).toBe(450);

    const stockAfterCreate = await dataSource.getRepository(CalendarStockEntity).find({
      where: { roomTypeId: roomType.id },
      order: { date: 'ASC' },
    });
    expect(stockAfterCreate.map(({ date, stock }) => ({ date, stock }))).toEqual([
      { date: '2026-08-01', stock: 2 },
      { date: '2026-08-02', stock: 2 },
    ]);

    const list = await orderService.myOrders(login.user);
    expect(list.total).toBe(1);
    expect(list.items[0].id).toBe(created.id);
    expect((await orderService.getOrder(login.user, created.id)).id).toBe(created.id);

    const otherCustomer = await authService.register({
      username: 'p5-other-customer',
      password: 'other-customer-pass',
    });
    const otherList = await orderService.myOrders(otherCustomer.user);
    expect(otherList.total).toBe(0);
    expect(otherList.items).toEqual([]);
    await expect(
      orderService.getOrder(otherCustomer.user, created.id),
    ).rejects.toThrow('无权查看该订单');
    await expect(
      orderService.cancelOrder(otherCustomer.user, created.id),
    ).rejects.toThrow('无权操作该订单');

    const unchangedOrder = await dataSource.getRepository(OrderEntity).findOneByOrFail({
      id: created.id,
    });
    expect(unchangedOrder.status).toBe(OrderStatus.PENDING);
    const stockAfterUnauthorizedAttempts = await dataSource
      .getRepository(CalendarStockEntity)
      .find({
        where: { roomTypeId: roomType.id },
        order: { date: 'ASC' },
      });
    expect(stockAfterUnauthorizedAttempts.map((row) => row.stock)).toEqual([2, 2]);

    const cancelled = await orderService.cancelOrder(login.user, created.id);
    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    const listAfterCancel = await orderService.myOrders(login.user);
    expect(listAfterCancel.items[0].status).toBe(OrderStatus.CANCELLED);
    const stockAfterCancel = await dataSource.getRepository(CalendarStockEntity).find({
      where: { roomTypeId: roomType.id },
      order: { date: 'ASC' },
    });
    expect(stockAfterCancel.map((row) => row.stock)).toEqual([3, 3]);

    await dataSource.getRepository(CalendarStockEntity).save({
      roomTypeId: roomType.id,
      date: '2026-08-05',
      stock: 0,
    });
    await expect(
      orderService.createOrder(login.user, {
        ...input,
        checkIn: '2026-08-04',
        checkOut: '2026-08-06',
      }),
    ).rejects.toThrow('2026-08-05 库存不足');

    expect(await dataSource.getRepository(OrderEntity).count()).toBe(1);
    const rolledBackStocks = await dataSource.getRepository(CalendarStockEntity).find({
      where: { roomTypeId: roomType.id },
      order: { date: 'ASC' },
    });
    expect(rolledBackStocks.find((row) => row.date === '2026-08-04')).toBeUndefined();
    expect(rolledBackStocks.find((row) => row.date === '2026-08-05')?.stock).toBe(0);
  });
});
