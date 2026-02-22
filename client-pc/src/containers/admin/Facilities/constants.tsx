import { Space, Switch, Tag, type TableProps } from "antd";

import { categoryLabels } from "../../../constants/facilities";
import styles from './index.module.css'

interface IColummn {
  onToggle: (row: any, enabled: boolean) => void,
  openEdit: (row: any) => void,
  onDeleteOne: (row: any) => void
}

export const getColumns = ({ 
  onToggle, 
  openEdit, 
  onDeleteOne 
}: IColummn): TableProps<any>['columns'] => [
  { 
    title: '名称', 
    dataIndex: 'name' ,
    align: 'center',
  },
  {
    width:130,
    align: 'center',
    title: '分类',
    dataIndex: 'category',
    render: (category: string) => (
      <Tag color="blue">{categoryLabels[category] || category}</Tag>
    ),
  },
  {
    align: 'center',
    title: '启用',
    dataIndex: 'enabled',
    render: (v: boolean, row: any) => (
      <Switch checked={!!v} onChange={(checked) => onToggle(row, checked)} />
    ),
  },
  {
    align: 'center',
    title: '更新时间',
    dataIndex: 'updatedAt',
    render: (date: string) => {
      if (!date) return '-';
      const d = new Date(date);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }
  },
  {
    width:180,
    align: 'center',
    title: '操作',
    render: (_: any, row: any) => (
      <Space>
        <a onClick={() => openEdit(row)}>编辑</a>
        <a className={styles.del}  onClick={() => onDeleteOne(row)}>
          删除
        </a>
      </Space>
    ),
  },
];