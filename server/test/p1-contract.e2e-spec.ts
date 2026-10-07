import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../src/modules/audit-record/audit.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { BannerModule } from '../src/modules/banner/banner.module';
import { CalendarModule } from '../src/modules/calendar/calendar.module';
import { FacilityModule } from '../src/modules/facility/facility.module';
import { HotelModule } from '../src/modules/hotel/hotel.module';
import { HotelImageModule } from '../src/modules/hotelImage/hotelImage.module';
import { OrderModule } from '../src/modules/order/order.module';
import { OssModule } from '../src/modules/oss/oss.module';
import { PoiModule } from '../src/modules/poi/poi.module';
import { RoomTypeModule } from '../src/modules/roomType/roomType.module';
import { UserModule } from '../src/modules/user/user.module';

type GraphqlResponse = Record<string, unknown>;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      code
      message
      data { accessToken user { id username role } }
    }
  }
`;

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;

  const source = value as Record<string, unknown>;
  if (typeof source.message === 'string' && source.extensions && source.path) {
    const extensions = source.extensions as Record<string, unknown>;
    return {
      message: source.message,
      path: source.path,
      code: extensions.code,
    };
  }

  return Object.fromEntries(
    Object.entries(source).map(([key, item]) => {
      if (key === 'accessToken') return [key, '<JWT>'];
      if (key === 'createdAt' || key === 'updatedAt') return [key, '<TIMESTAMP>'];
      return [key, normalize(item)];
    }),
  );
}

describe('P1 Node GraphQL contract baseline', () => {
  jest.setTimeout(30_000);

  let app: INestApplication;
  let graphqlUrl: string;
  let customerToken: string;
  let merchantToken: string;
  let adminToken: string;

  const graphql = async (
    query: string,
    variables: Record<string, unknown> = {},
    token?: string,
  ): Promise<GraphqlResponse> => {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    expect(response.status).toBe(200);
    return await response.json() as GraphqlResponse;
  };

  const login = async (username: string): Promise<{ response: GraphqlResponse; token: string }> => {
    const response = await graphql(LOGIN, {
      input: { username, password: 'TestOnly!2026' },
    });
    const token = (response.data as any).login.data.accessToken as string;
    return { response, token };
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'p1-contract-baseline-only-secret';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.P1_DB_HOST ?? 'localhost',
          port: Number(process.env.P1_DB_PORT ?? 3306),
          username: process.env.P1_DB_USER ?? 'root',
          password: process.env.P1_DB_PASSWORD ?? '123456',
          database: process.env.P1_DB_NAME ?? 'yisu_p1_contract_20261007',
          autoLoadEntities: true,
          synchronize: false,
          logging: false,
          timezone: 'Z',
        }),
        GraphQLModule.forRoot({
          driver: ApolloDriver,
          autoSchemaFile: true,
          sortSchema: true,
          context: ({ req }: { req: unknown }) => ({ req }),
        }),
        AuthModule,
        UserModule,
        FacilityModule,
        RoomTypeModule,
        HotelImageModule,
        HotelModule,
        BannerModule,
        OssModule,
        CalendarModule,
        PoiModule,
        AuditModule,
        OrderModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, forbidUnknownValues: false }));
    await app.listen(0, '127.0.0.1');
    graphqlUrl = `${await app.getUrl()}/graphql`;

    customerToken = (await login('fixture_customer')).token;
    merchantToken = (await login('fixture_merchant_a')).token;
    adminToken = (await login('fixture_admin')).token;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('captures authentication success and failure responses', async () => {
    const success = await login('fixture_customer');
    const failure = await graphql(LOGIN, {
      input: { username: 'missing_fixture_user', password: 'not-a-real-password' },
    });
    const unauthenticated = await graphql(`query Me { me { code message data { id } } }`);

    expect(normalize({ success: success.response, failure, unauthenticated })).toMatchSnapshot();
  });

  it('captures public home, search, detail and failure responses', async () => {
    const home = await graphql(`
      query GetHomeConfig {
        homeConfig {
          code message
          data {
            banners { id imageUrl redirectHotelId }
            cities { code name latitude longitude }
            facilities { id name }
          }
        }
      }
    `);
    const search = await graphql(`
      query SearchHotels($input: SearchHotelInput!) {
        searchHotels(input: $input) {
          code message
          data {
            total
            items { id name address score starLevel minPrice distanceText }
          }
        }
      }
    `, {
      input: {
        cityCode: '310100',
        checkIn: '2028-02-28',
        checkOut: '2028-03-02',
        sort: 'PRICE_ASC',
        pagination: { page: 1, pageSize: 10 },
      },
    });
    const detail = await graphql(`
      query GetHotelDetail($id: String!, $checkIn: String, $checkOut: String) {
        hotelDetail(id: $id, checkIn: $checkIn, checkOut: $checkOut) {
          code message
          data {
            id name address facilities images
            rooms { id title price stock }
          }
        }
      }
    `, {
      id: '10000000-0000-4000-8000-000000000001',
      checkIn: '2028-02-28',
      checkOut: '2028-03-02',
    });
    const missingDetail = await graphql(`
      query GetHotelDetail($id: String!) {
        hotelDetail(id: $id) { code message data { id } }
      }
    `, { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' });

    expect(normalize({ home, search, detail, missingDetail })).toMatchSnapshot();
  });

  it('captures merchant hotel success and role rejection responses', async () => {
    const query = `
      query MyHotels($page: Int, $pageSize: Int) {
        myHotels(page: $page, pageSize: $pageSize) {
          code message
          data { id nameZh status hasEverPublished rejectReason }
          page { total pageNum pageSize }
        }
      }
    `;
    const success = await graphql(query, { page: 1, pageSize: 10 }, merchantToken);
    const forbidden = await graphql(query, { page: 1, pageSize: 10 }, customerToken);

    expect(normalize({ success, forbidden })).toMatchSnapshot();
  });

  it('captures admin audit success and role rejection responses', async () => {
    const query = `
      query AuditRecords($input: AuditRecordQueryInput!) {
        auditRecords(input: $input) {
          total
          items { id hotelId hotelName action reason operatorId operatorName createdAt }
        }
      }
    `;
    const variables = { input: { page: 1, pageSize: 20 } };
    const success = await graphql(query, variables, adminToken);
    const forbidden = await graphql(query, variables, merchantToken);

    expect(normalize({ success, forbidden })).toMatchSnapshot();
  });

  it('captures calendar success, validation failure and role rejection responses', async () => {
    const query = `
      query MerchantRoomTypeCalendar($input: CalendarRangeQueryInput!) {
        merchantRoomTypeCalendar(input: $input) {
          roomTypeId
          days { date price stock }
        }
      }
    `;
    const validInput = {
      roomTypeId: '20000000-0000-4000-8000-000000000001',
      startDate: '2028-02-28',
      endDate: '2028-03-01',
    };
    const success = await graphql(query, { input: validInput }, merchantToken);
    const invalidRange = await graphql(query, {
      input: { ...validInput, startDate: '2028-03-02', endDate: '2028-03-01' },
    }, merchantToken);
    const forbidden = await graphql(query, { input: validInput }, customerToken);

    expect(normalize({ success, invalidRange, forbidden })).toMatchSnapshot();
  });

  it('captures order success and permission rejection responses', async () => {
    const query = `
      query MyOrders($pagination: OrderPaginationInput) {
        myOrders(pagination: $pagination) {
          total page pageSize
          items { id hotelId roomTypeId status totalAmount checkIn checkOut }
        }
      }
    `;
    const variables = { pagination: { page: 1, pageSize: 10 } };
    const success = await graphql(query, variables, customerToken);
    const forbidden = await graphql(query, variables, merchantToken);
    const unauthenticated = await graphql(query, variables);

    expect(normalize({ success, forbidden, unauthenticated })).toMatchSnapshot();
  });
});
