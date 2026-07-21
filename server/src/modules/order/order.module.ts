import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarPriceEntity } from '../calendarPrice/models/calendar-price.entity';
import { CalendarStockEntity } from '../calendarStock/models/calendar-stock.entity';
import { HotelEntity } from '../hotel/models/hotel.entity';
import { RoomTypeEntity } from '../roomType/models/room-type.entity';
import { OrderEntity } from './models/order.entity';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      HotelEntity,
      RoomTypeEntity,
      CalendarPriceEntity,
      CalendarStockEntity,
    ]),
  ],
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
