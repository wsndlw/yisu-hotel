import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/navigationRef';
import { requireAuth } from '../../navigation/requireAuth';
import {
  OrderStatus,
  useCancelOrder,
  useOrderDetail,
} from '../../services/order';
import { useAuthStore } from '../../store/authStore';
import styles from './OrderDetailPage.styles';

type OrderDetailPageProps = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

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
  return date.toLocaleString('zh-CN');
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : '操作失败，请稍后重试';
}

export default function OrderDetailPage({ navigation, route }: OrderDetailPageProps) {
  const token = useAuthStore((state) => state.token);
  const { order, loading, error, refetch } = useOrderDetail(
    route.params.id,
    Boolean(token),
  );
  const { cancelOrder, loading: cancelling } = useCancelOrder();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!token) {
      requireAuth(navigation, 'OrderDetail', { returnToExisting: true });
    }
  }, [navigation, token]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      // Apollo 会将错误暴露给页面；保留现有详情避免刷新时闪空。
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCancel = () => {
    if (!order || cancelling) return;
    Alert.alert(
      '确认取消订单？',
      '取消成功后会按订单规则回补房间库存。',
      [
        { text: '暂不取消', style: 'cancel' },
        {
          text: '确认取消',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(order.id);
            } catch (cancelError) {
              Alert.alert('取消失败', errorMessage(cancelError));
              return;
            }

            try {
              await refetch();
              Alert.alert('取消成功', '订单已取消，房间库存已按规则回补。');
            } catch {
              // mutation 返回的 Order 会先更新 Apollo 缓存；网络刷新失败时提示手动重试。
              Alert.alert('订单已取消', '最新状态刷新失败，请下拉刷新后重试。');
            }
          },
        },
      ],
    );
  };

  if (!token || (loading && !order && !refreshing)) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.stateText}>正在加载订单详情…</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.stateTitle}>订单详情加载失败</Text>
        <Text selectable style={styles.stateText}>{error.message}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => void refetch()}>
          <Text style={styles.primaryButtonText}>重新加载</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.stateTitle}>订单不存在</Text>
        <Text style={styles.stateText}>该订单可能已被删除，或你无权查看</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
        >
          <Text style={styles.secondaryButtonText}>返回订单列表</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_META[order.status];
  const canCancel = order.status === 'PENDING' || order.status === 'PAID';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          tintColor="#1677ff"
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.hotelName}>{order.hotelName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text selectable style={styles.orderNumber}>订单号：{order.id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>入住信息</Text>
        <View style={styles.row}>
          <Text style={styles.label}>房型</Text>
          <Text style={styles.value}>{order.roomTypeName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>入住日期</Text>
          <Text style={styles.value}>{order.checkIn}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>离店日期</Text>
          <Text style={styles.value}>{order.checkOut}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>入住人数</Text>
          <Text style={styles.value}>{order.guestCount} 人</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>入住人</Text>
          <Text style={styles.value}>{order.guestName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>联系电话</Text>
          <Text style={styles.value}>{order.guestPhone}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>订单信息</Text>
        <View style={styles.row}>
          <Text style={styles.label}>下单时间</Text>
          <Text style={styles.value}>{formatDateTime(order.createdAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>订单金额</Text>
          <Text style={styles.amount}>¥{Number(order.totalAmount).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {canCancel ? (
          <>
            <Text style={styles.notice}>当前订单状态允许取消，最终结果以服务端规则为准。</Text>
            <TouchableOpacity
              style={[styles.dangerButton, cancelling ? styles.buttonDisabled : undefined]}
              disabled={cancelling}
              onPress={handleCancel}
            >
              {cancelling ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <Text style={styles.dangerButtonText}>取消订单</Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
        >
          <Text style={styles.secondaryButtonText}>查看全部订单</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
