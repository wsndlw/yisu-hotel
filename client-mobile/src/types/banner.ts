export interface Banner {
  id: string;
  imageUrl: string;
  /** 关联酒店 ID（移动端跳转使用） */
  redirectHotelId: string;
  sort: number;
}
