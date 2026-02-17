import { gql } from '@apollo/client';

/**
 * 移动端首页 Banner 列表
 *
 * 对应后端 BannerResolver.bannersQuery（已在后端完成 enabled + startAt/endAt 时间窗口筛选）
 */
export const GET_BANNERS = gql`
  query GetBanners {
    bannersQuery {
      id
      imageUrl
      targetHotelId
      startAt
      endAt
      sort
    }
  }
`;
