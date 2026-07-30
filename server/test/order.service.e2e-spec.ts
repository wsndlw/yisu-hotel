import { CalendarPriceEntity } from "../src/modules/calendarPrice/models/calendar-price.entity";
import { CalendarStockEntity } from "../src/modules/calendarStock/models/calendar-stock.entity";
import {
  HotelEntity,
  HotelStatus,
} from "../src/modules/hotel/models/hotel.entity";
import {
  OrderEntity,
  OrderStatus,
} from "../src/modules/order/models/order.entity";
import { OrderService } from "../src/modules/order/order.service";
import { RoomTypeEntity } from "../src/modules/roomType/models/room-type.entity";
import { UserEntity, UserRole } from "../src/modules/user/models/user.entity";

describe("OrderService booking regression", () => {
  const customer = {
    id: "customer-1",
    role: UserRole.CUSTOMER,
  } as UserEntity;
  const roomType = {
    id: "room-1",
    hotelId: "hotel-1",
    name: "标准大床房",
    basePrice: 200,
    maxGuests: 2,
    stock: 3,
    isOnSale: true,
  } as RoomTypeEntity;
  const hotel = {
    id: "hotel-1",
    nameZh: "回归测试酒店",
    status: HotelStatus.PUBLISHED,
  } as HotelEntity;
  const input = {
    hotelId: hotel.id,
    roomTypeId: roomType.id,
    checkIn: "2026-08-01",
    checkOut: "2026-08-03",
    guestCount: 2,
    guestName: "测试用户",
    guestPhone: "13800138000",
  };

  function createFixture(options?: { soldOutDate?: string }) {
    const existingStocks = [
      {
        id: "stock-1",
        roomTypeId: roomType.id,
        date: "2026-08-01",
        stock: options?.soldOutDate === "2026-08-01" ? 0 : 2,
      },
      {
        id: "stock-2",
        roomTypeId: roomType.id,
        date: "2026-08-02",
        stock: options?.soldOutDate === "2026-08-02" ? 0 : 2,
      },
    ] as CalendarStockEntity[];
    const priceRows = [
      {
        id: "price-1",
        roomTypeId: roomType.id,
        date: "2026-08-01",
        price: 250,
      },
    ] as CalendarPriceEntity[];
    const savedValues: unknown[] = [];
    const manager = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === RoomTypeEntity) return { ...roomType };
        if (entity === HotelEntity) return { ...hotel };
        return null;
      }),
      find: jest.fn(async (entity: unknown) => {
        if (entity === CalendarStockEntity) return existingStocks;
        if (entity === CalendarPriceEntity) return priceRows;
        return [];
      }),
      create: jest.fn((entity: unknown, value: Record<string, unknown>) => {
        if (entity === OrderEntity) {
          return { id: "order-1", ...value };
        }
        return { ...value };
      }),
      save: jest.fn(async (value: unknown) => {
        savedValues.push(value);
        return value;
      }),
    };
    const dataSource = {
      options: { type: "sqljs" },
      transaction: jest.fn(
        async (run: (value: typeof manager) => Promise<unknown>) =>
          run(manager),
      ),
    };
    const orderRepo = {};
    const service = new OrderService(dataSource as any, orderRepo as any);

    return {
      service,
      manager,
      existingStocks,
      savedValues,
    };
  }

  it("rejects unauthenticated booking before starting a transaction", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.createOrder(undefined as unknown as UserEntity, input),
    ).rejects.toThrow("请先登录");
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });

  it("uses nightly prices, deducts every night, and stores the server amount snapshot", async () => {
    const fixture = createFixture();

    const order = await fixture.service.createOrder(customer, input);

    expect(order).toMatchObject({
      id: "order-1",
      hotelId: hotel.id,
      roomTypeId: roomType.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount,
      totalAmount: 450,
      inventoryDates: ["2026-08-01", "2026-08-02"],
      status: OrderStatus.PENDING,
    });
    expect(fixture.existingStocks.map(({ stock }) => stock)).toEqual([1, 1]);
    expect(fixture.savedValues).toHaveLength(2);
  });

  it("rejects a range containing a sold-out night without saving inventory or an order", async () => {
    const fixture = createFixture({ soldOutDate: "2026-08-02" });

    await expect(fixture.service.createOrder(customer, input)).rejects.toThrow(
      "2026-08-02 库存不足",
    );
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });

  it("rejects guest counts above the selected room capacity", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.createOrder(customer, { ...input, guestCount: 3 }),
    ).rejects.toThrow("入住人数超过房型可住人数");
    expect(fixture.manager.save).not.toHaveBeenCalled();
  });
});
