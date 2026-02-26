import dayjs, { Dayjs } from 'dayjs';


export type QuickSelect = 'all' | 'weekday' | 'weekend' | 'holiday';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 周日=0, 周一=1, ..., 周六=6

export function fmt(d: Dayjs) {
  return d.format('YYYY-MM-DD');
}

export function isWeekend(d: Dayjs) {
  const w = d.day();
  return w === 5 || w === 6; // 周五=5, 周六=6
}

export function isWeekday(d: Dayjs) {
  const w = d.day();
  return w === 0 || w === 1 || w === 2 || w === 3 || w === 4; // 周日-周四
}

export function inRange(date: Dayjs, start: Dayjs, end: Dayjs) {
  return (date.isAfter(start, 'day') || date.isSame(start, 'day')) && (date.isBefore(end, 'day') || date.isSame(end, 'day'));
}

export function expandDates(start: Dayjs, end: Dayjs) {
  const list: Dayjs[] = [];
  let cur = start.startOf('day');
  const last = end.startOf('day');
  while (cur.isBefore(last, 'day') || cur.isSame(last, 'day')) {
    list.push(cur);
    cur = cur.add(1, 'day');
  }
  return list;
}

/**
 * 将分散的日期合并，减少 mutation 次数
 */
export function compressRanges(
  values: Record<string, number>,
  start: Dayjs,
  end: Dayjs,
): Array<{ startDate: string; endDate: string; value: number }> {
  const result: Array<{ startDate: string; endDate: string; value: number }> = [];

  // 获取所有需要设置的日期，并按日期排序
  const dateKeys = Object.keys(values).sort();
  if (dateKeys.length === 0) return [];

  let curStart: Dayjs | null = null;
  let curEnd: Dayjs | null = null;
  let curValue: number | null = null;

  for (const dateStr of dateKeys) {
    const d = dayjs(dateStr);
    // 只处理在范围内的日期
    if (!inRange(d, start, end)) continue;

    const v = values[dateStr];

    if (curStart === null) {
      curStart = d;
      curEnd = d;
      curValue = v;
      continue;
    }

    // 检查是否连续且值相同
    // 当前日期 d 必须是 curEnd 的下一天
    const nextDay = (curEnd as Dayjs).add(1, 'day');
    if (d.isSame(nextDay, 'day') && v === curValue) {
      curEnd = d;
    } else {
      // 不连续或值不同，结束当前段，开始新段
      if (curStart && curEnd && curValue !== null) {
        result.push({ startDate: fmt(curStart), endDate: fmt(curEnd), value: curValue });
      }
      curStart = d;
      curEnd = d;
      curValue = v;
    }
  }

  // 处理最后一段
  if (curStart && curEnd && curValue !== null) {
    result.push({ startDate: fmt(curStart), endDate: fmt(curEnd), value: curValue });
  }

  return result;
}
