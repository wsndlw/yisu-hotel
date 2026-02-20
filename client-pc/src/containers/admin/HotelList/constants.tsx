import { Space, Tag, type TableProps } from "antd";
import { getCityName } from "../../../constants/cities";
import dayjs from 'dayjs';


interface IColumns {
  onView: (id: string) => void;
  onRestore: (id: string) => void;
  onOffline: (id: string) => void;
  onReject: (id: string) => void;
  onApprove: (id: string) => void;
}

export const STAR_OPTIONS = [
  { label: '全部星级', value: 'ALL' },
  { label: '0星', value: 0 },
  { label: '1星', value: 1 },
  { label: '2星', value: 2 },
  { label: '3星', value: 3 },
  { label: '4星', value: 4 },
  { label: '5星', value: 5 },
];

export const TAB_ITEMS = [
  { key: 'REVIEWING', label: '待审核' },
  { key: 'REJECTED', label: '未通过' },
  { key: 'PUBLISHED', label: '已发布' },
  { key: 'OFFLINE', label: '已下线' },
  { key: 'ALL', label: '全部' },
]

export const formatCity = (code?: string) => {
  if (!code) return '-';
  const name = getCityName(code);
  return `${name}(${code})`;
};

function statusTag(status: string) {
  const map: Record<string, { color: string; text: string }> = {
    DRAFT: { color: 'default', text: '草稿' },
    REVIEWING: { color: 'processing', text: '审核中' },
    REJECTED: { color: 'error', text: '未通过' },
    PUBLISHED: { color: 'success', text: '已发布' },
    OFFLINE: { color: 'warning', text: '已下线' },
  };
  const s = map[status] || { color: 'default', text: status };
  return <Tag color={s.color}>{s.text}</Tag>;
}

export const getColumns = ({
  onView,
  onRestore,
  onOffline,
  onReject,
  onApprove }: IColumns
): TableProps<any>['columns'] => [
  { title: '酒店ID', dataIndex: 'hotelID', width: 220, render: (v: string) => v || '-' },
  { title: '名称', dataIndex: 'nameZh' },
  { title: '商户', dataIndex: ['merchant', 'username'], render: (v: string) => v || '-' },
  { title: '城市', dataIndex: 'city', render: (v: string) => formatCity(v) },
  { title: '星级', dataIndex: 'starLevel' },
  { title: '更新时间', dataIndex: 'updatedAt', render: (v: string) => dayjs(v).format('YYYY年M月D日') },
  { title: '状态', dataIndex: 'status', render: (v: string) => statusTag(v) },
  {
    title: '驳回原因',
    dataIndex: 'rejectReason',
    render: (v: string) => (v ? <span style={{ color: '#cf1322' }}>{v}</span> : '-'),
  },
  {
    title: '操作',
    fixed: 'right' as const,
    width: 200,
    render: (_: any, row: any) => (
      <Space>
        <a onClick={() => onView(row.id)}>查看</a>
        {row.status === 'REVIEWING' && (
          <>
            <a onClick={() => onApprove(row.id)}>通过</a>
            <a onClick={() => onReject(row.id)}>驳回</a>
          </>
        )}
        {row.status === 'PUBLISHED' && <a onClick={() => onOffline(row.id)}>下线</a>}
        {row.status === 'OFFLINE' && <a onClick={() => onRestore(row.id)}>恢复</a>}
      </Space>
    ),
  },
]