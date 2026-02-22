import { gql } from '@apollo/client';

/**
 * 移动端酒店相关 GraphQL 查询（新版）
 *
 * 对应后端 MobileHotelResolver：
 * - homeConfig
 * - searchHotels
 * - hotelDetail
 */

/**
 * 首页聚合数据：Banner + 城市 + 快捷标签
 */
export const GET_HOME_CONFIG = gql`
  query GetHomeConfig {
    homeConfig {
      code
      message
      data {
        banners {
          id
          imageUrl
          redirectHotelId
        }
        cities {
          code
          name
        }
        facilities {
          id
          name
        }
      }
    }
  }
`;

/**
 * 酒店搜索（支持筛选/排序/分页）
 */
export const SEARCH_HOTELS = gql`
  query SearchHotels($input: SearchHotelInput!) {
    searchHotels(input: $input) {
      code
      message
      data {
        items {
          id
          hotelNo
          name
          coverImage
          favoriteCount
          score
          minPrice
          distance
          distanceText
          address
          latitude
          longitude
          roomType {
            id
            name
            bedType
            basePrice
            maxGuests
            hasBreakfast
            refundable
            hasWindow
            area
            floor
            isOnSale
            sortOrder
            stock
            images
          }
        }
        minPrice
        total
        page {
          total
          pageNum
          pageSize
        }
      }
    }
  }
`;

/**
 * 酒店详情 + 房型列表（按价格升序）
 */
export const GET_HOTEL_DETAIL = gql`
  query GetHotelDetail($id: ID!, $checkIn: String, $checkOut: String) {
    hotelDetail(id: $id, checkIn: $checkIn, checkOut: $checkOut) {
      code
      message
      data {
        id
        name
        address
        description
        favoriteCount
        images
        facilities
        nearbyPoi {
          id
          name
          type
          address
          latitude
          longitude
          distanceKm
          baseScore
          city
        }
        rooms {
          id
          title
          coverImage
          hasBreakfast
          refundable
          area
          hasWindow
          price
          stock
          bedType
        }
      }
    }
  }
`;

export const POI_LIST = gql`
  query PoiList($input: PoiListQueryInput!) {
    poiList(input: $input) {
      id
      name
      type
      address
      latitude
      longitude
      baseScore
      city
    }
  }
`;

export const HOTEL_MIN_PRICE_CALENDAR = gql`
  query HotelMinPriceCalendar($hotelId: ID!, $startDate: String, $endDate: String) {
    hotelMinPriceCalendar(hotelId: $hotelId, startDate: $startDate, endDate: $endDate) {
      hotelId
      days {
        date
        price
      }
    }
  }
`;
