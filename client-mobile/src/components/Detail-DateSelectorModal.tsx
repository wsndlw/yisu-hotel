import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHotelMinPriceCalendar } from '../services/hotel-h5';
import type { HotelMinPriceCalendarDay } from '../types/hotel';
import CustomCalendar, { CalendarWeekHeader } from './Detail-CustomCalendar';

const CALENDAR_MONTH_COUNT = 6;

interface Props {
  visible: boolean;
  hotelId: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(value: string, amount: number) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return formatLocalDate(date);
}

function calculateNights(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate <= startDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000);
}

function formatDisplayDate(value: string) {
  if (!value) return '请选择';
  const date = parseLocalDate(value);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function createCalendarRange() {
  const today = new Date();
  const startDate = formatLocalDate(today);
  const lastMonth = new Date(
    today.getFullYear(),
    today.getMonth() + CALENDAR_MONTH_COUNT,
    0,
  );
  return {
    startDate,
    endDate: formatLocalDate(lastMonth),
  };
}

function isCalendarDayAvailable(day?: HotelMinPriceCalendarDay) {
  return Boolean(
    day
    && day.available
    && day.stock !== 0
    && day.price != null
    && Number.isFinite(Number(day.price))
    && Number(day.price) >= 0,
  );
}

export default function DateSelectorModal({
  visible,
  hotelId,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: Props) {
  const calendarRange = useMemo(createCalendarRange, []);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [validationMessage, setValidationMessage] = useState('');
  const {
    data: calendarData,
    loading,
    error,
    refetch,
  } = useHotelMinPriceCalendar({
    hotelId: visible ? hotelId : '',
    startDate: calendarRange.startDate,
    endDate: calendarRange.endDate,
  });
  const calendarDays = calendarData?.days || [];
  const dayMap = useMemo(
    () => new Map(calendarDays.map((day) => [day.date, day])),
    [calendarDays],
  );
  const nights = calculateNights(draftStartDate, draftEndDate);

  useEffect(() => {
    if (!visible) return;
    const nextStart = (
      startDate >= calendarRange.startDate
      && startDate <= calendarRange.endDate
    )
      ? startDate
      : '';
    const nextEnd = (
      nextStart
      && endDate > nextStart
      && endDate <= calendarRange.endDate
    )
      ? endDate
      : '';
    setDraftStartDate(nextStart);
    setDraftEndDate(nextEnd);
    setValidationMessage('');
  }, [
    calendarRange.endDate,
    calendarRange.startDate,
    endDate,
    startDate,
    visible,
  ]);

  const findUnavailableDate = (rangeStart: string, rangeEnd: string) => {
    let date = rangeStart;
    while (date <= rangeEnd) {
      if (!isCalendarDayAvailable(dayMap.get(date))) return date;
      date = addDays(date, 1);
    }
    return '';
  };

  const handleDateSelect = (date: string) => {
    setValidationMessage('');

    if (!draftStartDate || draftEndDate || date <= draftStartDate) {
      setDraftStartDate(date);
      setDraftEndDate('');
      return;
    }

    const unavailableDate = findUnavailableDate(draftStartDate, date);
    if (unavailableDate) {
      setValidationMessage('所选区间包含无房日期，请缩短行程或重新选择入住日期');
      return;
    }

    setDraftEndDate(date);
  };

  const canConfirm = Boolean(
    draftStartDate
    && draftEndDate
    && nights > 0
    && !loading
    && !error,
  );

  const handleConfirm = () => {
    if (!canConfirm) return;

    const unavailableDate = findUnavailableDate(draftStartDate, draftEndDate);
    if (unavailableDate) {
      setDraftEndDate('');
      setValidationMessage('价格或库存已变化，请重新选择离店日期');
      return;
    }

    onConfirm(draftStartDate, draftEndDate);
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="关闭日期选择"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={28} color="#17233d" />
          </Pressable>
          <Text style={styles.title}>低价日历</Text>
          <View style={styles.headerButton} />
        </View>

        <Text style={styles.priceHint}>以下价格为单晚入住参考价</Text>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.label}>入住</Text>
            <Text style={styles.date}>{formatDisplayDate(draftStartDate)}</Text>
          </View>
          <View style={styles.staySummary}>
            <View style={styles.divider} />
            <Text style={styles.nightsText}>{nights > 0 ? `${nights}晚` : '选择日期'}</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.label}>离店</Text>
            <Text style={styles.date}>{formatDisplayDate(draftEndDate)}</Text>
          </View>
        </View>

        <CalendarWeekHeader />

        {error ? (
          <View style={styles.feedbackContainer}>
            <Ionicons name="cloud-offline-outline" size={34} color="#94a3b8" />
            <Text selectable style={styles.feedbackTitle}>低价日历加载失败</Text>
            <Text selectable style={styles.feedbackMessage}>
              {error.message || '请检查网络后重试'}
            </Text>
            <Pressable onPress={() => void refetch()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>重新加载</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            style={styles.calendarScroll}
          >
            {loading && calendarDays.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#1677ff" />
                <Text style={styles.loadingText}>正在获取实时价格与库存…</Text>
              </View>
            ) : null}
            <CustomCalendar
              startDate={draftStartDate}
              endDate={draftEndDate}
              calendarStartDate={calendarRange.startDate}
              monthCount={CALENDAR_MONTH_COUNT}
              days={calendarDays}
              loading={loading && calendarDays.length === 0}
              onSelectDate={handleDateSelect}
            />
          </ScrollView>
        )}

        <View style={styles.footer}>
          {validationMessage ? (
            <Text selectable style={styles.validationMessage}>
              {validationMessage}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canConfirm}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              !canConfirm && styles.disabledButton,
              pressed && canConfirm && styles.pressedButton,
            ]}
          >
            <Text style={styles.confirmButtonText}>
              {canConfirm ? `确认日期 · 共${nights}晚` : '请选择有效的入住和离店日期'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#17233d',
    fontSize: 20,
    fontWeight: '700',
  },
  priceHint: {
    color: '#f26a2e',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fffaf5',
  },
  statusRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef1f5',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: '#8490a3',
    fontSize: 12,
  },
  date: {
    color: '#1677ff',
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  staySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    width: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
  },
  nightsText: {
    color: '#64748b',
    fontSize: 11,
  },
  calendarScroll: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 24,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  feedbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  feedbackTitle: {
    color: '#17233d',
    fontSize: 17,
    fontWeight: '700',
  },
  feedbackMessage: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginTop: 6,
    borderRadius: 21,
    backgroundColor: '#1677ff',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5eaf0',
    backgroundColor: '#fff',
  },
  validationMessage: {
    color: '#d9485f',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 8,
  },
  confirmButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#1677ff',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  pressedButton: {
    opacity: 0.8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
