import { useState, useEffect, useMemo } from 'react';

import dayjs from 'dayjs';
import styles from './index.module.css';
import { Card, Space, Button, Table, Modal, Select, DatePicker, InputNumber, Switch, Form, App } from 'antd';
import OSSImageUpload from '../../../componenets/OSSImageUpload';
import { useQuery } from '@apollo/client';
import { HOTELS } from '../../../graphql/hotel';
import { useAllBanners, useUpsertBanner, useSetBannerEnabled, useDeleteBanner } from '../../../services/banner';
import { getColumns } from './constants';

/**
*移动端首页轮播图管理，由商户上传并关联酒店
*/
const Banners = ({}) => {

    const { message } = App.useApp();

  const { data: banners, loading, refetch } = useAllBanners();
  const [upsertBanner, saving] = useUpsertBanner();
  const [setBannerEnabled] = useSetBannerEnabled();
  const [deleteBanner] = useDeleteBanner();

  // 选择酒店下拉：复用 hotels 列表接口（取第一页，按 keyword 可再扩展）
  const { data: hotelsRes, loading: hotelsLoading } = useQuery(HOTELS, {
    fetchPolicy: 'no-cache',
    variables: { input: { page: 1, pageSize: 500 } },
  });

  const hotelOptions = useMemo(() => {
    const list = hotelsRes?.hotels?.data || [];
    return list.map((h: any) => ({ label: h.nameZh, value: h.id }));
  }, [hotelsRes]);

  const hotelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (hotelsRes?.hotels?.data || []).forEach((h: any) => map.set(h.id, h.nameZh));
    return map;
  }, [hotelsRes]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
    setTimeout(() => {
      form.setFieldsValue({ enabled: true, sort: 0, image: [], targetHotelId: undefined });
    }, 0);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        enabled: !!row.enabled,
        sort: row.sort ?? 0,
        targetHotelId: row.targetHotelId,
        timeRange: [row.startAt ? dayjs(row.startAt) : null, row.endAt ? dayjs(row.endAt) : null],
        image: row.imageUrl
          ? [
              {
                uid: `banner-${row.id}`,
                name: 'banner',
                status: 'done',
                url: row.imageUrl,
              },
            ]
          : [],
      });
    }, 0);
  };

  const onSave = async () => {
    const values = await form.validateFields();

    const fileList = values.image || [];
    const imageUrl = fileList?.[0]?.url;
    if (!imageUrl) {
      message.error('请先上传图片');
      return;
    }

    const targetHotelId = values.targetHotelId;
    const title = hotelNameMap.get(targetHotelId) || '首页轮播图';

    const timeRange = values.timeRange as any[] | undefined;
    const startAt = timeRange?.[0] ? (timeRange[0] as any).toISOString?.() : undefined;
    const endAt = timeRange?.[1] ? (timeRange[1] as any).toISOString?.() : undefined;

    const ok = await upsertBanner(
      editing?.id ?? null,
      {
        title,
        imageUrl,
        targetHotelId,
        enabled: !!values.enabled,
        sort: Number(values.sort ?? 0),
        startAt,
        endAt,
      },
      () => {
        refetch();
        setOpen(false);
      },
    );

    return ok;
  };

  const onToggle = async (row: any, enabled: boolean) => {
    await setBannerEnabled(row.id, enabled, () => refetch());
  };

  const onDelete = async (row: any) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteBanner(row.id, () => refetch());
      },
    });
  };

  


 return (
    <>
      <Card
        title="首页轮播图管理（管理员）"
        extra={
          <Space>
            <Button onClick={refetch}>刷新</Button>
            <Button type="primary" onClick={openCreate}>
              新建轮播图
            </Button>
          </Space>
        }
      >
        <Table rowKey="id" loading={loading} dataSource={banners} columns={getColumns({ hotelNameMap, onToggle, openEdit, onDelete })} pagination={false} />
      </Card>

      <Modal
        title={editing ? '编辑轮播图' : '新建轮播图'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
        destroyOnClose
        afterOpenChange={(visible) => {
          if (!visible) form.resetFields();
        }}
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={{ enabled: true, sort: 0 }}>
          <Form.Item
            name="image"
            label="图片"
            valuePropName="value"
            rules={[
              {
                validator: async (_: any, value: any[]) => {
                  if (value?.[0]?.url) return;
                  throw new Error('请上传图片');
                },
              },
            ]}
          >
            <OSSImageUpload
              maxCount={1}
              label="上传图片"
              imgCropAspect={16 / 9}
              cropModalProps={{
                okText: '确认裁剪',
                cancelText: '取消',
                maskClosable: false,
                // 让裁剪弹窗的遮罩更明显，避免和“编辑轮播图”的确定按钮混淆
                maskStyle: { backgroundColor: 'rgba(0,0,0,0.55)' },
                // 提高层级，确保裁剪弹窗压住编辑 Modal
                zIndex: 2000,
                // 始终挂到 body（避免被父 Modal 的 stacking context 影响）
                getContainer: document.body,
              }}
            />
          </Form.Item>

          <Form.Item
            name="targetHotelId"
            label="关联酒店"
            rules={[{ required: true, message: '请选择关联酒店' }]}
          >
            <Select
              loading={hotelsLoading}
              options={hotelOptions}
              placeholder="请选择酒店"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="timeRange" label="投放时间（可选）" tooltip="不填表示不限制投放时间">
            <DatePicker.RangePicker style={{ width: '100%' }} showTime />
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
            tooltip="数值越小越靠前"
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={0} placeholder="数值越小越靠前" />
          </Form.Item>

          <Form.Item name="enabled" label="状态（是否启用）" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}


export default Banners;
