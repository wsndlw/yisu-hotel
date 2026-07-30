import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as AntdProvider } from '@ant-design/react-native'; // UI库
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 引入 Apollo 必要组件
import { ApolloProvider } from '@apollo/client';
import { client } from './src/utils/apollo';
import {
  flushPendingLoginNavigation,
  type HomeTabParamList,
  navigationRef,
  type RootStackParamList,
} from './src/navigation/navigationRef';
import { restoreAuthSession } from './src/services/authSession';

// 引入页面
import SearchPage from './src/pages/search/SearchPage';
import ListPage from './src/pages/list/ListPage';
import DetailPage from './src/pages/detail/DetailPage';
import LoginPage from './src/pages/login/LoginPage';
import RegisterPage from './src/pages/register/RegisterPage';
import BookingConfirmPage from './src/pages/bookingConfirm/BookingConfirmPage';
import OrdersPage from './src/pages/orders/OrdersPage';
import OrderDetailPage from './src/pages/orderDetail/OrderDetailPage';
import ProfilePage from './src/pages/profile/ProfilePage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<HomeTabParamList>();

const TAB_ICONS: Record<
  keyof HomeTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Orders: { active: 'receipt', inactive: 'receipt-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShadowVisible: false,
        tabBarActiveTintColor: '#1677ff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 62,
          paddingTop: 6,
          paddingBottom: 7,
          borderTopColor: '#e5e7eb',
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={SearchPage}
        options={{ title: '首页', headerShown: false }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersPage}
        options={{ title: '订单', headerTitle: '我的订单' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{ title: '我的', headerTitle: '个人中心' }}
      />
    </Tab.Navigator>
  );
}

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
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <AntdProvider>
          {sessionReady ? (
            <NavigationContainer
              ref={navigationRef}
              onReady={flushPendingLoginNavigation}
              onStateChange={flushPendingLoginNavigation}
            >
              <Stack.Navigator initialRouteName="MainTabs">
                <Stack.Screen
                  name="MainTabs"
                  component={MainTabs}
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
                <Stack.Screen
                  name="BookingConfirm"
                  component={BookingConfirmPage}
                  options={{ title: '确认预订' }}
                />
                <Stack.Screen
                  name="OrderDetail"
                  component={OrderDetailPage}
                  options={{ title: '订单详情' }}
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
    </SafeAreaProvider>
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
