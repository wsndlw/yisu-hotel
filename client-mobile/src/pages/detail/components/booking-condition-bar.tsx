import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookingConditionBarProps {
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  onDatesPress: () => void;
  onGuestsPress: () => void;
}

function displayDate(value: string) {
  return value ? value.replace(/-/g, '/') : '选择日期';
}

export default function BookingConditionBar({
  checkInDate,
  checkOutDate,
  guestCount,
  onDatesPress,
  onGuestsPress,
}: BookingConditionBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="选择入住和离店日期"
        onPress={onDatesPress}
        style={({ pressed }) => [styles.datePressable, pressed && styles.pressed]}
      >
        <View style={styles.dateBlock}>
          <Text style={styles.label}>入住</Text>
          <Text style={styles.value}>{displayDate(checkInDate)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={17} color="#1677ff" />
        <View style={styles.dateBlock}>
          <Text style={styles.label}>离店</Text>
          <Text style={styles.value}>{displayDate(checkOutDate)}</Text>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`选择入住人数，当前${guestCount}人`}
        onPress={onGuestsPress}
        style={({ pressed }) => [styles.guestPressable, pressed && styles.pressed]}
      >
        <Text style={styles.label}>入住人数</Text>
        <View style={styles.guestValueRow}>
          <Text style={styles.value}>{guestCount}人</Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  datePressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateBlock: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
  },
  value: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
    backgroundColor: '#e2e8f0',
  },
  guestPressable: {
    minWidth: 76,
    justifyContent: 'center',
    gap: 4,
  },
  guestValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pressed: {
    opacity: 0.6,
  },
});
