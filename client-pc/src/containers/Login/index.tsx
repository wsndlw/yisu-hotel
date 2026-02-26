import { Button, Card, Form, Input, Tabs, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, HomeOutlined, MailOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useEmailLogin, useLogin, useSendEmailCode } from '../../services/auth';
import { useUserStore } from '../../store/user';
import { useState, useEffect } from 'react';

export default function Login() {
  const nav = useNavigate();
  const [loginHandler, loading] = useLogin();
  const [sendEmailCode, sending] = useSendEmailCode();
  const [emailLoginHandler, emailLoading] = useEmailLogin();
  const setToken = useUserStore((state) => state.setToken);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('password');
  const [emailForm] = Form.useForm();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onPasswordLogin = async (values: any) => {
    await loginHandler(values.username, values.password, (data: any) => {
      const role = data.user?.role;
      if (role) setToken(data.accessToken, role);
      nav(role === 'ADMIN' ? '/admin/dashboard' : '/merchant/monitor');
    });
  };

  const onEmailLogin = async (values: any) => {
    await emailLoginHandler(values.email, values.code, (data: any) => {
      const role = data.user?.role;
      if (role) {
        setToken(data.accessToken, role);
        nav(role === 'ADMIN' ? '/admin/dashboard' : '/merchant/monitor');
      } else {
        // 如果没有角色信息，默认商家
        setToken(data.accessToken, 'MERCHANT');
        nav('/merchant/monitor');
      }
    });
  };

  const handleSendCode = async () => {
    try {
      const values = await emailForm.validateFields(['email']);
      const success = await sendEmailCode(values.email);
      if (success) setCountdown(60);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}><HomeOutlined className={styles.logoIcon} /></div>
          <Typography.Title level={2} className={styles.title}>易宿酒店预定平台</Typography.Title>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
          <Tabs.TabPane tab="密码登录" key="password">
            <Form layout="vertical" onFinish={onPasswordLogin} size="large">
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { whitespace: true, message: '用户名不能为空' }
                ]}
              >
                <Input prefix={<UserOutlined className={styles.inputIcon} />} placeholder="用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined className={styles.inputIcon} />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} className={styles.button}>登录</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="邮箱登录" key="email">
            <Form form={emailForm} layout="vertical" onFinish={onEmailLogin} size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined className={styles.inputIcon} />} placeholder="邮箱地址" />
              </Form.Item>
              <Form.Item
                name="code"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码为6位数字' }
                ]}
              >
                <Input prefix={<LockOutlined className={styles.inputIcon} />} placeholder="验证码" addonAfter={
                  <Button type="link" size="small" onClick={handleSendCode} disabled={countdown > 0 || sending} className={styles.codeButton}>
                    {countdown > 0 ? countdown + '秒' : '发送验证码'}
                  </Button>
                } />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={emailLoading} className={styles.button}>登录</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
        <div className={styles.footer}>
          <Typography.Text type="secondary">还没有账号？<Link to="/register">立即注册</Link></Typography.Text>
        </div>
      </Card>
    </div>
  );
}