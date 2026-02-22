import { createRoot } from 'react-dom/client';
import { client } from './utils/apollo';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import AuthGuard from './components/AuthGuard';
// import RootRedirect from './components/RootRedirect';
import { App as AntdApp } from 'antd';

import { routes, ROUTE_KEY } from './routes/menus';
import Layout from './containers/Layout';
// import Login from './containers/Login';
// import Register from './containers/Register';
import { ROUTE_COMPONENT } from './routes';
// import Profile from './containers/Profile';
// import RequireRole, { type AppRole } from './components/RequireRole';

import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import RequireRole, { type AppRole } from './componenets/RouteGuard';
import Register from './containers/Register';
import Login from './containers/Login';
import RouteGuard from './componenets/RouteGuard';
import GuestGuard from './componenets/GuestGuard';

const roleForPath = (path: string): AppRole => (path.startsWith('admin/') ? 'ADMIN' : 'MERCHANT');

const routeNodes = routes.map((item) => {
  const Component = ROUTE_COMPONENT[item.key];
  let roles: AppRole[] = [];
  if (item.key === ROUTE_KEY.PROFILE) {
    roles = ['ADMIN', 'MERCHANT'];
  } else {
    roles = [roleForPath(item.path)];
  }

return (
    <Route
      path={item.path}
      key={item.key}
      element={
        <RouteGuard roles={roles}>
          <Component />
        </RouteGuard>
      }
    />
  );
});

createRoot(document.getElementById('root')!).render(
  <AntdApp>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Routes>
  {/* 依然保留反向守卫，防止已登录用户访问 login */}
  <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
  <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />
  
  <Route
    path="/"
    element={
      <RouteGuard>
        <Layout />
      </RouteGuard>
    }
  >
    <Route index element={<RouteGuard isRoot />} />
    
    {/* 业务页面 */}
    {routeNodes}
  </Route>
</Routes>
      </BrowserRouter>
    </ApolloProvider>
  </AntdApp>,
);
