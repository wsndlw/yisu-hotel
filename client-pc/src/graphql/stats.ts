import { gql } from '@apollo/client';

export const ADMIN_DASHBOARD_STATS = gql`
  query AdminDashboardStats($topN: Int!) {
    adminDashboardStats(topN: $topN) {
      totalRevenue
      hotelOrderRank {
        hotelId
        hotelName
        merchantName
        orderCount
      }
      dailyNewHotels {
        date
        count
      }
    }
  }
`;
