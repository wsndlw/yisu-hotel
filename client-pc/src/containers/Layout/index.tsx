import { useState, useEffect } from 'react';
import { ProLayout, type MenuDataItem } from '@ant-design/pro-components';

import styles from './index.module.css';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Avatar, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { AUTH_TOKEN } from '../../constants/constants';
import { useMe } from '../../services/auth';
import { useUserStore } from '../../store/user';
import { routes } from '../../routes/menus';
import { useGoTo } from '../../hooks';

/**
*Layout容器
*/
const menuItemRender = (item: MenuDataItem, dom: React.ReactNode) => (
  <Link to={item.path || '/'}>{dom}</Link>
);

export default function Layout() {
  const nav = useNavigate();
  const token = localStorage.getItem(AUTH_TOKEN) || sessionStorage.getItem(AUTH_TOKEN);
  const { data } = useMe(!token);
  const role = data?.role as 'ADMIN' | 'MERCHANT' | undefined;
  const logoutStore = useUserStore((state) => state.logout);

  const logout = () => {
    logoutStore();
    nav('/login');
  };

  const filteredRoutes = routes.filter((r: any) => {
    if (role === 'ADMIN') return r.key.startsWith('admin_');
    if (role === 'MERCHANT') return !r.key.startsWith('admin_');
    return true;
  });

  const {go} = useGoTo()

  return (
    <ProLayout
      layout="mix"
      siderWidth={240}
      title="易宿酒店预订平台"
      route={{
        path: '/',
        routes: filteredRoutes as any,
      }}
      menuItemRender={menuItemRender}
      links={[
        <Space size={16} onClick={logout} className={styles.logoutLink}>
          <LogoutOutlined />
          退出
        </Space>,
      ]}
      logo={<div className={styles.logo} />}
      avatarProps={{
        size: 'small',
        src: data?.avatarUrl,
        render: () => (
          <span className={styles.avatarTrigger} onClick={() => nav('/profile')}>
            <Avatar size="small" src={data?.avatarUrl} />
            {data?.username || '用户'}
          </span>
        ),
      }}
      onMenuHeaderClick={() => nav('/')}
    >
      <Outlet />
    </ProLayout>
  );
}

