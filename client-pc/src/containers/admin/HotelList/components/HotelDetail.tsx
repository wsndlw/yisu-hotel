import { useState, useEffect } from 'react';

import style from './index.module.css';
import { Button, Image, Descriptions, Drawer, Skeleton, Space, Table, Tag } from 'antd';
import { useHotelDetail } from '../../../../services/hotel';
import { getCityName } from '../../../../constants/cities';

/**
*酒店详细信息页面
*/
const HtelDetail = (props: {
  open: boolean;
  id?: string;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) => {

  const { hotel, loading } = useHotelDetail(props.open ? props.id : undefined);

  return (
    <Drawer
      title="酒店详情"
      open={props.open}
      onClose={props.onClose}
      width={720}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={props.onClose}>返回</Button>
            {hotel?.status === 'REVIEWING' && (
              <>
                <Button danger onClick={() => props.id && props.onReject?.(props.id)}>
                  驳回
                </Button>
                <Button type="primary" onClick={() => props.id && props.onApprove?.(props.id)}>
                  通过
                </Button>
              </>
            )}
          </Space>
        </div>
      }
    >
      {loading ? (
        <Skeleton active />
      ) : (
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="酒店ID" span={2}>
            {hotel?.id}
          </Descriptions.Item>
          <Descriptions.Item label="中文名">{hotel?.nameZh}</Descriptions.Item>
          <Descriptions.Item label="英文名">{hotel?.nameEn || '-'}</Descriptions.Item>
          <Descriptions.Item label="城市">{getCityName(hotel?.city)} {`${(hotel?.city)}`}</Descriptions.Item>
          <Descriptions.Item label="星级">{hotel?.starLevel}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>
            {hotel?.address}
          </Descriptions.Item>
          {/* <Descriptions.Item label="经纬度" span={2}>
            {hotel?.latitude && hotel?.longitude ? `lat=${hotel.latitude}, lng=${hotel.longitude}` : '-'}
          </Descriptions.Item> */}
          <Descriptions.Item label="开业时间">{hotel?.openSince}</Descriptions.Item>
          <Descriptions.Item label="状态">{hotel?.status}</Descriptions.Item>
          <Descriptions.Item label="最低价">{hotel?.miniPrice ? `¥${hotel.miniPrice}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="设施" span={2}>
            <Space wrap>
              {(hotel?.facilities || []).map((f: any) => (
                <Tag key={f.id} color="green">
                  {f.name}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="优惠" span={2}>
            {hotel?.discountInfo || '-'}
          </Descriptions.Item>
        </Descriptions>
      )}

      <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>房型</div>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={(hotel?.roomTypes || []).slice().sort((a: any, b: any) => Number(a.basePrice) - Number(b.basePrice))}
        columns={[
          { title: '房型', dataIndex: 'name' },
          { title: '价格', dataIndex: 'basePrice', render: (v) => `¥${v}` },
          { title: '床型', dataIndex: 'bedType' },
          { title: '人数', dataIndex: 'maxGuests' },
          {
            title: '图片',
            dataIndex: 'images',
            render: (images) => {
              let urls: string[] = [];
              try {
                if (typeof images === 'string') {
                  const parsed = JSON.parse(images);
                  if (Array.isArray(parsed)) {
                    urls = parsed;
                  }
                } else if (Array.isArray(images)) {
                  urls = images;
                }
              } catch {
                // ignore
              }

              if (!urls || urls.length === 0) return '-';

              return (
                <Image.PreviewGroup>
                  <Space>
                    {urls.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        width={40}
                        height={40}
                        style={{ objectFit: 'cover', borderRadius: 2 }}
                        placeholder={<Skeleton.Image active />}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              );
            },
          },
        ]}
      />

      <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>图片</div>
      {(hotel?.images || []).length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap size={8}>
            {(hotel?.images || []).map((img: any) => (
              <Image
                key={img.id}
                width={120}
                height={80}
                src={img.url}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                placeholder={<Skeleton.Image active />}
              />
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : (
        <div style={{ color: '#999' }}>暂无图片</div>
      )}
    </Drawer>
  );
}

export default HtelDetail;
