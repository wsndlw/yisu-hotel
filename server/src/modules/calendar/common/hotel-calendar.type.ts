import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RoomTypeCalendar } from './calendar.type';

@ObjectType({ description: '酒店日历（按房型列表）' })
export class HotelCalendar {
  @Field(() => ID)
  hotelId: string;

  @Field(() => [RoomTypeCalendar])
  roomTypeCalendars: RoomTypeCalendar[];
}
