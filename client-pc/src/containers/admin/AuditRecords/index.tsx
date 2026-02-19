import { useState, useMemo } from 'react';

import styles from './index.module.css';
import { Card, DatePicker, Input, Select, Table } from 'antd';
import { ACTION_OPTIONS, getColumns } from './constants';
import dayjs from 'dayjs';
import { useAuditRecords } from '../../../services/auditRecords';


/**
*审核记录页面，管理员使用
*/
const AuditRecords = ({ }) => {
  //默认只显示近几天的数据。
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ]);
  const [action, setAction] = useState<string | undefined>();
  const [hotelId, setHotelId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);


  const input = useMemo(
    () => ({
      page,
      pageSize,
      action: action || undefined,
      hotelId: hotelId || undefined,
      startDate: range?.[0]?.format('YYYY-MM-DD'),
      endDate: range?.[1]?.format('YYYY-MM-DD'),
    }),
    [page, pageSize, action, hotelId, range],
  );

  const { list, total, loading } = useAuditRecords(input);


  return (
    <div className={styles.page}>
      <Card title="审核记录" bordered={false}>
        <div className={styles.filters}>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && setRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Select
            allowClear
            placeholder="动作类型"
            className={styles.filterSelect}
            value={action}
            options={ACTION_OPTIONS}
            onChange={(v) => {
              setAction(v);
              setPage(1);
            }}
          />
          <Input
            allowClear
            placeholder="酒店ID（可选）"
            className={styles.filterInput}
            value={hotelId}
            onChange={(e) => {
              setHotelId(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={getColumns()}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
      </Card>
    </div>
  );
}

export default AuditRecords;
