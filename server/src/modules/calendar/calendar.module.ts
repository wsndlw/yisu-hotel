import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarResolver } from './calendar.resolver';
import { CalendarService } from './calendar.service';
import { CalendarPriceEntity } from '../calendarPrice/models/calendar-price.entity';
import { CalendarStockEntity } from '../calendarStock/models/calendar-stock.entity';
import { CalendarPriceService } from '../calendarPrice/calendarPrice.service';
import { CalendarStockService } from '../calendarStock/calendarStock.service';
import { RoomTypeModule } from '../roomType/roomType.module';
import { HotelModule } from '../hotel/hotel.module';
import { HotelEntity } from '../hotel/models/hotel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarPriceEntity, CalendarStockEntity, HotelEntity]),
    RoomTypeModule,
    forwardRef(() => HotelModule),
  ],
  providers: [
    CalendarResolver,
    CalendarService,
    CalendarPriceService,
    CalendarStockService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
