import { useState, useMemo } from 'react';

import style from './index.module.css';
import { App, Button, Card, Form, Input, Modal, Select, Space, Switch, Table } from 'antd';
import { useAllFacilities, useUpsertFacility, useSetFacilityEnabled, useDeleteFacility, useHardDeleteFacility } from '../../../services/facility';
import BatchAddModal from './components/BatchAddModal';
import { getColumns } from './constants';

/**
*设施管理页面，管理员用。
*/
const Facilities = ({ }) => {
  const { data: allFacilities, loading, refetch } = useAllFacilities();

  const [upsertFacility, saving] = useUpsertFacility();
  const [setFacilityEnabled] = useSetFacilityEnabled();
  const [deleteFacility] = useDeleteFacility();
  const [hardDeleteFacility] = useHardDeleteFacility();


  // 单个新增/编辑弹窗
  const [open, setOpen] = useState(false);
  // 批量新增弹窗
  const [batchOpen, setBatchOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const openBatch = () => {
    setBatchOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
    setTimeout(() => {
      form.setFieldsValue({ name: '', type: 'FACILITY', enabled: true });
    }, 0);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        name: row.name,
        type: row.type,
        category: row.category,
        enabled: !!row.enabled
      });
    }, 0);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    const success = await upsertFacility(
      editing?.id ?? null,
      values.name,
      'FACILITY',
      values.category,
      values.enabled,
      () => {
        // 成功后的回调：刷新列表并关闭弹窗
        refetch();
        setOpen(false);
      }
    );
  };

  const onBatchSubmit = async (
    type: string,
    names: string[],
    enabled: boolean,
    category: string,
  ) => {
    for (const name of names) {
      // 批量新增时，id 传 null
      const saved = await upsertFacility(null, name, 'FACILITY', category, enabled);
      if (saved) {
        await setFacilityEnabled(saved.id, enabled);
      }
    }
    refetch();
  };

  const onToggle = async (row: any, enabled: boolean) => {
    await setFacilityEnabled(row.id, enabled, () => {
      refetch();
    });
  };

  const onDeleteOne = async (row: any) => {
    Modal.confirm({
      title: '确认删除',
      content: '请选择删除方式：若该项已被酒店使用，彻底删除将失败，可选择禁用。',
      okText: '彻底删除',
      cancelText: '取消',
      onOk: async () => {
        await hardDeleteFacility(row.id, () => {
          refetch();
        });
      },
      okButtonProps: { danger: true },
      footer: (_, { OkBtn, CancelBtn }) => (
        <Space>
          <OkBtn />
          <Button
            onClick={async () => {
              await deleteFacility(row.id, () => {
                refetch();
              });
              Modal.destroyAll();
            }}
          >
            禁用
          </Button>
          <CancelBtn />
        </Space>
      ),
    });
  };

  const modalTitle = useMemo(() => {
    const action = editing ? '编辑' : '新增';
    const typeName = '设施';
    return `${action}${typeName}`;
  }, [editing]);



  return (
    <>
      <Card
        title="设施管理"
        extra={
          <Space>
            <Button onClick={refetch}>刷新</Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 12 }}>
          <Button type="primary" onClick={openCreate}>
            新增设施
          </Button>
          <Button onClick={() => openBatch()}>批量新增</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={allFacilities}
          columns={getColumns({ onToggle, openEdit, onDeleteOne })}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
        destroyOnClose
        afterOpenChange={(visible) => {
          if (!visible) {
            form.resetFields();
          }
        }}
      >
        <Form form={form} layout="vertical" preserve={false} initialValues={{ enabled: true }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          {/* <Form.Item name="type" label="类型" hidden initialValue={}>
            <Input />
          </Form.Item> */}

          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择设施分类">
              <Select.Option value="BASIC">基础设施（WiFi、停车场、电梯等）</Select.Option>
              <Select.Option value="ROOM">客房设施（空调、热水、吹风机等）</Select.Option>
              <Select.Option value="DINING">餐饮服务（中餐厅、西餐厅、咖啡厅等）</Select.Option>
              <Select.Option value="ENTERTAINMENT">娱乐休闲（健身房、游泳池、SPA等）</Select.Option>
              <Select.Option value="BUSINESS">商务服务（会议室、商务中心等）</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <BatchAddModal
        open={batchOpen}
        title="批量新增设施"
        onClose={() => setBatchOpen(false)}
        onSubmit={(names, enabled, category) => onBatchSubmit('FACILITY', names, enabled, category)} />
    </>
  );
}

export default Facilities;
