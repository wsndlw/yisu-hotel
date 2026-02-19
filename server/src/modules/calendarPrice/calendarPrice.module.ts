import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarPriceEntity } from './models/calendar-price.entity';
import { CalendarPriceService } from './calendarPrice.service';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarPriceEntity])],
  providers: [CalendarPriceService],
  exports: [CalendarPriceService, TypeOrmModule],
})
export class CalendarPriceModule {}
