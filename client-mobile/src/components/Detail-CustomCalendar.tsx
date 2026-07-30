import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { HotelMinPriceCalendarDay } from '../types/hotel';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

interface CustomCalendarProps {
  startDate: string;
  endDate: string;
  calendarStartDate: string;
  monthCount: number;
  days: HotelMinPriceCalendarDay[];
  loading?: boolean;
  onSelectDate: (date: string) => void;
}

interface CalendarMonth {
  key: string;
  title: string;
  year: number;
  month: number;
  leadingEmptyDays: number;
  daysInMonth: number;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date) {
  return formatDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildMonths(startDate: string, count: number): CalendarMonth[] {
  const firstMonth = parseLocalDate(startDate);
  firstMonth.setDate(1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      key: `${year}-${pad(month + 1)}`,
      title: `${year}年${month + 1}月`,
      year,
      month,
      leadingEmptyDays: date.getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
    };
  });
}

export default function CustomCalendar({
  startDate,
  endDate,
  calendarStartDate,
  monthCount,
  days,
  loading = false,
  onSelectDate,
}: CustomCalendarProps) {
  const { width } = useWindowDimensions();
  const cellWidth = Math.floor((width - 24) / 7);
  const today = formatLocalDate(new Date());
  const months = useMemo(
    () => buildMonths(calendarStartDate, monthCount),
    [calendarStartDate, monthCount],
  );
  const dayMap = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );
  const lowestPrice = useMemo(() => {
    const prices = days
      .filter((day) => day.available && day.stock !== 0 && day.price != null)
      .map((day) => Number(day.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [days]);

  return (
    <View style={styles.calendarContainer}>
      {months.map((calendarMonth) => (
        <View key={calendarMonth.key} style={styles.monthSection}>
          <Text style={styles.monthTitle}>{calendarMonth.title}</Text>
          <View style={styles.daysGrid}>
            {Array.from({ length: calendarMonth.leadingEmptyDays }, (_, index) => (
              <View
                key={`${calendarMonth.key}-empty-${index}`}
                style={{ width: cellWidth, height: 64 }}
              />
            ))}
            {Array.from({ length: calendarMonth.daysInMonth }, (_, index) => {
              const dayNumber = index + 1;
              const date = formatDate(
                calendarMonth.year,
                calendarMonth.month,
                dayNumber,
              );
              const calendarDay = dayMap.get(date);
              const numericPrice = Number(calendarDay?.price);
              const isPast = date < today;
              const isStart = date === startDate;
              const isEnd = date === endDate;
              const isInRange = Boolean(
                startDate
                && endDate
                && date > startDate
                && date < endDate,
              );
              const isUnavailable = !isPast && (
                !calendarDay
                || !calendarDay.available
                || calendarDay.stock === 0
                || calendarDay.price == null
                || !Number.isFinite(numericPrice)
                || numericPrice < 0
              );
              const isLowestPrice = (
                !isUnavailable
                && lowestPrice != null
                && numericPrice === lowestPrice
              );
              const isDisabled = loading || isPast || isUnavailable;
              const isSelected = isStart || isEnd;

              return (
                <View
                  key={date}
                  style={[
                    styles.dayCell,
                    { width: cellWidth },
                    isInRange && styles.rangeCell,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${date}${isUnavailable ? '无房' : ''}`}
                    disabled={isDisabled}
                    onPress={() => onSelectDate(date)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      isSelected && styles.selectedDay,
                      pressed && !isDisabled && styles.pressedDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        (isPast || isUnavailable) && styles.disabledText,
                        isInRange && styles.rangeText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {dayNumber}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.dayMeta,
                        isLowestPrice && styles.lowestPriceText,
                        (isPast || isUnavailable) && styles.disabledMetaText,
                        isInRange && styles.rangeText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {isStart
                        ? '入住'
                        : isEnd
                          ? '离店'
                          : isPast
                            ? ''
                            : isUnavailable
                              ? loading
                                ? '加载中'
                                : '无房'
                              : `${isLowestPrice ? '低价 ' : ''}¥${Math.round(numericPrice)}`}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export function CalendarWeekHeader() {
  return (
    <View style={styles.weekRow}>
      {WEEK_LABELS.map((label, index) => (
        <Text
          key={label}
          style={[
            styles.weekText,
            (index === 0 || index === 6) && styles.weekendText,
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  monthSection: {
    paddingTop: 24,
  },
  monthTitle: {
    color: '#17233d',
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingBottom: 14,
  },
  weekRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef1f5',
  },
  weekText: {
    width: `${100 / 7}%`,
    color: '#536176',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  weekendText: {
    color: '#f26a2e',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    height: 64,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  dayButton: {
    minHeight: 56,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: '#1677ff',
  },
  pressedDay: {
    opacity: 0.72,
  },
  rangeCell: {
    backgroundColor: '#eaf3ff',
  },
  dayNumber: {
    color: '#17233d',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dayMeta: {
    maxWidth: '100%',
    color: '#64748b',
    fontSize: 9,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  lowestPriceText: {
    color: '#f26a2e',
    fontWeight: '700',
  },
  disabledText: {
    color: '#c7cdd6',
  },
  disabledMetaText: {
    color: '#b7bec9',
  },
  rangeText: {
    color: '#1677ff',
  },
  selectedText: {
    color: '#fff',
  },
});
