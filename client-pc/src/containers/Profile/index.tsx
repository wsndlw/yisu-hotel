import React, { useEffect } from 'react';
import { App, Button, Card, Form, Input, Space } from 'antd';
import { useMe } from '../../services/auth';
import { useUpdateMe } from '../../services/user';
import OSSImageUpload from '../../componenets/OSSImageUpload';

export default function Profile() {
  const { data, loading, refetch } = useMe();
  const [updateMe, saving] = useUpdateMe();

  const user = data;
  const [form] = Form.useForm();

  useEffect(() => {
    if (!loading && user) {
      form.setFieldsValue({
        username: user.username,
        role: user.role,
        avatarFiles: user.avatarUrl ? [{ uid: '1', name: 'avatar', url: user.avatarUrl }] : []
      });
    }
  }, [loading, user, form]);

  const onSave = async () => {
    const values = await form.validateFields();
    const input: any = {};
    //修改了则保存数据，用于更新
    if (values.username && values.username !== user?.username) input.username = values.username;
    if (values.password) input.password = values.password;
    const avatarFiles = values.avatarFiles || [];
    input.avatarUrl = avatarFiles.length ? avatarFiles[0].url : null;

    await updateMe(input, () => {
      form.setFieldsValue({ password: '' });
      refetch();
    });
  };

  return (
    <Card title="个人信息" loading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item name="role" label="角色">
          <Input disabled />
        </Form.Item>
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="头像" name="avatarFiles" getValueFromEvent={(e) => e}>
          <OSSImageUpload maxCount={1} label="上传头像" imgCropAspect={1} />
        </Form.Item>

        <Form.Item name="password" label="新密码（至少6位）" rules={[{ min: 6, message: '至少6位' }]}>
          <Input.Password placeholder="不修改请留空" />
        </Form.Item>
        <Space>
          <Button type="primary" onClick={onSave} loading={saving}>
            保存
          </Button>
          <Button onClick={() => refetch()}>刷新</Button>
        </Space>
      </Form>
    </Card>
  );
}
