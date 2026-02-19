import { gql } from '@apollo/client';

export const UPSERT_ROOM_TYPE = gql`
  mutation UpsertRoomType($hotelId: ID!, $roomTypeId: ID, $input: RoomTypeUpsertInput!) {
    upsertRoomType(hotelId: $hotelId, roomTypeId: $roomTypeId, input: $input) {
      code
      message
      data {
        id
        roomTypes {
          id
          name
          basePrice
          maxGuests
          bedType
          stock
          images
          isOnSale
          hasBreakfast
          refundable
          area
          floor
          hasWindow
          sortOrder
        }
      }
    }
  }
`;

export const DELETE_ROOM_TYPE = gql`
  mutation DeleteRoomType($roomTypeId: ID!) {
    deleteRoomType(roomTypeId: $roomTypeId) {
      code
      message
    }
  }
`;

export const UPDATE_ROOM_OPS = gql`
  mutation UpdateRoomOps($roomTypeId: ID!, $input: RoomTypeOpsInput!) {
    updateRoomOps(roomTypeId: $roomTypeId, input: $input) {
      code
      message
    }
  }
`;
