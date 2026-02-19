import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as AntdProvider } from '@ant-design/react-native'; // Antd RN 的样式注入

// 引入 Store
import { store } from './src/store';

// 引入页面 (稍后我们创建这些文件的空壳，防止报错)
import SearchPage from './src/pages/SearchPage';
import ListPage from './src/pages/ListPage';
import DetailPage from './src/pages/DetailPage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <AntdProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Search">
            {/* 定义路由 */}
            <Stack.Screen 
              name="Search" 
              component={SearchPage} 
              options={{ headerShown: false }} // 隐藏默认的顶部栏
            />
            <Stack.Screen 
              name="List" 
              component={ListPage} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Detail" 
              component={DetailPage} 
              options={{ headerShown: false }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AntdProvider>
    </Provider>
  );
}