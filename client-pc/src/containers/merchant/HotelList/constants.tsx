import { DownOutlined } from "@ant-design/icons";
import { Dropdown, Modal, Space, Tag, type TableProps } from "antd";
import { Link } from "react-router-dom";
import styles from './index.module.css';
import { formatCity } from "../../admin/HotelList/constants";
import { statusTag } from "../../../utils/tags";






interface IColumns {
  onRequestOffline: (id: string) => void,
  onSubmit: (id: string) => void,
  onDelete: (id: string) => void,
  onWithdraw: (id: string) => void,
}


export const getColumns = ({
  onRequestOffline,
  onSubmit,
  onDelete,
  onWithdraw
}: IColumns): TableProps<any>['columns'] => [
    {
      title: '名称',
      align: 'center',
      dataIndex: 'nameZh',
    },
    {
      title: '城市',
      dataIndex: 'city',
      align: 'center',
      render: (v: string) => formatCity(v)
    },
    {
      title: '星级',
      align: 'center',
      dataIndex: 'starLevel'
    },
    {
      title: '最低价',
      dataIndex: 'miniPrice',
      align: 'center',
      render: (v: string) => (v ? `¥${v}` : '-')
    },
    {
      title: '收藏数',
      dataIndex: 'favoriteCount',
      align: 'center',
      render: (_: any, record: any) => (
        record.status === 'PUBLISHED' ? record.favoriteCount ?? 0 : '-'
      )

    },
    {
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (v, row: any) => statusTag(v, row?.hasEverPublished)
    },
    {
      title: '操作',
      align: 'center',
      render: (_: any, row: any) => (
        <Space>
          {row.status === 'PUBLISHED' && (
            <>
              <Link to={`/merchant/hotels/${row.id}/room-operations`}>日常管理</Link>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: <Link to={`/merchant/hotels/${row.id}`}>编辑</Link>,
                    },
                    {
                      key: 'offline',
                      label: <a className={styles.dangerLink} onClick={() => onRequestOffline(row.id)} >下架</a>,
                    },
                  ],
                }}
              >
                <a onClick={(e) => e.preventDefault()}>
                  更多 <DownOutlined />
                </a>
              </Dropdown>
            </>
          )}
          {row.status === 'REVIEWING' && (
            <>
              <Link to={`/merchant/hotels/${row.id}`}>查看</Link>
              <a onClick={() => onWithdraw(row.id)}>撤回</a>
            </>
          )}
          {row.status === 'DRAFT' && (
            <>
              <Link to={`/merchant/hotels/${row.id}`}>编辑</Link>
              <a onClick={() => onSubmit(row.id)}>提交审核</a>
              {!row.hasEverPublished && (
                <a onClick={() => onDelete(row.id)} className={styles.dangerLink}>删除</a>
              )}
            </>
          )}
          {row.status === 'REJECTED' && (
            <>
              <a
                onClick={() =>
                  Modal.info({
                    title: '驳回原因',
                    content: row.rejectReason || '暂无原因',
                  })
                }
              >
                查看原因
              </a>
              <Link to={`/merchant/hotels/${row.id}`}>重新编辑</Link>
            </>
          )}
          {row.status === 'OFFLINE' && (
            <>
              <a onClick={() => onSubmit(row.id)}>申请上架</a>
              <Link to={`/merchant/hotels/${row.id}`}>编辑</Link>
            </>
          )}
        </Space>
      ),
    },
  ]
