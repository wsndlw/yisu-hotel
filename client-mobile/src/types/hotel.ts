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
  maxGuests?: number | null;
}

/**
 * 房型报价方案。当前后端每个房型只返回一条报价，因此 MVP 由客户端
 * 将房型报价规范化为一条基础方案；未来接入多方案接口时可直接复用。
 */
export interface RoomRatePlan {
  id: string;
  roomTypeId: string;
  name: string;
  price: number;
  stock?: number | null;
  hasBreakfast?: boolean | null;
  refundable?: boolean | null;
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
  openSince?: string | null; // 开业时间
  district?: string | null;
  commentCount?: number | null; // 评价数
}
//
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
  /** 当晚最低可售价，单位：元；无可售房型时为 null。 */
  price: number | null;
  available: boolean;
  /** 最低价房型的合计有效库存；null 表示库存不限制或未知。 */
  stock?: number | null;
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
