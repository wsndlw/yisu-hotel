import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DetailBottomBarProps {
  visible: boolean;
  minPrice: number | null;
  onViewRooms: () => void;
}

function formatPrice(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function DetailBottomBar({
  visible,
  minPrice,
  onViewRooms,
}: DetailBottomBarProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.priceInfo}>
        {minPrice == null ? (
          <Text style={styles.noRoomText}>暂无可售房型</Text>
        ) : (
          <>
            <Text selectable style={styles.price}>
              ¥{formatPrice(minPrice)}
            </Text>
            <Text style={styles.priceUnit}>起</Text>
          </>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="查看可订房型"
        disabled={minPrice == null}
        onPress={onViewRooms}
        style={({ pressed }) => [
          styles.button,
          minPrice == null && styles.disabledButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>查看房型</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  priceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    color: '#ff4d4f',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  priceUnit: {
    color: '#64748b',
    fontSize: 13,
  },
  noRoomText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  button: {
    minWidth: 136,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: '#1677ff',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.68,
  },
});
