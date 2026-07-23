import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as AntdProvider } from '@ant-design/react-native'; // UI库

// 引入 Apollo 必要组件
import { ApolloProvider } from '@apollo/client';
import { client } from './src/utils/apollo'; 
import {
  flushPendingLoginNavigation,
  navigationRef,
  type RootStackParamList,
} from './src/navigation/navigationRef';
import { restoreAuthSession } from './src/services/authSession';

// 引入页面
import SearchPage from './src/pages/SearchPage';
import ListPage from './src/pages/ListPage'; 
import DetailPage from './src/pages/DetailPage'; 
import LoginPage from './src/pages/LoginPage';
import RegisterPage from './src/pages/RegisterPage';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void restoreAuthSession().finally(() => {
      if (mounted) setSessionReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ApolloProvider client={client}>
      <AntdProvider>
        {sessionReady ? (
          <NavigationContainer
            ref={navigationRef}
            onReady={flushPendingLoginNavigation}
            onStateChange={flushPendingLoginNavigation}
          >
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
              <Stack.Screen
                name="Login"
                component={LoginPage}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Register"
                component={RegisterPage}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <View style={styles.sessionLoading}>
            <ActivityIndicator size="large" color="#1677ff" />
          </View>
        )}
      </AntdProvider>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  sessionLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
