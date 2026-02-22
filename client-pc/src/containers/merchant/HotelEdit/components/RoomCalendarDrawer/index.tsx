import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Calendar,
  Checkbox,
  DatePicker,
  Divider,
  Drawer,
  Form,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ALL_HOLIDAYS } from '../../../../../constants/holidays';
import type { CalendarProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import styles from './index.module.css';
import {
  useBatchSetCalendarPrice,
  useBatchSetCalendarStock,
  useClearCalendarPrice,
  useClearCalendarStock,
  useMerchantRoomTypeCalendar,
} from '../../../../../services/calendar';
import { compressRanges, expandDates, fmt, inRange, isWeekday, isWeekend, type QuickSelect, type Weekday } from '../../../../../utils/calendar';

const { RangePicker } = DatePicker;

type Props = {
  open: boolean;
  roomType: any | null;
  disabled?: boolean;
  onClose: () => void;
};

//房型日历，编辑日历价格和日历库存。支持批量编辑
export default function RoomCalendarDrawer({ open, roomType, disabled, onClose }: Props) {
  const roomTypeId = roomType?.id as string | undefined;

  const defaultRange = useMemo(() => {
    const start = dayjs().startOf('day');
    const end = start.add(365, 'day'); // 扩大到未来一年
    return [start, end] as [Dayjs, Dayjs];
  }, []);

  const [range, setRange] = useState<[Dayjs, Dayjs]>(defaultRange);
  const [activeTab, setActiveTab] = useState<'stock' | 'price'>('stock');
  const [calendarValue, setCalendarValue] = useState<Dayjs>(defaultRange[0]);

  // 日期选择状态
  const [quickSelect, setQuickSelect] = useState<QuickSelect | null>('all');
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    // 如果选了节假日，则包含所有节假日
    if (quickSelect === 'holiday') {
      for (const holiday of ALL_HOLIDAYS) {
        holiday.dates.forEach((d: string) => set.add(d));
      }
    }
    return set;
  }, [quickSelect]);

  const startDate = fmt(range[0]);
  const endDate = fmt(range[1]);

  const { data, loading, refetch } = useMerchantRoomTypeCalendar(roomTypeId, startDate, endDate);
  const days = data?.merchantRoomTypeCalendar?.days || [];

  // 当前范围内的“已生效覆盖”
  const priceOverride = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of days) {
      if (d.price !== undefined && d.price !== null) m[d.date] = d.price;
    }
    return m;
  }, [days]);

  const stockOverride = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of days) {
      if (d.stock !== undefined && d.stock !== null) m[d.date] = d.stock;
    }
    return m;
  }, [days]);

  // 编辑中的覆盖（未提交）
  const [draftPrice, setDraftPrice] = useState<Record<string, number>>({});
  const [draftStock, setDraftStock] = useState<Record<string, number>>({});

  // 批量填充
  const [fillForm] = Form.useForm();

  const [batchSetPrice, savingPrice] = useBatchSetCalendarPrice();
  const [clearPrice, clearingPrice] = useClearCalendarPrice();
  const [batchSetStock, savingStock] = useBatchSetCalendarStock();
  const [clearStock, clearingStock] = useClearCalendarStock();

  // open / roomType 切换时重置状态
  useEffect(() => {
    if (!open) return;
    setRange(defaultRange);
    setCalendarValue(defaultRange[0]);
    setActiveTab('stock');
    setDraftPrice({});
    setDraftStock({});
    fillForm.resetFields();
  }, [open, roomTypeId]);

  const mergedPrice = useMemo(() => ({ ...priceOverride, ...draftPrice }), [priceOverride, draftPrice]);
  const mergedStock = useMemo(() => ({ ...stockOverride, ...draftStock }), [stockOverride, draftStock]);

  const basePrice = roomType?.basePrice;
  const baseStock = roomType?.stock;

  const applyFill = async () => {
    const v = await fillForm.validateFields();
    const value: number = v.value;

    const next: Record<string, number> = { ...(activeTab === 'price' ? draftPrice : draftStock) };
    let count = 0;

    for (const d of expandDates(range[0], range[1])) {
      const key = fmt(d);
      let match = false;

      // 快捷选择
      if (quickSelect) {
        if (quickSelect === 'all') match = true;
        else if (quickSelect === 'weekday' && isWeekday(d)) match = true;
        else if (quickSelect === 'weekend' && isWeekend(d)) match = true;
        else if (quickSelect === 'holiday' && holidaySet.has(key)) match = true;
      }
      // 按星期选择
      else if (selectedWeekdays.length > 0) {
        if (selectedWeekdays.includes(d.day() as Weekday)) match = true;
      }

      if (match) {
        next[key] = value;
        count++;
      }
    }

    if (activeTab === 'price') setDraftPrice(next);
    else setDraftStock(next);

    let ruleText = '';
    if (quickSelect) {
      ruleText =
        quickSelect === 'all'
          ? '每天'
          : quickSelect === 'weekday'
            ? '平日'
            : quickSelect === 'weekend'
              ? '周末'
              : '节假日';
    } else if (selectedWeekdays.length > 0) {
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      ruleText = selectedWeekdays.map((w) => `周${dayNames[w]}`).join(',');
    }

    message.success(`已填充 ${count} 天${ruleText ? `（${ruleText}）` : ''}`);
  };

  const submit = async () => {
    if (!roomTypeId) return;

    const values = activeTab === 'price' ? draftPrice : draftStock;
    const segments = compressRanges(values, range[0], range[1]);

    if (segments.length === 0) return;

    try {
      for (const seg of segments) {
        if (activeTab === 'price') {
          await batchSetPrice(
            {
              roomTypeId,
              startDate: seg.startDate,
              endDate: seg.endDate,
              price: seg.value, // 用户输入的是"元"，后端也存"元"
            },
            undefined,
            true, // silent=true
          );
        } else {
          await batchSetStock(
            {
              roomTypeId,
              startDate: seg.startDate,
              endDate: seg.endDate,
              stock: seg.value,
            },
            undefined,
            true,
          );
        }
      }

      message.success(`${activeTab === 'price' ? '价格' : '库存'}已生效`);
      setDraftPrice((p) => (activeTab === 'price' ? {} : p));
      setDraftStock((s) => (activeTab === 'stock' ? {} : s));
      refetch();
    } catch (e) {
      // 错误已在 hook 内提示
    }
  };

  const clear = async () => {
    if (!roomTypeId) return;

    const input = {
      roomTypeId,
      startDate,
      endDate,
    };

    if (activeTab === 'price') {
      await clearPrice(input, () => {
        setDraftPrice({});
        refetch();
      });
    } else {
      await clearStock(input, () => {
        setDraftStock({});
        refetch();
      });
    }
  };

  const onSelectDate: CalendarProps<Dayjs>['onSelect'] = (d, info) => {
    if (disabled) return;
    if (info?.source === 'month' || info?.source === 'year' || info?.source === 'customize') return;

    if (!inRange(d, range[0], range[1])) return;

    const key = fmt(d);
    const current = activeTab === 'price' ? mergedPrice[key] : mergedStock[key];
    const isPriceTab = activeTab === 'price';

    Modal.confirm({
      title: `${key} - ${isPriceTab ? '价格' : '库存'}`,
      content: (
        <div>
          <div className={styles.note}>
            {isPriceTab ? `基础价：${basePrice ?? '-'} 元，当前覆盖：${current ?? '无'}` : `基础库存：${baseStock ?? '-'}，当前覆盖：${current ?? '无'}`}
          </div>
          <InputNumber
            id="calendar-edit-input"
            className={styles.fullWidth}
            placeholder={isPriceTab ? '请输入价格（元）' : '请输入库存'}
            defaultValue={current}
            min={0}
            precision={isPriceTab ? 2 : 0}
            autoFocus
          />
        </div>
      ),
      onOk: () => {
        const input = document.getElementById('calendar-edit-input') as HTMLInputElement;
        const val = Number(input?.value || 0);
        if (!Number.isFinite(val) || val < 0) return;

        if (isPriceTab) {
          setDraftPrice((prev) => ({ ...prev, [key]: val }));
        } else {
          setDraftStock((prev) => ({ ...prev, [key]: Math.floor(val) }));
        }
      },
    });
  };

  const dateCellRender: CalendarProps<Dayjs>['cellRender'] = (date, info) => {
    // 月视图：只显示月份数字
    if (info.type === 'month') {
      return null;
    }

    // 日视图：显示日期 + 价格/库存标记
    const key = fmt(date);
    const price = mergedPrice[key];
    const stock = mergedStock[key];

    const showPrice = price !== undefined;
    const showStock = stock !== undefined;

    return (
      <div className="ant-picker-cell-inner ant-picker-calendar-date">
        <div className="ant-picker-calendar-date-content">
          {activeTab === 'price' && (
            <div>{showPrice ? <Tag color="blue" className={styles.calendarTag}>¥{Number(price).toFixed(2)}</Tag> : <span className={styles.defaultText}>默认</span>}</div>
          )}
          {activeTab === 'stock' && (
            <div>{showStock ? <Tag color={stock === 0 ? 'red' : 'green'} className={styles.calendarTag}>{stock}</Tag> : <span className={styles.defaultText}>默认</span>}</div>
          )}
        </div>
      </div>
    );
  };

  const submitting = savingPrice || savingStock;
  const clearing = clearingPrice || clearingStock;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={980}
      title={`日历管理 - ${roomType?.name || ''}`}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={clear} disabled={disabled || loading} loading={clearing}>
            清空覆盖
          </Button>
          <Button type="primary" onClick={submit} disabled={disabled || loading} loading={submitting}>
            提交并生效
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="未设置覆盖的日期，会自动使用房型的基础价格/基础库存；提交后立即生效，无需审核。"
        className={styles.rangeRow}
      />

      <Space direction="vertical" className={styles.fullWidth} size={12}>
        <Space wrap className={styles.rangeRow}>
          <div>
            <Typography.Text type="secondary">日期范围：</Typography.Text>
            <RangePicker
              value={range}
              onChange={(v) => {
                if (!v?.[0] || !v?.[1]) return;
                setRange([v[0], v[1]]);
              }}
              allowClear={false}
              className={styles.rangePicker}
            />
          </div>

          <Divider type="vertical" />

          <Form form={fillForm} layout="inline" initialValues={{ value: 0 }}>
            <Form.Item
              name="value"
              label={activeTab === 'price' ? '价格（元）' : '库存'}
              rules={[{ required: true, message: '请输入值' }]}
            >
              <InputNumber min={0} precision={activeTab === 'price' ? 2 : 0} className={styles.inputNarrow} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={applyFill} disabled={disabled}>
                批量填充
              </Button>
            </Form.Item>
          </Form>
        </Space>

        <div className={styles.section}>
          <Typography.Text className={styles.sectionLabel}>快捷选择（单选）：</Typography.Text>
          <Radio.Group
            value={quickSelect}
            onChange={(e) => {
              setQuickSelect(e.target.value);
              setSelectedWeekdays([]);
            }}
            className={styles.sectionGroup}
          >
            <Radio value="all">每天</Radio>
            <Radio value="weekday">平日（周日-周四）</Radio>
            <Radio value="weekend">周末（周五-周六）</Radio>
            <Radio value="holiday">节假日</Radio>
          </Radio.Group>
        </div>

        <div className={styles.section}>
          <Typography.Text className={styles.sectionLabel}>按星期选择（可多选，与快捷选择互斥）：</Typography.Text>
          <Checkbox.Group
            value={selectedWeekdays}
            onChange={(vals) => {
              setSelectedWeekdays(vals as Weekday[]);
              setQuickSelect(null);
            }}
            className={styles.sectionGroup}
          >
            <Checkbox value={1}>周一</Checkbox>
            <Checkbox value={2}>周二</Checkbox>
            <Checkbox value={3}>周三</Checkbox>
            <Checkbox value={4}>周四</Checkbox>
            <Checkbox value={5}>周五</Checkbox>
            <Checkbox value={6}>周六</Checkbox>
            <Checkbox value={0}>周日</Checkbox>
          </Checkbox.Group>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as any)}
          items={[
            {
              key: 'stock',
              label: '日历库存',
              children: (
                <Calendar
                  value={calendarValue}
                  onSelect={onSelectDate}
                  onPanelChange={(v) => setCalendarValue(v)}
                  fullscreen={false}
                  cellRender={dateCellRender}
                />
              ),
            },
            {
              key: 'price',
              label: '日历价格',
              children: (
                <Calendar
                  value={calendarValue}
                  onSelect={onSelectDate}
                  onPanelChange={(v) => setCalendarValue(v)}
                  fullscreen={false}
                  cellRender={dateCellRender}
                />
              ),
            },
          ]}
        />

        <Typography.Paragraph type="secondary" className={styles.bottomNote}>
          点击日历日期可单独修改；批量填充支持工作日/周末/节假日。清空覆盖只会删除“日历覆盖”，不会修改基础价/基础库存。
        </Typography.Paragraph>
      </Space>
    </Drawer>
  );
}
