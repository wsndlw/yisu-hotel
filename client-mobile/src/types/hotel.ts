export interface SearchHotelInput {
  cityCode: string;
  checkIn: string;
  checkOut: string;
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  starRating?: number;
  sort?: 'DEFAULT' | 'DISTANCE_ASC' | 'PRICE_ASC' | 'SCORE_DESC';
  facilityIds?: string[];
  latitude?: number;
  longitude?: number;
  distanceMax?: number;
  poiId?: string;
  bedType?: string;
  guestCount?: number;
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
  favoriteCount?: number | null;
  score?: number | null;
  minPrice?: number | null;
  distance?: number | null;
  distanceText?: string | null;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  roomType?: RoomType[] | null;
  facilities?: { id: string; name: string }[];
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

export interface NearbyPoi {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  baseScore?: number | null;
  city: string;
}

export interface HotelDetail {
  id: string;
  name: string;
  nameEn?: string | null;
  address?: string | null;
  description?: string | null;
  favoriteCount?: number | null;
  images: string[];
  facilities: string[];
  nearbyPoi?: NearbyPoi[] | null;
  rooms: Room[];
  //新增
  starLevel?: number | null; // 星级
  city?: string | null; // 城市编码
  brand?: string | null;
  score?: number | null; // 评分
  phone?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  province?: string | null;
  district?: string | null;
  commentCount?: number | null; // 评价数
}

export interface RoomType {
  id: string;
  name: string;
  bedType?: string | null;
  basePrice?: number | null;
  maxGuests?: number | null;
  hasBreakfast?: boolean | null;
  refundable?: boolean | null;
  hasWindow?: boolean | null;
  area?: number | null;
  floor?: string | null;
  isOnSale?: boolean | null;
  sortOrder?: number | null;
  stock?: number | null;
  images?: string | null;
}

export interface PoiItem {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  baseScore?: number | null;
  city: string;
  distanceKm?: number | null;
}

export interface PoiListInput {
  city: string;
  keyword?: string;
  limit?: number;
  type?: string;
}

export interface HotelMinPriceCalendarDay {
  date: string;
  price: number;
}

export interface HotelMinPriceCalendar {
  hotelId: string;
  days: HotelMinPriceCalendarDay[];
}

export interface HotelMinPriceCalendarInput {
  hotelId: string;
  startDate?: string;
  endDate?: string;
}

