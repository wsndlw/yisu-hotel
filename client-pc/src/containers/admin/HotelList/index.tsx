import { useState, useEffect } from 'react';

import style from './index.module.less';
import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tabs } from 'antd';
import HotelDetail from './components/HotelDetail';
import { getColumns, STAR_OPTIONS, TAB_ITEMS } from './constants';
import { useApproveHotel, useHotels, useOfflineHotel, usePublishHotel, useRejectHotel, useRestoreHotel } from '../../../services/hotel';

/**
*酒店列表页，管理员审核
*/
const HotelList = ({ }) => {

  const { message } = App.useApp();

  const [status, setStatus] = useState<string>('REVIEWING');
  const [form] = Form.useForm();

  const [viewId, setViewId] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const values = form.getFieldsValue();
  const queryInput = {
    page: 1,
    pageSize: 20,
    status: status === 'ALL' ? undefined : status,
    keyword: values.keyword || undefined,
    merchantKeyword: values.merchantKeyword || undefined,
    starLevel: values.starLevel === 'ALL' ? undefined : values.starLevel,
  };

  const { list, total, loading, refetch } = useHotels(queryInput.page, queryInput.pageSize, {
    status: queryInput.status,
    keyword: queryInput.keyword,
    merchantKeyword: queryInput.merchantKeyword,
    starLevel: queryInput.starLevel,
  });

  const [approveHandler] = useApproveHotel();
  const [publishHandler] = usePublishHotel();
  const [rejectHandler] = useRejectHotel();
  const [offlineHandler] = useOfflineHotel();
  const [restoreHandler] = useRestoreHotel();

  const onApprove = async (id: string) => {
    await approveHandler(id, async () => {
      await publishHandler(id, () => {
        refetch(queryInput);
      });
    });
  };

  const onReject = async (id: string) => {
    const presetReasons = ['图片含有水印', '价格设置错误', '地址不存在'];
    let selected: string[] = [];
    let extraText = '';

    Modal.confirm({
      title: '驳回酒店',
      icon: null,
      content: (
        <div>
          <div style={{ marginBottom: 8, color: '#666' }}>常见原因（可多选）：</div>
          <div style={{ marginBottom: 12 }}>
            {presetReasons.map((r) => (
              <label key={r} style={{ display: 'block', marginBottom: 6 }}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    selected = checked ? Array.from(new Set([...selected, r])) : selected.filter((x) => x !== r);
                  }}
                />{' '}
                {r}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 8, color: '#666' }}>补充说明（可选）：</div>
          <input
            style={{ width: '100%' }}
            placeholder="例如：请补充酒店门头照片"
            onChange={(e) => {
              extraText = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
      ),
      onOk: async () => {
        const combined = [...selected, extraText?.trim()].filter(Boolean).join('；');
        if (!combined) {
          message.warning('请至少选择或填写一个驳回原因');
          throw new Error('缺少驳回原因');
        }

        await rejectHandler(id, combined, () => {
          refetch(queryInput);
        });
      },
    });
  };

  //发布回调，已和通过合二为一
  const onPublish = async (id: string) => {
    await publishHandler(id, () => {
      refetch(queryInput);
    });
  };

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
          refetch({
            page: queryInput.page,
            pageSize: queryInput.pageSize,
            status: v === 'ALL' ? undefined : v,
            keyword: queryInput.keyword,
            merchantKeyword: queryInput.merchantKeyword,
            starLevel: queryInput.starLevel,
          });
        }}
        items={TAB_ITEMS}
        style={{ marginBottom: 12 }}
      />

      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 12 }}
        onValuesChange={() => {
          const values = form.getFieldsValue();
          refetch({
            page: queryInput.page,
            pageSize: queryInput.pageSize,
            status: queryInput.status,
            keyword: values.keyword || undefined,
            merchantKeyword: values.merchantKeyword || undefined,
            starLevel: values.starLevel === 'ALL' ? undefined : values.starLevel,
          });
        }}
      >
        <Form.Item name="keyword" label="酒店名称" tooltip="支持模糊搜索">
          <Input allowClear placeholder="输入酒店名称" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="merchantKeyword" label="商户名称" tooltip="匹配商户用户名">
          <Input allowClear placeholder="输入商户用户名" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="starLevel" label="星级" initialValue="ALL">
          <Select style={{ width: 140 }} options={STAR_OPTIONS as any} />
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => {
              form.resetFields();
              refetch({
                page: queryInput.page,
                pageSize: queryInput.pageSize,
                status: queryInput.status,
                keyword: undefined,
                merchantKeyword: undefined,
                starLevel: undefined,
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
    </Card>
  );
};

export default HotelList;
