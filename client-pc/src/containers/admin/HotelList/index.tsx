import { useState, useEffect, useMemo } from 'react';

import styles from './index.module.css';
import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tabs } from 'antd';
import { debounce } from 'lodash';
import HotelDetail from './components/HotelDetail';
import RejectModal from './components/RejectModal';
import { getColumns, STAR_OPTIONS, TAB_ITEMS } from './constants';
import { useApproveHotel, useHotels, useOfflineHotel, usePublishHotel, useRejectHotel, useRestoreHotel } from '../../../services/hotel';
import CitySelect from '../../../componenets/CitySelector';

/**
*酒店列表页，管理员审核
*/
const HotelList = ({ }) => {


  const [status, setStatus] = useState<string>('REVIEWING');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();

  const [viewId, setViewId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string>('');

  const values = form.getFieldsValue();
  const queryInput = {
    page,
    pageSize,
    status: status === 'ALL' ? undefined : status,
    keyword: values.keyword || undefined,
    merchantKeyword: values.merchantKeyword || undefined,
    starLevel: values.starLevel === 'ALL' ? undefined : values.starLevel,
    city: values.city || undefined,
  };

  const { list, total, loading, refetch } = useHotels(queryInput.page, queryInput.pageSize, {
    status: queryInput.status,
    keyword: queryInput.keyword,
    merchantKeyword: queryInput.merchantKeyword,
    starLevel: queryInput.starLevel,
    city: queryInput.city,
  });

  const [approveHandler] = useApproveHotel();
  const [publishHandler] = usePublishHotel();
  const [rejectHandler] = useRejectHotel();
  const [offlineHandler] = useOfflineHotel();
  const [restoreHandler] = useRestoreHotel();

  const debouncedSearch = useMemo(
    () =>
      debounce((values: any) => {
        refetch({
          page: 1,
          pageSize,
          status: status === 'ALL' ? undefined : status,
          keyword: values.keyword || undefined,
          merchantKeyword: values.merchantKeyword || undefined,
          starLevel: values.starLevel === 'ALL' ? undefined : values.starLevel,
          city: values.city || undefined,
        });
      }, 400),
    [refetch, pageSize, status],
  );

  const onApprove = async (id: string) => {
    await approveHandler(id, async () => {
      await publishHandler(id, () => {
        refetch(queryInput);
      });
    });
  };

  const onReject = async (id: string) => {
    setRejectTargetId(id);
    setRejectModalVisible(true);
  };

  //发布回调，已和通过合二为一
  // const onPublish = async (id: string) => {
  //   await publishHandler(id, () => {
  //     refetch(queryInput);
  //   });
  // };

  const onOffline = async (id: string) => {
    await offlineHandler(id, () => {
      refetch(queryInput);
    });
  };

  const onRestore = async (id: string) => {
    await restoreHandler(id, () => {
      refetch(queryInput);
    });
  };

  const onView = (id: string) => {
    setViewId(id);
    setDrawerOpen(true);
  };



  return (
    <Card
      title="酒店审核/发布"
      extra={
        <Space>
          <Button
            onClick={() =>
              refetch({
                page: queryInput.page,
                pageSize: queryInput.pageSize,
                status: queryInput.status,
                keyword: queryInput.keyword,
                merchantKeyword: queryInput.merchantKeyword,
                starLevel: queryInput.starLevel,
              })
            }
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
          refetch({
            page: 1,
            pageSize,
            status: v === 'ALL' ? undefined : v,
            keyword: queryInput.keyword,
            merchantKeyword: queryInput.merchantKeyword,
            starLevel: queryInput.starLevel,
            city: queryInput.city
          });
        }}
        items={TAB_ITEMS}
        className={styles.tabs}
      />

      <Form
        form={form}
        layout="inline"
        className={styles.searchForm}
        onValuesChange={(_, values) => {
          setPage(1);
          debouncedSearch(values);
        }}
      >
        <Form.Item name="keyword" label="酒店名称" tooltip="支持模糊搜索">
          <Input allowClear placeholder="输入酒店名称" className={styles.searchInput} />
        </Form.Item>
        <Form.Item name="merchantKeyword" label="商户名称" tooltip="匹配商户用户名">
          <Input allowClear placeholder="输入商户用户名" className={styles.searchInput} />
        </Form.Item>
        <Form.Item name="starLevel" label="星级" initialValue="ALL">
          <Select className={styles.searchSelect} options={STAR_OPTIONS as any} />
        </Form.Item>
        <Form.Item name="city" label="城市">
          <CitySelect placeholder="全部城市" className={styles.searchInput} />
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => {
              form.resetFields();
              setPage(1);
              refetch({
                page: 1,
                pageSize,
                status: queryInput.status,
                keyword: undefined,
                merchantKeyword: undefined,
                starLevel: undefined,
                city: undefined,
              });
            }}
          >
            重置
          </Button>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={getColumns({ onView, onRestore, onOffline, onReject, onApprove })}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <HotelDetail
        open={drawerOpen}
        id={viewId}
        onClose={() => setDrawerOpen(false)}
        onApprove={(id) => {
          setDrawerOpen(false);
          onApprove(id);
        }}
        onReject={(id) => {
          setDrawerOpen(false);
          onReject(id);
        }}
      />

      <RejectModal
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={async (reason) => {
          await rejectHandler(rejectTargetId, reason, () => {
            refetch(queryInput);
          });
          setRejectModalVisible(false);
        }}
      />
    </Card>
  );
};

export default HotelList;
