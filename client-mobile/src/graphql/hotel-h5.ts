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
// export const SEARCH_HOTELS = gql`
//   query SearchHotels($input: SearchHotelInput!) {
//     searchHotels(input: $input) {
//       code
//       message
//       data {
//         items {
//           id
//           hotelNo
//           name
//           coverImage
//           favoriteCount
//           score
//           minPrice
//           distance
//           distanceText
//           address
//           latitude
//           longitude
//           roomType {
//             id
//             name
//             bedType
//             basePrice
//             maxGuests
//             hasBreakfast
//             refundable
//             hasWindow
//             area
//             floor
//             isOnSale
//             sortOrder
//             stock
//             images
//           }
//         }
//         minPrice
//         total
//         page {
//           total
//           pageNum
//           pageSize
//         }
//       }
//     }
//   }
// `;

export const SEARCH_HOTELS = gql`
  query SearchHotels($input: SearchHotelInput!) {
    searchHotels(input: $input) {
      code
      message
      data {
        total
        # ❌ 之前报错是因为这里写了 minPrice 和 page，删掉它们！
        
        items {
          id
          name
          address
          score
          starLevel
          favoriteCount
          
          # ✅ 修正 1: 价格必须在 items 里面
          minPrice
          
          # ✅ 修正 2: 位置描述
          distanceText

          # ✅ 修正 3: 图片是数组，不是 coverImage
          images {
            url
          }

          # ✅ 修正 4: 房型信息
          roomType {
            hasBreakfast
            refundable
            hasWindow
          }
        }
      }
    }
  }
`;

/**
 * 酒店详情 + 房型列表（按价格升序）
 */
export const GET_HOTEL_DETAIL = gql`
  query GetHotelDetail($id: String!, $checkIn: String, $checkOut: String) {
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
        }
        rooms {
          id
          title
          price
          bedType
          area
          hasBreakfast
          refundable
          hasWindow
          coverImage
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
