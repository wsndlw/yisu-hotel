import { DashboardOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';

export interface IRoute {
  path: string;
  name: string;
  icon?: React.ReactNode;
  hideInMenu?: boolean;
}

export const ROUTE_KEY = {
  MERCHANT_MONITOR: 'merchant_monitor',
  MERCHANT_HOTELS: 'merchant_hotels',
  MERCHANT_ROOM_OPERATIONS: 'merchant_room_operations',
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
    icon: <DashboardOutlined />,
  },
  [ROUTE_KEY.MERCHANT_HOTELS]: {
    path: 'merchant/hotels',
    name: '我的酒店',
    icon: <HomeOutlined />,
  },
  [ROUTE_KEY.ADMIN_DASHBOARD]: {
    path: 'admin/dashboard',
    name: '平台仪表盘',
    icon: <DashboardOutlined />,
  },
  [ROUTE_KEY.ADMIN_HOTELS]: {
    path: 'admin/hotels',
    name: '酒店审核/发布',
    icon: <HomeOutlined />,
  },
  [ROUTE_KEY.ADMIN_BANNERS]: {
    path: 'admin/banners',
    name: '首页轮播图',
    icon: <HomeOutlined />,
  },
  [ROUTE_KEY.ADMIN_AUDIT_RECORDS]: {
    path: 'admin/audit-records',
    name: '审核记录',
    icon: <HomeOutlined />,
  },
    [ROUTE_KEY.ADMIN_FACILITIES]: {
    path: 'admin/meta',
    name: '设施管理',
    icon: <SettingOutlined />,
  },

};

export const routes = Object.keys(ROUTE_CONFIG).map((key) => ({ ...ROUTE_CONFIG[key], key }));
export const getRouteByKey = (key: string) => ROUTE_CONFIG[key];
