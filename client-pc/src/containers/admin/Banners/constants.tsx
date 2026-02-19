import dayjs from 'dayjs';
import { Image, Space, Switch } from 'antd';

interface IColums {
  hotelNameMap: Map<string, string>,
  onToggle: (row: any, enabled: boolean) => void,
  openEdit: (row: any) => void,
  onDelete: (row: any) => void,

}

export const getColumns = ({ hotelNameMap, onToggle, openEdit, onDelete }: IColums): any[] => [
  {
    title: '图片',
    dataIndex: 'imageUrl',
    width: 180,
    render: (url: string) =>
      url ? (
        <Image
          src={url}
          width={140}
          height={70}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{ src: url }}
        />
      ) : (
        '-'
      ),
  },
  {
    title: '关联酒店',
    dataIndex: 'targetHotelId',
    width: 220,
    ellipsis: true,
    render: (id: string) => hotelNameMap.get(id) || `未知酒店（${id}）`,
  },
  {
    title: '开始时间',
    dataIndex: 'startAt',
    width: 170,
    render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    title: '结束时间',
    dataIndex: 'endAt',
    width: 170,
    render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 140,
    sorter: (a: any, b: any) => Number(a.sort ?? 0) - Number(b.sort ?? 0),
    defaultSortOrder: 'ascend',
    render: (v: number) => v ?? 0,
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    width: 140,
    render: (v: boolean, row: any) => <Switch checked={!!v} onChange={(checked) => onToggle(row, checked)} />,
  },
  {
    title: '操作',
    width: 180,
    render: (_: any, row: any) => (
      <Space>
        <a onClick={() => openEdit(row)}>编辑</a>
        <a style={{ color: '#cf1322' }} onClick={() => onDelete(row)}>
          删除
        </a>
      </Space>
    ),
  },
];