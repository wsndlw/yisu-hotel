import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import type {
  HomeTabParamList,
  RootStackParamList,
} from '../../navigation/navigationRef';
import { requireAuth } from '../../navigation/requireAuth';
import { Order, OrderStatus, useMyOrders } from '../../services/order';
import { useAuthStore } from '../../store/authStore';
import styles from './OrdersPage.styles';

type OrdersPageProps = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Orders'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_META: Record<
  OrderStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  PENDING: { label: '待支付', backgroundColor: '#fff7ed', color: '#c2410c' },
  PAID: { label: '已支付', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  CANCELLED: { label: '已取消', backgroundColor: '#f3f4f6', color: '#6b7280' },
  COMPLETED: { label: '已完成', backgroundColor: '#f0fdf4', color: '#15803d' },
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage({ navigation }: OrdersPageProps) {
  const token = useAuthStore((state) => state.token);
  const { orders, loading, error, refetch } = useMyOrders(1, 20, Boolean(token));
  const [refreshing, setRefreshing] = useState(false);
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }

      // 从详情页返回时重新拉取，确保取消后的列表状态与服务端一致。
      void refetch().catch(() => undefined);
    }, [refetch, token]),
  );

  const handleRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      // Apollo 会同步更新 error，页面继续保留当前列表并允许再次刷新。
    } finally {
      setRefreshing(false);
    }
  }, [refetch, token]);

  if (!token) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.stateTitle}>登录后查看订单</Text>
        <Text style={styles.stateText}>历史订单仅对账号本人可见</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            requireAuth(navigation, 'Orders', { returnToExisting: true })
          }
        >
          <Text style={styles.primaryButtonText}>去登录</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && orders.length === 0 && !refreshing) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.stateText}>正在加载订单…</Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.stateTitle}>订单加载失败</Text>
        <Text selectable style={styles.stateText}>{error.message}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => void refetch()}>
          <Text style={styles.primaryButtonText}>重新加载</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const status = STATUS_META[item.status];
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text numberOfLines={2} style={styles.hotelName}>{item.hotelName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.roomName}>房型：{item.roomTypeName}</Text>
        <Text style={styles.dateText}>{item.checkIn} 至 {item.checkOut}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.orderTime}>{formatDateTime(item.createdAt)}</Text>
          <Text style={styles.amount}>¥{Number(item.totalAmount).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.listContent}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          tintColor="#1677ff"
        />
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.stateTitle}>暂无历史订单</Text>
          <Text style={styles.stateText}>完成一次酒店预订后，订单会显示在这里</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryButtonText}>去找酒店</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}
