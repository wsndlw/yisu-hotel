import styles from './index.module.css';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { useAdminDashboardStats } from '../../../services/stats';

/**
*管理员监控面板（演示页面，部分为模拟数据）
*/
const Dashboard = ({ }) => {

  const { data: stats, loading, refetch } = useAdminDashboardStats(10);

  return (
    <Card
      title="平台仪表盘"
      loading={loading}
      extra={
        <a
          onClick={() => {
            refetch();
          }}
        >
          刷新
        </a>
      }
    >

      <Row gutter={16}>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic title="平台总交易额（演示）" value={stats?.totalRevenue || 0} prefix="¥" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic title="酒店数" value={stats?.hotelCount || 0} suffix="家" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="近7日新增酒店总数"
              value={stats?.newHotelCount || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.warningCard}>
            <Statistic
              title="待审核酒店数"
              value={stats?.pendingHotelCount || 0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className={styles.bottomRow}>
        <Col span={14}>
          <Card title="新增酒店（近7天）" size="small">
            <Table
              rowKey="hotelId"
              size="small"
              pagination={false}
              dataSource={stats?.newHotels || []}
              columns={[
                { title: '序号', render: (_: any, __: any, idx: number) => <Tag color="blue">{idx + 1}</Tag> },
                { title: '酒店', dataIndex: 'hotelName' },
                { title: '商户', dataIndex: 'merchantName' },
                { title: '新增日期', dataIndex: 'createdDate' },
                // { title: '酒店ID', dataIndex: 'hotelId', ellipsis: true },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="每日新增酒店数（近7天）" size="small">
            <Table
              rowKey="date"
              size="small"
              pagination={false}
              dataSource={stats?.dailyNewHotels || []}
              columns={[
                { title: '日期', dataIndex: 'date' },
                { title: '新增酒店数', dataIndex: 'count' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default Dashboard;
