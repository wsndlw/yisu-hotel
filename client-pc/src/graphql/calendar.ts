import { gql } from '@apollo/client';

export const ROOMTYPE_CALENDAR = gql`
  query RoomTypeCalendar($roomTypeId: ID!, $startDate: String!, $endDate: String!) {
    roomTypeCalendar(roomTypeId: $roomTypeId, startDate: $startDate, endDate: $endDate) {
      roomTypeId
      days {
        date
        price
        stock
      }
    }
  }
`;

export const MERCHANT_ROOMTYPE_CALENDAR = gql`
  query MerchantRoomTypeCalendar($input: CalendarRangeQueryInput!) {
    merchantRoomTypeCalendar(input: $input) {
      roomTypeId
      days {
        date
        price
        stock
      }
    }
  }
`;

export const BATCH_SET_CALENDAR_PRICE = gql`
  mutation BatchSetRoomTypePrice($input: CalendarPriceBatchSetInput!) {
    batchSetRoomTypePrice(input: $input) {
      code
      message
    }
  }
`;

export const CLEAR_CALENDAR_PRICE = gql`
  mutation ClearRoomTypePrice($input: CalendarClearRangeInput!) {
    clearRoomTypePrice(input: $input) {
      code
      message
    }
  }
`;

export const BATCH_SET_CALENDAR_STOCK = gql`
  mutation BatchSetRoomTypeStock($input: CalendarStockBatchSetInput!) {
    batchSetRoomTypeStock(input: $input) {
      code
      message
    }
  }
`;

export const CLEAR_CALENDAR_STOCK = gql`
  mutation ClearRoomTypeStock($input: CalendarClearRangeInput!) {
    clearRoomTypeStock(input: $input) {
      code
      message
    }
  }
`;
