import React from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import type { Room, RoomRatePlan } from '../../../types/hotel';
import RoomTypeCard from './room-type-card';

interface RoomSectionProps {
  rooms: Room[];
  nights: number;
  onBook: (room: Room, ratePlan: RoomRatePlan) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export default function RoomSection({ rooms, nights, onBook, onLayout }: RoomSectionProps) {
  return (
    <View style={styles.section} onLayout={onLayout}>
      <View style={styles.header}>
        <Text style={styles.title}>选择房型</Text>
        <Text style={styles.count}>共 {rooms.length} 个房型</Text>
      </View>

      {rooms.length > 0 ? (
        <View style={styles.roomList}>
          {rooms.map((room, index) => (
            <RoomTypeCard
              key={room.id}
              room={room}
              nights={nights}
              defaultExpanded={index === 0}
              onBook={onBook}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有符合当前条件的房型</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    margin: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    color: '#94a3b8',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  roomList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
