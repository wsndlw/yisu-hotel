export interface SearchHotelInput {
  cityCode: string;
  checkIn: string;
  checkOut: string;
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  starRating?: number;
  sort?: 'PRICE_ASC' | 'SCORE_DESC' | 'DISTANCE_ASC' | 'DEFAULT';
  facilityIds?: string[];
  latitude?: number;
  longitude?: number;
  distanceMax?: number;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export interface HotelConnection {
  items: Hotel[];
  minPrice: number;
  total: number;
  page: PageInfo;
}

export interface PageInfo {
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface Hotel {
  id: string;
  hotelNo?: string | null;
  name: string;
  coverImage?: string | null;
  score?: number | null;
  minPrice?: number | null;
  favoriteCount?: number | null;
  distance?: number | null;
  distanceText?: string | null;
  address?: string | null;
  facilities?: string[];
}

export interface Room {
  id: string;
  title: string;
  price: number;
  stock?: number | null;
  coverImage?: string | null;
  bedType?: string | null;
  hasBreakfast?: boolean | null;
  refundable?: boolean | null;
  area?: number | null;
  hasWindow?: boolean | null;
}
