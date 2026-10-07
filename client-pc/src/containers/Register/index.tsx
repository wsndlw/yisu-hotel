import { Button, Card, Form, Input, Radio, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { LockOutlined, HomeOutlined, MailOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useEmailRegister, useSendEmailCode } from '../../services/auth';
import { useUserStore } from '../../store/user';
import { useState } from 'react';

export default function Register() {
  const nav = useNavigate();
  const [emailRegisterHandler, loading] = useEmailRegister();
  const setToken = useUserStore((state) => state.setToken);
  const [sendEmailCode, sendingEmail] = useSendEmailCode();
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    await emailRegisterHandler(
      values.email,
      values.emailCode,
      values.password,
      values.role,
      (data: any) => {
        const role = values.role;
        if (role) {
          setToken(data, role);
        }
        nav(role === 'ADMIN' ? '/admin/dashboard' : '/merchant/monitor');
      }
    );
  };

  // ===== 邮箱验证码功能：发送验证码 =====
  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue('email');
      await form.validateFields(['email']);
      const success = await sendEmailCode(email);
      if (success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev: number) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      // 验证失败
    }
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

        <Form layout="vertical" onFinish={onFinish} form={form} initialValues={{ role: 'MERCHANT' }} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined className={styles.inputIcon} />}
              placeholder="邮箱地址"
            />
          </Form.Item>
          <Form.Item
            name="emailCode"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              placeholder="邮箱验证码"
              suffix={
                <Button
                  type="link"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || sendingEmail}
                  style={{ padding: 0 }}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              {
                pattern: /^(?![0-9]+$)(?![a-z]+$)[a-z0-9]{6,}$/,
                message: '有且只能包含小写字母和数字，长度大于 6',
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="有且只能包含小写字母和数字，长度大于 6"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="确认密码"
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
