import dayjs from 'dayjs';
import { Tag, type TableProps } from 'antd';


export const ACTION_OPTIONS = [
  { label: '提交审核', value: 'SUBMIT' },
  { label: '通过', value: 'APPROVE' },
  { label: '驳回', value: 'REJECT' },
  { label: '发布', value: 'PUBLISH' },
  { label: '下线', value: 'OFFLINE' },
  { label: '恢复', value: 'RESTORE' },
  { label: '撤回', value: 'WITHDRAW' },
  { label: '申请下线', value: 'OFFLINE_REQUEST' },
];

export const getColumns = (): TableProps<any>['columns'] => [
    {
      align: 'center',
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      align: 'center',
      title: '酒店',
      dataIndex: 'hotelName',
      render: (_: any, row: any) => row.hotelName || row.hotelId,
    },
    {
      align: 'center',
      title: '动作',
      dataIndex: 'action',
      width: 130,
      render: (v: string) => {
        const label = ACTION_OPTIONS.find((o) => o.value === v)?.label || v;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      align: 'center',
      title: '操作人',
      dataIndex: 'operatorName',
      width: 120,
      render: (_: any, row: any) => row.operatorName || row.operatorId || '-',
    },
    {
      align: 'center',
      title: '原因/备注',
      dataIndex: 'reason',
      render: (v: string) => v || '-',
    },
  ];
