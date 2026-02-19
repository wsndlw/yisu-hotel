import { gql } from '@apollo/client';

export const HOTELS = gql`
  query Hotels($input: HotelListInput!) {
    hotels(input: $input) {
      code
      message
      data {
        id
        hotelID
        nameZh
        city
        starLevel
        miniPrice
        favoriteCount
        status
        rejectReason
        updatedAt
        merchant {
          id
          username
        }
      }
      page {
        total
        pageNum
        pageSize
      }
    }
  }
`;

export const MY_HOTELS = gql`
  query MyHotels($status: HotelStatus) {
    myHotels(status: $status) {
      code
      message
      data {
        id
        nameZh
        city
        starLevel
        miniPrice
        favoriteCount
        status
        rejectReason
        updatedAt
      }
    }
  }
`;

export const HOTEL = gql`
  query Hotel($id: ID!) {
    hotel(id: $id) {
      code
      message
      data {
        id
        nameZh
        nameEn
        address
        latitude
        longitude
        city
        favoriteCount
        miniPrice
        starLevel
        openSince
        tags { id name }
        facilities { id name }
        nearby
        discountInfo
        status
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
        images {
          id
          url
          sortOrder
        }
      }
    }
  }
`;

export const CREATE_HOTEL = gql`
  mutation CreateHotel($input: HotelUpsertInput!) {
    createHotel(input: $input) {
      code
      message
      data {
        id
      }
    }
  }
`;

export const UPDATE_HOTEL = gql`
  mutation UpdateHotel($id: ID!, $input: HotelUpsertInput!) {
    updateHotel(id: $id, input: $input) {
      code
      message
      data {
        id
        updatedAt
      }
    }
  }
`;

export const DELETE_HOTEL = gql`
  mutation DeleteHotel($id: ID!) {
    deleteHotel(id: $id) {
      code
      message
    }
  }
`;

export const SUBMIT_HOTEL = gql`
  mutation SubmitHotel($id: ID!) {
    submitHotelForReview(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;

export const WITHDRAW_HOTEL = gql`
  mutation WithdrawHotel($id: ID!) {
    withdrawHotel(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;

export const REQUEST_OFFLINE = gql`
  mutation RequestOffline($id: ID!) {
    requestOffline(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;

export const SET_HOTEL_IMAGES = gql`
  mutation SetHotelImages($input: SetHotelImagesInput!) {
    setHotelImages(input: $input) {
      code
      message
      data {
        id
        images {
          id
          url
          sortOrder
        }
      }
    }
  }
`;

export const APPROVE_HOTEL = gql`
  mutation Approve($id: ID!) {
    approveHotel(id: $id) {
      code
      message
      data {
        id
      }
    }
  }
`;

export const REJECT_HOTEL = gql`
  mutation Reject($id: ID!, $reason: String!) {
    rejectHotel(id: $id, reason: $reason) {
      code
      message
      data {
        id
        status
        rejectReason
      }
    }
  }
`;

export const PUBLISH_HOTEL = gql`
  mutation Publish($id: ID!) {
    publishHotel(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;

export const OFFLINE_HOTEL = gql`
  mutation Offline($id: ID!) {
    offlineHotel(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;

export const RESTORE_HOTEL = gql`
  mutation Restore($id: ID!) {
    restoreHotel(id: $id) {
      code
      message
      data {
        id
        status
      }
    }
  }
`;
