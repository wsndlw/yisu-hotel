import { useState, useEffect, useMemo } from 'react';

import styles from './index.module.css';
import { useMyHotels } from '../../../services/hotel';
import { LineChart, makeSeries } from './constants';
import { Card, Col, Empty, Row, Select, Table, Typography } from 'antd';

import { useNavigate } from 'react-router-dom';

/**
*商户仪表盘页面，展示经营状况和酒店状态
*/
const Monitor = ({ }) => {
  const navigate = useNavigate();

  // 获取全量酒店用于统计（假设不超过1000家）
  const { list, loading } = useMyHotels(undefined, 1, 1000);
  const hotels = (list || []) as any[];
  const [selectedHotelId, setSelectedHotelId] = useState<string>('ALL');

  const approved = hotels.filter((h) => h.status === 'PUBLISHED');

  const summary = useMemo(() => {
    const map: Record<string, number> = {
      ALL: hotels.length,
      PUBLISHED: 0,
      REVIEWING: 0,
      REJECTED: 0,
      DRAFT: 0,
    };
    hotels.forEach((h) => {
      map[h.status] = (map[h.status] || 0) + 1;
    });
    return map;
  }, [hotels]);


  const seedBase = selectedHotelId === 'ALL' ? 'all-hotels' : selectedHotelId;
  const revenueSeries = makeSeries(`${seedBase}-revenue`, 7, 12000, 68000);
  const occupancySeries = makeSeries(`${seedBase}-occupancy`, 7, 60, 95);


  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Typography.Title level={4} className={styles.sectionTitle}>
          仪表盘
        </Typography.Title>
      </div>

      <Row gutter={16} className={styles.summaryRow}>
        {[
          { key: 'ALL', label: '全部', style: styles.cardAll },
          { key: 'PUBLISHED', label: '已发布', style: styles.cardPublished },
          { key: 'REVIEWING', label: '审核中', style: styles.cardReviewing },
          { key: 'REJECTED', label: '已驳回', style: styles.cardRejected },
          { key: 'DRAFT', label: '草稿', style: styles.cardDraft },
        ].map((item) => (
          <Col flex={1} key={item.key}>
            <Card
              size="small"
              className={item.style}
              hoverable
              onClick={() => {
                navigate(`/merchant/hotels?status=${item.key}`);
              }}
            >
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{summary[item.key] || 0}</div>
                <div>{item.label}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && approved.length === 0 ? (
        <Card>
          <Empty description="请注册您的酒店（至少有一个酒店审核通过后将展示经营数据）" />
        </Card>
      ) : (
        <>
          <div className={styles.chartHeader}>
            <Typography.Title level={5} className={styles.chartTitle}>
              近 7 天经营监控
            </Typography.Title>
            <Select
              className={styles.filterSelect}
              value={selectedHotelId}
              onChange={(v) => setSelectedHotelId(v)}
              options={[
                { value: 'ALL', label: '全部酒店' },
                ...hotels.map((h) => ({ value: h.id, label: h.nameZh || h.name || h.id })),
              ]}
            />
          </div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="营业额监控（近 7 天）" loading={loading}>
                <LineChart data={revenueSeries} color="#1677ff" valueSuffix="元" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="入住率监控（近 7 天）" loading={loading}>
                <LineChart data={occupancySeries} color="#22c55e" valueSuffix="%" />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="营业额排行" loading={loading} className={styles.rankTable}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="hotelId"
                  columns={[
                    { title: '排名', dataIndex: 'rank', width: 60, align: 'center' },
                    { title: '酒店', dataIndex: 'name', align: 'center' },
                    { title: '营业额', dataIndex: 'revenue', width: 120, align: 'center', render: (v) => `¥${v.toLocaleString()}` },
                  ]}
                  dataSource={approved
                    .map((h) => {
                      const sum = makeSeries(`${h.id}-revenue`, 7, 12000, 68000).reduce(
                        (acc, cur) => acc + cur.value,
                        0,
                      );
                      return {
                        hotelId: h.id,
                        name: h.nameZh || h.name || h.id,
                        revenue: sum,
                      };
                    })
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5) // 只显示前5名
                    .map((item, idx) => ({ ...item, rank: idx + 1 }))}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="热门房型销量排行（模拟）" loading={loading} className={styles.rankTable}>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  columns={[
                    { title: '排名', dataIndex: 'rank', width: 60, align: 'center' },
                    { title: '房型名称', dataIndex: 'name', align: 'center' },
                    { title: '所属酒店', dataIndex: 'hotelName', align: 'center' },
                    { title: '销量', dataIndex: 'sales', width: 100, align: 'center', render: (v) => `${v} 间` },
                  ]}
                  dataSource={[
                    { id: '1', name: '豪华大床房', hotelName: approved[0]?.nameZh || '示例酒店A', sales: 128 },
                    { id: '2', name: '商务双床房', hotelName: approved[0]?.nameZh || '示例酒店A', sales: 96 },
                    { id: '3', name: '海景套房', hotelName: approved[1]?.nameZh || '示例酒店B', sales: 85 },
                    { id: '4', name: '行政大床房', hotelName: approved[2]?.nameZh || '示例酒店C', sales: 64 },
                    { id: '5', name: '亲子主题房', hotelName: approved[1]?.nameZh || '示例酒店B', sales: 42 },
                  ].map((item, idx) => ({ ...item, rank: idx + 1 }))}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}


export default Monitor;
