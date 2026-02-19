import { App, Form, Input, Modal, Switch, Select } from 'antd';
import { useState } from 'react';

/**
 * 批量新增设施弹窗（先选分类再填写）
 */
export default function BatchAddModal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (names: string[], enabled: boolean, category: string) => Promise<void>;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onOk = async () => {
    const values = await form.validateFields();
    const raw = (values.names || '') as string;
    const enabled = !!values.enabled;
    const category = values.category as string;

    const parts = raw
      .split(/[\s,，\n\r]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    const uniq = Array.from(new Set(parts));
    if (uniq.length === 0) {
      message.warning('请输入至少一个名称');
      return;
    }

    setLoading(true);
    try {
      await props.onSubmit(uniq, enabled, category);
      message.success('批量新增完成');
      form.resetFields();
      props.onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={props.title} open={props.open} onCancel={props.onClose} onOk={onOk} confirmLoading={loading} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ enabled: true }}>
        <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类">
            <Select.Option value="BASIC">基础设施（WiFi、停车场、电梯等）</Select.Option>
            <Select.Option value="ROOM">客房设施（空调、热水、吹风机等）</Select.Option>
            <Select.Option value="DINING">餐饮服务（中餐厅、西餐厅、咖啡厅等）</Select.Option>
            <Select.Option value="ENTERTAINMENT">娱乐休闲（健身房、游泳池、SPA等）</Select.Option>
            <Select.Option value="BUSINESS">商务服务（会议室、商务中心等）</Select.Option>
            <Select.Option value="OTHER">其他</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="names" label="名称列表" rules={[{ required: true, message: '请输入名称列表' }]}>
          <Input.TextArea rows={5} placeholder="支持逗号/中文逗号/空格/换行分隔" />
        </Form.Item>
        <Form.Item name="enabled" label="是否启用" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
