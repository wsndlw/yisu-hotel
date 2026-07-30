import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalendarService } from '../src/modules/calendar/calendar.service';
import { HotelStatus } from '../src/modules/hotel/models/hotel.entity';

describe('CalendarService hotel minimum price calendar', () => {
  const hotelId = 'hotel-published';
  let hotelRepo: { findOne: jest.Mock };
  let roomTypeService: { getRoomTypeById: jest.Mock };
  let priceService: { list: jest.Mock };
  let stockService: { list: jest.Mock };
  let service: CalendarService;

  beforeEach(() => {
    hotelRepo = {
      findOne: jest.fn(),
    };
    roomTypeService = {
      getRoomTypeById: jest.fn(),
    };
    priceService = {
      list: jest.fn(),
    };
    stockService = {
      list: jest.fn(),
    };
    service = new CalendarService(hotelRepo as any, roomTypeService as any, priceService as any, stockService as any);
  });

  it('returns the minimum available price and ignores off-sale or sold-out rooms', async () => {
    hotelRepo.findOne.mockResolvedValue({
      id: hotelId,
      status: HotelStatus.PUBLISHED,
      roomTypes: [
        {
          id: 'room-a',
          basePrice: 100,
          stock: 2,
          // tinyint may be returned as numeric 1 by some TypeORM drivers.
          isOnSale: 1,
        },
        {
          id: 'room-b',
          basePrice: 120,
          stock: 1,
          isOnSale: true,
        },
        {
          id: 'room-off-sale',
          basePrice: 1,
          stock: 99,
          isOnSale: false,
        },
      ],
    });
    priceService.list.mockImplementation(async (roomTypeId: string) => {
      if (roomTypeId === 'room-a') {
        return [
          { date: '2026-08-02', price: 80 },
          { date: '2026-08-03', price: 99.5 },
        ];
      }
      if (roomTypeId === 'room-b') {
        return [
          { date: '2026-08-01', price: 90 },
          { date: '2026-08-02', price: 110 },
        ];
      }
      throw new Error('off-sale room must not be queried');
    });
    stockService.list.mockImplementation(async (roomTypeId: string) => {
      if (roomTypeId === 'room-a') {
        return [{ date: '2026-08-02', stock: 0 }];
      }
      if (roomTypeId === 'room-b') {
        return [{ date: '2026-08-03', stock: 0 }];
      }
      throw new Error('off-sale room must not be queried');
    });

    const result = await service.getHotelMinPriceCalendar(hotelId, '2026-08-01', '2026-08-03');

    expect(result).toEqual({
      hotelId,
      days: [
        { date: '2026-08-01', price: 90, available: true, stock: 1 },
        { date: '2026-08-02', price: 110, available: true, stock: 1 },
        { date: '2026-08-03', price: 99.5, available: true, stock: 2 },
      ],
    });
    expect(priceService.list).toHaveBeenCalledTimes(2);
    expect(stockService.list).toHaveBeenCalledTimes(2);
  });

  it('uses daily stock first, falls back to base stock, and never uses zero price for no room', async () => {
    hotelRepo.findOne.mockResolvedValue({
      id: hotelId,
      status: HotelStatus.PUBLISHED,
      roomTypes: [
        {
          id: 'room-a',
          basePrice: 100,
          stock: 0,
          isOnSale: true,
        },
      ],
    });
    priceService.list.mockResolvedValue([]);
    stockService.list.mockResolvedValue([{ date: '2026-08-01', stock: 1 }]);

    const result = await service.getHotelMinPriceCalendar(hotelId, '2026-08-01', '2026-08-02');

    expect(result.days).toEqual([
      { date: '2026-08-01', price: 100, available: true, stock: 1 },
      { date: '2026-08-02', price: null, available: false, stock: 0 },
    ]);
  });

  it('aggregates inventory when multiple rooms share the minimum price', async () => {
    hotelRepo.findOne.mockResolvedValue({
      id: hotelId,
      status: HotelStatus.PUBLISHED,
      roomTypes: [
        {
          id: 'room-a',
          basePrice: 100,
          stock: 2,
          isOnSale: true,
        },
        {
          id: 'room-b',
          basePrice: 100,
          stock: 3,
          isOnSale: true,
        },
      ],
    });
    priceService.list.mockResolvedValue([]);
    stockService.list.mockResolvedValue([]);

    const result = await service.getHotelMinPriceCalendar(hotelId, '2026-08-01', '2026-08-01');

    expect(result.days[0]).toEqual({
      date: '2026-08-01',
      price: 100,
      available: true,
      stock: 5,
    });
  });

  it('returns 90 calendar days by default, including unavailable days', async () => {
    hotelRepo.findOne.mockResolvedValue({
      id: hotelId,
      status: HotelStatus.PUBLISHED,
      roomTypes: [],
    });

    const result = await service.getHotelMinPriceCalendar(hotelId);

    expect(result.days).toHaveLength(90);
    expect(result.days.every((day) => day.available === false && day.price === null && day.stock === 0)).toBe(true);
  });

  it('does not expose calendars for missing or unpublished hotels', async () => {
    hotelRepo.findOne.mockResolvedValue(null);

    await expect(service.getHotelMinPriceCalendar(hotelId, '2026-08-01', '2026-08-02')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(hotelRepo.findOne).toHaveBeenCalledWith({
      where: { id: hotelId, status: HotelStatus.PUBLISHED },
      relations: ['roomTypes'],
    });
  });

  it('rejects invalid, reversed, or excessively large date ranges', async () => {
    await expect(service.getHotelMinPriceCalendar(hotelId, '2026-02-30', '2026-03-01')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.getHotelMinPriceCalendar(hotelId, '2026-08-02', '2026-08-01')).rejects.toThrow(
      'endDate 不能早于 startDate',
    );
    await expect(service.getHotelMinPriceCalendar(hotelId, '2026-01-01', '2027-01-02')).rejects.toThrow(
      '日期范围不能超过 366 天',
    );
    expect(hotelRepo.findOne).not.toHaveBeenCalled();
  });
});
