import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import type { Room, RoomRatePlan } from '../../../types/hotel';
import RatePlanRow from './rate-plan-row';

interface RoomTypeCardProps {
  room: Room;
  nights: number;
  defaultExpanded?: boolean;
  onBook: (room: Room, ratePlan: RoomRatePlan) => void;
}

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function createMvpRatePlan(room: Room): RoomRatePlan {
  return {
    id: `${room.id}:base-rate`,
    roomTypeId: room.id,
    name: room.hasBreakfast ? '含早餐方案' : '基础方案',
    price: Number(room.price),
    stock: room.stock,
    hasBreakfast: room.hasBreakfast,
    refundable: room.refundable,
  };
}

export default function RoomTypeCard({
  room,
  nights,
  defaultExpanded = false,
  onBook,
}: RoomTypeCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const ratePlan = useMemo(() => createMvpRatePlan(room), [room]);
  const price = Number(ratePlan.price);
  const hasPrice = Number.isFinite(price) && price >= 0;
  const soldOut = ratePlan.stock != null && ratePlan.stock <= 0;
  const roomTags = [
    room.bedType,
    room.area ? `${room.area}㎡` : null,
    room.maxGuests ? `最多${room.maxGuests}人` : null,
    room.hasWindow === true ? '有窗' : null,
  ].filter((tag): tag is string => Boolean(tag));

  return (
    <Animated.View layout={LinearTransition.duration(180)} style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? '收起' : '展开'}${room.title || '该房型'}报价`}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.summaryRow, pressed && styles.pressedSummary]}
      >
        {room.coverImage ? (
          <Image
            source={{ uri: room.coverImage }}
            style={[styles.image, compact && styles.compactImage]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, compact && styles.compactImage, styles.emptyImage]}>
            <Ionicons name="bed-outline" size={30} color="#94a3b8" />
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text selectable numberOfLines={2} style={styles.name}>
              {room.title || '未命名房型'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
              size={22}
              color="#536176"
            />
          </View>
          <Text style={styles.description}>
            {roomTags.join(' · ') || '房型信息待完善'}
          </Text>
          {!expanded ? (
            <View style={styles.collapsedPriceRow}>
              <Text style={styles.viewRateText}>查看报价</Text>
              <Text selectable style={styles.startingPrice}>
                {hasPrice ? `¥${formatPrice(price)}起` : '价格待确认'}
              </Text>
              {soldOut ? <Text style={styles.soldOutText}>已满</Text> : null}
            </View>
          ) : null}
        </View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          layout={LinearTransition.duration(180)}
          style={styles.ratePlanContainer}
        >
          <RatePlanRow
            room={room}
            ratePlan={ratePlan}
            nights={nights}
            onBook={onBook}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pressedSummary: {
    opacity: 0.72,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  compactImage: {
    width: 76,
    height: 76,
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  collapsedPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 5,
  },
  viewRateText: {
    color: '#1677ff',
    fontSize: 12,
    fontWeight: '600',
  },
  startingPrice: {
    color: '#ff4d4f',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  soldOutText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  ratePlanContainer: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
});
