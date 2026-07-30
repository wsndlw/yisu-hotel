import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Room, RoomRatePlan } from '../../../types/hotel';

interface RatePlanRowProps {
  room: Room;
  ratePlan: RoomRatePlan;
  nights: number;
  onBook: (room: Room, ratePlan: RoomRatePlan) => void;
}

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function RatePlanRow({
  room,
  ratePlan,
  nights,
  onBook,
}: RatePlanRowProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const price = Number(ratePlan.price);
  const hasPrice = Number.isFinite(price) && price >= 0;
  const soldOut = ratePlan.stock != null && ratePlan.stock <= 0;
  const totalPrice = hasPrice && nights > 0 ? price * nights : null;
  const policyLabels = [
    ratePlan.hasBreakfast === true
      ? '含早餐'
      : ratePlan.hasBreakfast === false
        ? '不含早餐'
        : null,
    ratePlan.refundable === true
      ? '免费取消'
      : ratePlan.refundable === false
        ? '不可免费取消'
        : null,
  ].filter((label): label is string => Boolean(label));

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.planInfo}>
        <Text selectable style={styles.planName}>{ratePlan.name}</Text>
        {policyLabels.length > 0 ? (
          <View style={styles.policyList}>
            {policyLabels.map((label) => (
              <Text key={label} style={styles.policyText}>{label}</Text>
            ))}
          </View>
        ) : (
          <Text style={styles.policyPlaceholder}>方案政策以酒店确认为准</Text>
        )}
        {ratePlan.stock != null ? (
          <Text style={[styles.stockText, soldOut && styles.soldOutText]}>
            {soldOut ? '所选日期已满' : '所选日期可订'}
          </Text>
        ) : null}
      </View>

      <View style={[styles.bookingArea, compact && styles.compactBookingArea]}>
        <View style={styles.priceGroup}>
          <View style={styles.nightlyPriceRow}>
            <Text style={styles.currency}>¥</Text>
            <Text selectable style={styles.price}>
              {hasPrice ? formatPrice(price) : '待确认'}
            </Text>
            {hasPrice ? <Text style={styles.priceUnit}>/晚</Text> : null}
          </View>
          {totalPrice != null ? (
            <Text selectable style={styles.totalPrice}>
              {nights}晚合计 ¥{formatPrice(totalPrice)}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`预订${room.title || '该房型'}${ratePlan.name}`}
          disabled={soldOut || !hasPrice || nights <= 0}
          onPress={() => onBook(room, ratePlan)}
          style={({ pressed }) => [
            styles.bookButton,
            (soldOut || !hasPrice || nights <= 0) && styles.disabledBookButton,
            pressed && !soldOut && hasPrice && styles.pressed,
          ]}
        >
          <Text style={styles.bookButtonText}>{soldOut ? '已满' : '预订'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  compactContainer: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  planInfo: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  planName: {
    color: '#17233d',
    fontSize: 15,
    fontWeight: '700',
  },
  policyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  policyText: {
    color: '#1677ff',
    fontSize: 12,
  },
  policyPlaceholder: {
    color: '#8490a3',
    fontSize: 12,
  },
  stockText: {
    color: '#f26a2e',
    fontSize: 11,
  },
  soldOutText: {
    color: '#94a3b8',
  },
  bookingArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactBookingArea: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  priceGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  nightlyPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    color: '#ff4d4f',
    fontSize: 13,
    fontWeight: '700',
  },
  price: {
    color: '#ff4d4f',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    color: '#94a3b8',
    fontSize: 10,
  },
  totalPrice: {
    color: '#64748b',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  bookButton: {
    minWidth: 66,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: '#1677ff',
  },
  disabledBookButton: {
    backgroundColor: '#cbd5e1',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.68,
  },
});
