//抽出来房型列表组件，用于房型编辑，房型运营管理（调整价格之类的）


import React from 'react';
import { Table, Space, type TableProps } from 'antd';
import styles from './index.module.css';

export interface RoomTypeListItem {
  id: string;
  name: string;
  bedType?: string | null;
  basePrice?: number | null;
  maxGuests?: number | null;
  stock?: number | null;
  hasBreakfast?: boolean | null;
  refundable?: boolean | null;
  hasWindow?: boolean | null;
}

interface RoomTypeListProps {
  data: RoomTypeListItem[];
  loading?: boolean;
  operationsOnly?: boolean;
  disabled?: boolean;
  onEdit?: (room: RoomTypeListItem) => void;
  onDelete?: (roomId: string) => void;
  onOps?: (room: RoomTypeListItem) => void;
  onCalendar?: (room: RoomTypeListItem) => void;
}

const bedTypeText = (value?: string | null) => {
  const map: Record<string, string> = {
    KING: '大床',
    TWIN: '双床',
    FAMILY: '家庭房',
    SUITE: '套房',
  };
  if (!value) return '-';
  return map[value] || value;
};

export default function RoomTypeList({
  data,
  loading,
  operationsOnly,
  disabled,
  onEdit,
  onDelete,
  onOps,
  onCalendar,
}: RoomTypeListProps) {
  const columns: TableProps<any>['columns'] = [
    {
      align: 'center',
      title: '房型名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '床型',
      align: 'center',
      dataIndex: 'bedType',
      key: 'bedType',
      render: (v: string) => bedTypeText(v),
    },
    {
      title: '价格（元/晚）',
      align: 'center',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '可住人数',
      align: 'center',
      dataIndex: 'maxGuests',
      key: 'maxGuests'
    },
    {
      title: '库存',
      align: 'center',
      dataIndex: 'stock',
      key: 'stock'
    },
    {
      title: '含早',
      dataIndex: 'hasBreakfast',
      align: 'center',
      key: 'hasBreakfast',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '可退',
      dataIndex: 'refundable',
      align: 'center',
      key: 'refundable',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '有窗',
      dataIndex: 'hasWindow',
      align: 'center',
      key: 'hasWindow',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      align: 'center',
      title: '操作',
      key: 'action',
      render: (_: any, record: RoomTypeListItem) => {
        if (operationsOnly) {
          return (
            <Space>
              <a
                onClick={() => !disabled && onOps?.(record)}
              // className={disabled ? styles.linkDisabled : styles.link}
              >
                运营调整
              </a>
              <a
                onClick={() => !disabled && onCalendar?.(record)}
              // className={disabled ? styles.linkDisabled : styles.link}
              >
                日历管理
              </a>
            </Space>
          );
        }

        return (
          <Space className={styles.actions}>
            <a
              onClick={() => !disabled && onEdit?.(record)}
            // className={disabled ? styles.linkDisabled : styles.link}
            >
              编辑
            </a>
            <a
              onClick={() => !disabled && onDelete?.(record.id)}
              // className={disabled ? styles.linkDisabled : styles.link}
              className={styles.dangerLink}
            >
              删除
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
    />
  );
}
