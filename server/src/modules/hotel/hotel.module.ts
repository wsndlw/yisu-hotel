import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelEntity } from './models/hotel.entity';
import { RoomTypeModule } from '../roomType/roomType.module';
import { CalendarModule } from '../calendar/calendar.module';
import { PoiModule } from '../poi/poi.module';
import { HotelImageModule } from '../hotelImage/hotelImage.module';
import { AuditModule } from '../audit-record/audit.module';
import { HotelResolver } from './hotel.resolver';
import { HotelService } from './hotel.service';
import { StatsResolver } from './stats.resolver';
// import { HotelH5Resolver } from './hotel-h5.resolver';
import { FacilityModule } from '../facility/facility.module';
import { BannerModule } from '../banner/banner.module';
import { MobileHotelResolver } from './mobile-hotel.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HotelEntity,
    ]),
    FacilityModule, // 导入 Facility 模块
    HotelImageModule,
    forwardRef(() => RoomTypeModule),
    CalendarModule,
    forwardRef(() => PoiModule),
    forwardRef(() => AuditModule),
    BannerModule,
  ],
  providers: [
    HotelService, 
    HotelResolver, 
    StatsResolver, 
    // HotelH5Resolver,
    MobileHotelResolver,
  ],
  exports: [HotelService],
})
export class HotelModule {}
