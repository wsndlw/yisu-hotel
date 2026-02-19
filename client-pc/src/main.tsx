import { createRoot } from 'react-dom/client';
import { client } from './utils/apollo';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import AuthGuard from './components/AuthGuard';
// import RootRedirect from './components/RootRedirect';
import { App as AntdApp } from 'antd';

import { routes } from './routes/menus';
import Layout from './containers/Layout';
// import Login from './containers/Login';
// import Register from './containers/Register';
import { ROUTE_COMPONENT, HotelEdit, RoomOperations } from './routes';
import Profile from './containers/Profile';
// import RequireRole, { type AppRole } from './components/RequireRole';

import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import RequireRole, { type AppRole } from './componenets/RequireRole';
import AuthGuard from './componenets/AuthGuard';
import Register from './containers/Register';
import RootRedirect from './componenets/RootRedirect';
import Login from './containers/Login';

const roleForPath = (path: string): AppRole => (path.startsWith('admin/') ? 'ADMIN' : 'MERCHANT');

const routeNodes = routes.map((item) => {
  const Component = ROUTE_COMPONENT[item.key];
  const role = roleForPath(item.path);
  return (
    <Route
      path={item.path}
      key={item.key}
      element={
        <RequireRole roles={[role]}>
          <Component />
        </RequireRole>
      }
    />
  );
});

createRoot(document.getElementById('root')!).render(
  <AntdApp>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            {routeNodes}
            {/* 不在菜单中的页面 */}
            <Route
              path="merchant/hotels/new"
              element={
                <RequireRole roles={['MERCHANT']}>
                  <HotelEdit mode="create" />
                </RequireRole>
              }
            />
            <Route
              path="merchant/hotels/:id"
              element={
                <RequireRole roles={['MERCHANT']}>
                  <HotelEdit mode="edit" />
                </RequireRole>
              }
            />
            <Route
              path="merchant/hotels/:hotelId/room-operations"
              element={
                <RequireRole roles={['MERCHANT']}>
                  <RoomOperations />
                </RequireRole>
              }
            />
            <Route
              path="profile"
              element={
                <RequireRole roles={['ADMIN', 'MERCHANT']}>
                  <Profile />
                </RequireRole>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  </AntdApp>,
);
