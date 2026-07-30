import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { HotelDetail } from '../../../types/hotel';

interface HotelSummaryCardProps {
  hotel: HotelDetail;
  cityName?: string;
}

const TAG_COLORS = [
  { backgroundColor: '#e6f4ff', color: '#1677ff' },
  { backgroundColor: '#fff7e6', color: '#d46b08' },
  { backgroundColor: '#f9f0ff', color: '#722ed1' },
];

function getOpenSinceLabel(openSince?: string | null) {
  if (!openSince) return null;
  const match = openSince.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}年${Number(match[2])}月开业`;
}

export default function HotelSummaryCard({ hotel, cityName }: HotelSummaryCardProps) {
  const starCount = Math.max(0, Math.min(5, Math.trunc(Number(hotel.starLevel) || 0)));
  const score = Number(hotel.score);
  const hasScore = Number.isFinite(score) && score > 0;
  const commentCount = Number(hotel.commentCount);
  const hasCommentCount = Number.isFinite(commentCount) && commentCount > 0;
  const openSinceLabel = getOpenSinceLabel(hotel.openSince);
  const facilities = useMemo(
    () => (hotel.facilities || []).filter(Boolean).slice(0, 8),
    [hotel.facilities],
  );

  return (
    <View style={styles.card}>
      <Text selectable style={styles.hotelName}>
        {hotel.name}
      </Text>

      {(starCount > 0 || openSinceLabel) && (
        <View style={styles.metadataRow}>
          {starCount > 0 && (
            <View accessibilityLabel={`${starCount}星级酒店`} style={styles.starsRow}>
              {Array.from({ length: starCount }).map((_, index) => (
                <Ionicons key={index} name="star" size={14} color="#f5a623" />
              ))}
            </View>
          )}
          {openSinceLabel && (
            <View style={styles.openSinceBadge}>
              <Text style={styles.openSinceText}>{openSinceLabel}</Text>
            </View>
          )}
        </View>
      )}

      {(hasScore || hasCommentCount) && (
        <View style={styles.scoreRow}>
          {hasScore && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreNumber}>{score.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>{score >= 4.8 ? '超棒' : score >= 4.5 ? '很好' : '不错'}</Text>
            </View>
          )}
          {hasCommentCount && (
            <Text selectable style={styles.commentCount}>
              {commentCount} 条真实评价
            </Text>
          )}
        </View>
      )}

      {(hotel.address || cityName) && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={20} color="#475569" />
          <View style={styles.addressTextGroup}>
            {hotel.address && (
              <Text selectable style={styles.addressText}>
                {hotel.address}
              </Text>
            )}
            {cityName && <Text style={styles.cityText}>{cityName}</Text>}
          </View>
        </View>
      )}

      {facilities.length > 0 && (
        <View style={styles.tagsRow}>
          {facilities.map((facility, index) => {
            const colors = TAG_COLORS[index % TAG_COLORS.length];
            return (
              <View
                key={`${facility}-${index}`}
                style={[styles.tag, { backgroundColor: colors.backgroundColor }]}
              >
                <Text style={[styles.tagText, { color: colors.color }]}>{facility}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    zIndex: 2,
    gap: 13,
    marginHorizontal: 12,
    marginTop: -26,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226,232,240,0.9)',
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  hotelName: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '700',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  openSinceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#f0fdf4',
  },
  openSinceText: {
    color: '#15803d',
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#1677ff',
  },
  scoreNumber: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentCount: {
    color: '#475569',
    fontSize: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressTextGroup: {
    flex: 1,
    gap: 3,
  },
  addressText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  cityText: {
    color: '#64748b',
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  tagText: {
    fontSize: 12,
  },
});
