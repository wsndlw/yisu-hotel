import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../src/modules/auth/auth.module';
import { CalendarPriceEntity } from '../src/modules/calendarPrice/models/calendar-price.entity';
import { CalendarStockEntity } from '../src/modules/calendarStock/models/calendar-stock.entity';
import { FacilityEntity } from '../src/modules/facility/models/facility.entity';
import { HotelEntity, HotelStatus } from '../src/modules/hotel/models/hotel.entity';
import { HotelImageEntity } from '../src/modules/hotelImage/models/hotel-image.entity';
import { OrderModule } from '../src/modules/order/order.module';
import { OrderEntity, OrderStatus } from '../src/modules/order/models/order.entity';
import { RoomTypeEntity } from '../src/modules/roomType/models/room-type.entity';
import { UserEntity, UserRole } from '../src/modules/user/models/user.entity';
import { UserModule } from '../src/modules/user/user.module';

type GraphQLResponse<T> = {
  data?: T | null;
  errors?: Array<{ message: string; extensions?: Record<string, any> }>;
};

describe('Order GraphQL acceptance (e2e)', () => {
  jest.setTimeout(30_000);

  let app: INestApplication;
  let dataSource: DataSource;
  let endpoint: string;
  let hotel: HotelEntity;
  let roomType: RoomTypeEntity;

  const postGraphQL = async <T>(query: string, variables?: Record<string, unknown>, token?: string) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    return { status: response.status, body: (await response.json()) as GraphQLResponse<T> };
  };

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          sortSchema: true,
          context: ({ req }: { req: any }) => ({ req }),
        }),
        AuthModule,
        UserModule,
        OrderModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, forbidUnknownValues: false }));
    await app.listen(0, '127.0.0.1');
    endpoint = `${await app.getUrl()}/graphql`;
    dataSource = moduleFixture.get(DataSource);

    const merchant = await dataSource.getRepository(UserEntity).save({
      username: 'p1-merchant',
      passwordHash: await bcrypt.hash('merchant-pass', 4),
      role: UserRole.MERCHANT,
    });
    hotel = await dataSource.getRepository(HotelEntity).save({
      nameZh: 'P1 验收酒店',
      merchantId: merchant.id,
      status: HotelStatus.PUBLISHED,
      hasEverPublished: true,
    });
    roomType = await dataSource.getRepository(RoomTypeEntity).save({
      hotelId: hotel.id,
      name: 'P1 验收房型',
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
    await app?.close();
  });

  it('registers a CUSTOMER and completes create/query/cancel inventory flow', async () => {
    const register = await postGraphQL<{
      register: { data: { accessToken: string; user: { id: string; role: UserRole } } };
    }>(
      `mutation Register($input: RegisterInput!) {
        register(input: $input) { data { accessToken user { id role } } }
      }`,
      { input: { username: 'p1-customer', password: 'customer-pass' } },
    );
    expect(register.body.errors).toBeUndefined();
    expect(register.body.data?.register.data.user.role).toBe(UserRole.CUSTOMER);

    const login = await postGraphQL<{
      login: { data: { accessToken: string; user: { role: UserRole } } };
    }>(
      `mutation Login($input: LoginInput!) {
        login(input: $input) { data { accessToken user { role } } }
      }`,
      { input: { username: 'p1-customer', password: 'customer-pass' } },
    );
    expect(login.body.errors).toBeUndefined();
    expect(login.body.data?.login.data.user.role).toBe(UserRole.CUSTOMER);
    const token = login.body.data!.login.data.accessToken;

    const createMutation = `mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) { id status totalAmount hotelId roomTypeId }
    }`;
    const variables = {
      input: {
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        guestCount: 2,
        guestName: '验收用户',
        guestPhone: '13800138000',
      },
    };

    const unauthenticated = await postGraphQL<{ createOrder: OrderEntity }>(createMutation, variables);
    expect(unauthenticated.body.data).toBeNull();
    expect(unauthenticated.body.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    expect(unauthenticated.body.errors?.[0].extensions?.response?.statusCode).toBe(401);

    const created = await postGraphQL<{ createOrder: OrderEntity }>(createMutation, variables, token);
    expect(created.body.errors).toBeUndefined();
    expect(created.body.data?.createOrder.status).toBe(OrderStatus.PENDING);
    expect(Number(created.body.data?.createOrder.totalAmount)).toBe(450);
    const orderId = created.body.data!.createOrder.id;

    const stockAfterCreate = await dataSource.getRepository(CalendarStockEntity).find({
      where: { roomTypeId: roomType.id },
      order: { date: 'ASC' },
    });
    expect(stockAfterCreate.map(({ date, stock }) => ({ date, stock }))).toEqual([
      { date: '2026-08-01', stock: 2 },
      { date: '2026-08-02', stock: 2 },
    ]);

    const list = await postGraphQL<{
      myOrders: { total: number; items: Array<{ id: string; totalAmount: number }> };
    }>(`query { myOrders { total items { id totalAmount } } }`, undefined, token);
    expect(list.body.errors).toBeUndefined();
    expect(list.body.data?.myOrders.total).toBe(1);
    expect(list.body.data?.myOrders.items[0].id).toBe(orderId);

    const detail = await postGraphQL<{ order: { id: string; status: OrderStatus } }>(
      `query Order($id: ID!) { order(id: $id) { id status } }`,
      { id: orderId },
      token,
    );
    expect(detail.body.errors).toBeUndefined();
    expect(detail.body.data?.order.id).toBe(orderId);

    const cancelled = await postGraphQL<{ cancelOrder: { status: OrderStatus } }>(
      `mutation Cancel($id: ID!) { cancelOrder(id: $id) { status } }`,
      { id: orderId },
      token,
    );
    expect(cancelled.body.errors).toBeUndefined();
    expect(cancelled.body.data?.cancelOrder.status).toBe(OrderStatus.CANCELLED);

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
    const insufficient = await postGraphQL<{ createOrder: OrderEntity }>(
      createMutation,
      {
        input: {
          ...variables.input,
          checkIn: '2026-08-04',
          checkOut: '2026-08-06',
        },
      },
      token,
    );
    expect(insufficient.body.data).toBeNull();
    expect(insufficient.body.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
    expect(await dataSource.getRepository(OrderEntity).count()).toBe(1);
    const rolledBackStocks = await dataSource.getRepository(CalendarStockEntity).find({
      where: { roomTypeId: roomType.id },
      order: { date: 'ASC' },
    });
    expect(rolledBackStocks.find((row) => row.date === '2026-08-04')).toBeUndefined();
    expect(rolledBackStocks.find((row) => row.date === '2026-08-05')?.stock).toBe(0);
  });
});
