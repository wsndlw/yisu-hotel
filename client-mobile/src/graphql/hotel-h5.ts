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
        tags {
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
  query GetHotelDetail($id: ID!) {
    hotelDetail(id: $id) {
      code
      message
      data {
        id
        name
        address
        description
        images
        facilities
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
