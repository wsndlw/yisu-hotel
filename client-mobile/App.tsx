import React from 'react';
import { Provider } from 'react-redux'; // Redux
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as AntdProvider } from '@ant-design/react-native'; // UI库

// 引入 Apollo 必要组件
import { ApolloProvider } from '@apollo/client';
import { client } from './src/utils/apollo'; 

import { store } from './src/store';

// 引入页面
import SearchPage from './src/pages/SearchPage';
import ListPage from './src/pages/ListPage'; 
import DetailPage from './src/pages/DetailPage'; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      {/* 这里包裹 ApolloProvider */}
      <ApolloProvider client={client}>
        <AntdProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Search">
              <Stack.Screen 
                name="Search" 
                component={SearchPage} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="HotelList" 
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
      </ApolloProvider>
    </Provider>
  );
}