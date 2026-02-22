import Monitor from '../containers/merchant/Monitor';
import MerchantHotels from '../containers/merchant/HotelList';
import Dashboard from '../containers/admin/Dashboard';
import AdminHotels from '../containers/admin/HotelList';
import Facilities from '../containers/admin/Facilities';
import Banners from '../containers/admin/Banners';
import AuditRecords from '../containers/admin/AuditRecords';
import HotelEdit from '../containers/merchant/HotelEdit';
import RoomManagement from '../containers/merchant/RoomManagement';
import Profile from '../containers/Profile';
import { ROUTE_KEY } from './menus';

export const ROUTE_COMPONENT: Record<string, any> = {
  [ROUTE_KEY.MERCHANT_MONITOR]: Monitor,
  [ROUTE_KEY.MERCHANT_HOTELS]: MerchantHotels,
  [ROUTE_KEY.ADMIN_DASHBOARD]: Dashboard,
  [ROUTE_KEY.ADMIN_HOTELS]: AdminHotels,
  [ROUTE_KEY.ADMIN_BANNERS]: Banners,
  [ROUTE_KEY.ADMIN_AUDIT_RECORDS]: AuditRecords,
  [ROUTE_KEY.ADMIN_FACILITIES]: Facilities,
  [ROUTE_KEY.MERCHANT_HOTEL_CREATE]: HotelEdit,
  [ROUTE_KEY.MERCHANT_HOTEL_EDIT]: HotelEdit,
  [ROUTE_KEY.MERCHANT_ROOM_OPERATIONS]: RoomManagement,
  [ROUTE_KEY.PROFILE]: Profile,
};
