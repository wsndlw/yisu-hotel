import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarStockEntity } from './models/calendar-stock.entity';
import { CalendarStockService } from './calendarStock.service';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarStockEntity])],
  providers: [CalendarStockService],
  exports: [CalendarStockService, TypeOrmModule],
})
export class CalendarStockModule {}
