import { Button, Card, Form, Input, Radio, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useRegister } from '../../services/auth';
import { useUserStore } from '../../store/user';
import { AUTH_TOKEN } from '../../constants/constants';

export default function Register() {
  const nav = useNavigate();
  const [registerHandler, loading] = useRegister();
  const setToken = useUserStore((state) => state.setToken);

  const onFinish = async (values: any) => {
    await registerHandler(values.username, values.password, values.role, (data: any) => {
      localStorage.setItem(AUTH_TOKEN, data.accessToken);
      const role = data.user?.role;
      if (role) {
        setToken(data.accessToken, role);
      }
      nav(role === 'ADMIN' ? '/admin/hotels' : '/merchant/monitor');
    });
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <HomeOutlined className={styles.logoIcon} />
          </div>
          <Typography.Title level={2} className={styles.title}>
            易宿酒店
          </Typography.Title>
          <Typography.Text type="secondary">注册账号，开始管理您的酒店</Typography.Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} initialValues={{ role: 'MERCHANT' }} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="用户名"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="密码（至少6位）"
            />
          </Form.Item>
          <Form.Item
            name="role"
            label={<span className={styles.roleLabel}>选择角色</span>}
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Radio.Group>
              <Radio value="MERCHANT">
                <span>商户</span>
                <div className={styles.roleDesc}>管理酒店信息</div>
              </Radio>
              <Radio value="ADMIN">
                <span>管理员</span>
                <div className={styles.roleDesc}>审核和发布酒店</div>
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.button}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <Typography.Text type="secondary">
            已有账号？<Link to="/login">立即登录</Link>
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
