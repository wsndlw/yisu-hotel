import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BannerModule } from './modules/banner/banner.module';
import { OssModule } from './modules/oss/oss.module';
import { FacilityModule } from './modules/facility/facility.module';
import { AuditModule } from './modules/audit-record/audit.module';
import { RoomTypeModule } from './modules/roomType/roomType.module';
import { HotelImageModule } from './modules/hotelImage/hotelImage.module';
import { HotelModule } from './modules/hotel/hotel.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { PoiModule } from './modules/poi/poi.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "123456",
      database: "yisu_hotel",
      entities: [`${__dirname}/modules/**/*.entity{.ts,.js}`],
      logging: true,
      synchronize: true,
      autoLoadEntities: true,
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      context: ({ req }: { req: any }) => ({ req }),
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
})
export class AppModule {}
