import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/navigationRef';
import { requireAuth } from '../../navigation/requireAuth';
import { createOrder, Order } from '../../services/order';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import styles from './BookingConfirmPage.styles';

type BookingConfirmPageProps = NativeStackScreenProps<
  RootStackParamList,
  'BookingConfirm'
>;

type FieldErrors = {
  guestName?: string;
  guestPhone?: string;
};

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,30}$/;

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : '创建订单失败，请稍后重试';
}

function getStatusLabel(status: Order['status']) {
  const labels: Record<Order['status'], string> = {
    PENDING: '待支付',
    PAID: '已支付',
    CANCELLED: '已取消',
    COMPLETED: '已完成',
  };
  return labels[status];
}

export default function BookingConfirmPage({ navigation }: BookingConfirmPageProps) {
  const phoneInputRef = useRef<TextInput>(null);
  const authToken = useAuthStore((state) => state.token);
  const authUser = useAuthStore((state) => state.user);
  const {
    checkIn,
    checkOut,
    guestCount,
    selectedHotel,
    selectedRoom,
    resetBooking,
  } = useBookingStore();

  const [guestName, setGuestName] = useState(authUser?.username || '');
  const [guestPhone, setGuestPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authToken) {
      requireAuth(navigation, 'BookingConfirm', { returnToExisting: true });
    }
  }, [authToken, navigation]);

  const nights = calculateNights(checkIn, checkOut);
  const priceSnapshot = selectedRoom?.priceSnapshot;
  const snapshotMatchesSelection = Boolean(
    priceSnapshot
    && priceSnapshot.checkIn === checkIn
    && priceSnapshot.checkOut === checkOut
    && priceSnapshot.guestCount === guestCount
    && priceSnapshot.nights === nights,
  );
  const estimatedTotal = snapshotMatchesSelection
    ? priceSnapshot?.totalPrice || 0
    : 0;
  const hasDraft = Boolean(
    selectedHotel
    && selectedRoom
    && selectedRoom.ratePlan
    && snapshotMatchesSelection
    && nights > 0,
  );

  if (!authToken) {
    return (
      <View style={[styles.screen, styles.sessionLoading]}>
        <ActivityIndicator color="#1677ff" />
      </View>
    );
  }

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const normalizedName = guestName.trim();
    const normalizedPhone = guestPhone.trim();

    if (!normalizedName) {
      nextErrors.guestName = '请输入入住人姓名';
    } else if (normalizedName.length > 64) {
      nextErrors.guestName = '入住人姓名不能超过 64 个字符';
    }
    if (!normalizedPhone) {
      nextErrors.guestPhone = '请输入入住人手机号';
    } else if (!PHONE_PATTERN.test(normalizedPhone)) {
      nextErrors.guestPhone = '请输入有效的入住人手机号';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!selectedHotel || !selectedRoom || nights <= 0) {
      setSubmitError('预订信息不完整，请返回酒店详情重新选择');
      return;
    }
    if (!validate()) return;

    Keyboard.dismiss();
    setSubmitError('');
    setSubmitting(true);

    try {
      const order = await createOrder({
        hotelId: selectedHotel.id,
        roomTypeId: selectedRoom.id,
        ratePlanId: selectedRoom.ratePlan.id,
        checkIn,
        checkOut,
        guestCount,
        priceSnapshot: selectedRoom.priceSnapshot,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
      });
      setCreatedOrder(order);
      resetBooking();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>预订成功</Text>
          <Text selectable style={styles.orderNumber}>订单号：{createdOrder.id}</Text>
          <Text style={styles.detailText}>酒店：{createdOrder.hotelName}</Text>
          <Text style={styles.detailText}>房型：{createdOrder.roomTypeName}</Text>
          <Text style={styles.detailText}>
            日期：{createdOrder.checkIn} 至 {createdOrder.checkOut}
          </Text>
          <Text style={styles.detailText}>状态：{getStatusLabel(createdOrder.status)}</Text>
          <Text style={styles.priceText}>订单金额：¥{createdOrder.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          >
            <Text style={styles.secondaryButtonText}>返回首页</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('OrderDetail', { id: createdOrder.id })}
          >
            <Text style={styles.primaryButtonText}>查看订单</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {hasDraft ? (
          <>
            <View style={styles.card}>
              <Text style={styles.hotelName}>{selectedHotel?.name}</Text>
              <Text style={styles.detailText}>房型：{selectedRoom?.name}</Text>
              <Text style={styles.detailText}>价格方案：{selectedRoom?.ratePlan.name}</Text>
              <Text style={styles.detailText}>
                日期：{checkIn} 至 {checkOut}（{nights} 晚）
              </Text>
              <Text style={styles.detailText}>入住人数：{guestCount} 人</Text>
              <Text style={styles.snapshotText}>
                报价快照：¥{selectedRoom?.priceSnapshot.nightlyPrice.toFixed(2)}/晚
              </Text>
              <Text style={styles.priceText}>预估总价：¥{estimatedTotal.toFixed(2)}</Text>
              <Text style={styles.noticeText}>最终金额以下单时服务端计算为准</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>入住人信息</Text>
              <View style={styles.field}>
                <Text style={styles.label}>入住人姓名</Text>
                <TextInput
                  value={guestName}
                  onChangeText={(value) => {
                    setGuestName(value);
                    clearFieldError('guestName');
                  }}
                  style={[styles.input, fieldErrors.guestName ? styles.inputError : undefined]}
                  placeholder="请输入入住人姓名"
                  placeholderTextColor="#9ca3af"
                  maxLength={64}
                  editable={!submitting}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                />
                {fieldErrors.guestName ? (
                  <Text selectable style={styles.fieldError}>{fieldErrors.guestName}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>入住人手机号</Text>
                <TextInput
                  ref={phoneInputRef}
                  value={guestPhone}
                  onChangeText={(value) => {
                    setGuestPhone(value);
                    clearFieldError('guestPhone');
                  }}
                  style={[styles.input, fieldErrors.guestPhone ? styles.inputError : undefined]}
                  placeholder="请输入手机号"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={32}
                  editable={!submitting}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSubmit()}
                />
                {fieldErrors.guestPhone ? (
                  <Text selectable style={styles.fieldError}>{fieldErrors.guestPhone}</Text>
                ) : null}
              </View>
            </View>

            {submitError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text selectable style={styles.errorText}>{submitError}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>返回修改</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, submitting ? styles.buttonDisabled : undefined]}
                onPress={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>提交订单</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.hotelName}>暂无可确认的预订</Text>
            <Text style={styles.noticeText}>请返回酒店详情重新选择日期和房型</Text>
            <TouchableOpacity
              style={[styles.primaryButton, styles.standaloneButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>返回酒店详情</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
