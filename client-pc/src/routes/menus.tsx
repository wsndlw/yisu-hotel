import {
  DashboardOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  PictureOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  FundOutlined
} from '@ant-design/icons';

export interface IRoute {
  path: string;
  name: string;
  icon?: React.ReactNode;
  hideInMenu?: boolean;
}

export const ROUTE_KEY = {
  MERCHANT_MONITOR: 'merchant_monitor',
  MERCHANT_HOTELS: 'merchant_hotels',
  MERCHANT_HOTEL_CREATE: 'merchant_hotel_create',
  MERCHANT_HOTEL_EDIT: 'merchant_hotel_edit',
  MERCHANT_ROOM_OPERATIONS: 'merchant_room_operations',
  PROFILE: 'profile',
  ADMIN_DASHBOARD: 'admin_dashboard',
  ADMIN_HOTELS: 'admin_hotels',
  ADMIN_BANNERS: 'admin_banners',
  ADMIN_AUDIT_RECORDS: 'admin_audit_records',
  ADMIN_FACILITIES: 'admin_facilities',
} as const;

export const ROUTE_CONFIG: Record<string, IRoute> = {
  [ROUTE_KEY.MERCHANT_MONITOR]: {
    path: 'merchant/monitor',
    name: '经营监控',
    icon: <FundOutlined />,
  },
  [ROUTE_KEY.MERCHANT_HOTELS]: {
    path: 'merchant/hotels',
    name: '我的酒店',
    icon: <ShopOutlined />,
  },
  [ROUTE_KEY.MERCHANT_HOTEL_CREATE]: {
    path: 'merchant/hotels/new',
    name: '新建酒店',
    hideInMenu: true,
  },
  [ROUTE_KEY.MERCHANT_HOTEL_EDIT]: {
    path: 'merchant/hotels/:id',
    name: '编辑酒店',
    hideInMenu: true,
  },
  [ROUTE_KEY.MERCHANT_ROOM_OPERATIONS]: {
    path: 'merchant/hotels/:hotelId/room-operations',
    name: '房态管理',
    hideInMenu: true,
  },
  [ROUTE_KEY.PROFILE]: {
    path: 'profile',
    name: '个人中心',
    hideInMenu: true,
  },
  [ROUTE_KEY.ADMIN_DASHBOARD]: {
    path: 'admin/dashboard',
    name: '平台仪表盘',
    icon: <DashboardOutlined />,
  },
  [ROUTE_KEY.ADMIN_HOTELS]: {
    path: 'admin/hotels',
    name: '酒店审核/发布',
    icon: <SafetyCertificateOutlined />,
  },
  [ROUTE_KEY.ADMIN_BANNERS]: {
    path: 'admin/banners',
    name: '首页轮播图',
    icon: <PictureOutlined />,
  },
  [ROUTE_KEY.ADMIN_AUDIT_RECORDS]: {
    path: 'admin/audit-records',
    name: '审核记录',
    icon: <HistoryOutlined />,
  },
  [ROUTE_KEY.ADMIN_FACILITIES]: {
    path: 'admin/meta',
    name: '设施管理',
    icon: <AppstoreOutlined />,
  },

};

export const routes = Object.keys(ROUTE_CONFIG).map((key) => ({ ...ROUTE_CONFIG[key], key }));
export const getRouteByKey = (key: string) => ROUTE_CONFIG[key];
