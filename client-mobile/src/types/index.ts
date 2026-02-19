// 房间接口
export interface hotelRooms {
  name: string;
  price: number;
  image?: string;
  description?: string;
}

// 基础坐标接口
export interface ICoordinate {
  latitude: number;
  longitude: number;
}

// 筛选条件接口
export interface IFilterState {
  keyword:string;
  minRating: number | null;
  maxPriceLevel : number | null;
  selectedTags: string[];
}

// 酒店数据接口
export interface IHotel {
  id: string;
  name: {
    zh: string; // 中文名
    en: string; // 英文名
  };
  city: string; // 所属城市
  location: ICoordinate; // 经纬度
  coverImage: string; // 对应 public 目录下的路径，例如 "/images/r1.jpg"
  albumImages?: string[];
  address: string;
  rating: number; // 0 - 5
  tags: string[]; // ["亲子", "免费停车", "豪华"...]
  priceLevel: 1 | 2 | 3 | 4 | 5; // 价格等级，越多越贵
  description: string;
  reviewCount:number; // 评分人数
  favoriteCount:number;  // 收藏人数
  lowestPrice:number; // 最低房间价格
  signatureRooms: hotelRooms[]; // 特色房间列表
  nearbyLabel?:string;// '距天安门广场 500m'
  commentLabel?:string; // '超棒'，'推荐'
  rankLabel?:string;  // '北京景观餐厅榜 No.1'
  distance?:number; // 距离用户的距离（km）
}

// 用户当前的预订搜索条件（状态）
export interface IBookingState {
  city: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  guestCount: number; // 预订人数
  userLocation: ICoordinate | null;
  selectedHotelId: string | null; // 用户当前选中的酒店ID
}