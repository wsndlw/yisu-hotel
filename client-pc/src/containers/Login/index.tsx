import { Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useLogin } from '../../services/auth';
import { useUserStore } from '../../store/user';
import { AUTH_TOKEN } from '../../constants/constants';

export default function Login() {
  const nav = useNavigate();
  const [loginHandler, loading] = useLogin();
  const setToken = useUserStore((state) => state.setToken);

  const onFinish = async (values: any) => {
    await loginHandler(values.username, values.password, (data: any) => {
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
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
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
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className={styles.button}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <Typography.Text type="secondary">
            还没有账号？<Link to="/register">立即注册</Link>
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
