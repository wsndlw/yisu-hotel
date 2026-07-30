import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RoomFilterBarProps {
  activeLabels: string[];
  onOpenFilters: () => void;
}

export default function RoomFilterBar({ activeLabels, onOpenFilters }: RoomFilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        contentContainerStyle={styles.labelsContent}
        showsHorizontalScrollIndicator={false}
      >
        {(activeLabels.length > 0 ? activeLabels : ['全部房型']).map((label, index) => (
          <View
            key={`${label}-${index}`}
            style={activeLabels.length > 0 ? styles.activeLabel : styles.defaultLabel}
          >
            <Text style={activeLabels.length > 0 ? styles.activeLabelText : styles.defaultLabelText}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="打开房型筛选"
        onPress={onOpenFilters}
        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
      >
        <Text style={styles.filterButtonText}>筛选</Text>
        <Ionicons name="options-outline" size={16} color="#334155" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  labelsContent: {
    alignItems: 'center',
    gap: 7,
    paddingRight: 4,
  },
  activeLabel: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#e6f4ff',
  },
  activeLabelText: {
    color: '#1677ff',
    fontSize: 12,
    fontWeight: '600',
  },
  defaultLabel: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#f1f5f9',
  },
  defaultLabelText: {
    color: '#64748b',
    fontSize: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  filterButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
