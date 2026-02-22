import { gql } from '@apollo/client';

export const ADMIN_DASHBOARD_STATS = gql`
  query AdminDashboardStats($topN: Int!) {
    adminDashboardStats(topN: $topN) {
      totalRevenue
      hotelCount
      newHotelCount
      pendingHotelCount
      newHotels {
        hotelId
        hotelName
        merchantName
        createdDate
      }
      dailyNewHotels {
        date
        count
      }
    }
  }
`;
