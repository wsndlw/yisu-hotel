import Monitor from '../containers/merchant/Monitor';
import MerchantHotels from '../containers/merchant/Hotels';
import RoomOperations from '../containers/merchant/RoomOperations';
import Dashboard from '../containers/acmin/Dashboard';
import AdminHotels from '../containers/acmin/Hotels';
import Meta from '../containers/acmin/Meta';
import Banners from '../containers/acmin/Banners';
import AuditRecords from '../containers/acmin/AuditRecords';
import HotelEdit from '../containers/merchant/HotelEdit';
import { ROUTE_KEY } from './menus';

export const ROUTE_COMPONENT: Record<string, any> = {
  [ROUTE_KEY.MERCHANT_MONITOR]: Monitor,
  [ROUTE_KEY.MERCHANT_HOTELS]: MerchantHotels,
  [ROUTE_KEY.ADMIN_DASHBOARD]: Dashboard,
  [ROUTE_KEY.ADMIN_HOTELS]: AdminHotels,
  [ROUTE_KEY.ADMIN_BANNERS]: Banners,
  [ROUTE_KEY.ADMIN_AUDIT_RECORDS]: AuditRecords,
  admin_meta: Meta,
  // 说明：编辑页不在菜单中，但仍可通过路由访问（已由路由守卫限制角色）。
};

export { HotelEdit, RoomOperations };
