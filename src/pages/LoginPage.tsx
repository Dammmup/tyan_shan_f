import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Tabs, Typography } from 'antd';
import { LockOutlined, MailOutlined, NumberOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getHomePath } from '../utils/roles';
import { connectSocket } from '../websocket/socket';

const { Title, Paragraph } = Typography;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loginPin = useAuthStore((s) => s.loginPin);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const afterLogin = (role: string) => {
    connectSocket();
    navigate(getHomePath(role), { replace: true });
  };

  const onPassword = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(values.email, values.password);
      afterLogin(user.role);
    } catch {
      setError(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onPin = async (values: { pin: string }) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginPin(values.pin);
      afterLogin(user.role);
    } catch {
      setError(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        background:
          'radial-gradient(ellipse at 20% 10%, #2f7a66 0%, transparent 45%), radial-gradient(ellipse at 90% 80%, #c4a574 0%, transparent 40%), linear-gradient(160deg, #0f2f28 0%, #1a453a 40%, #ebe4d8 100%)',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          border: 'none',
          boxShadow: '0 20px 50px rgba(15,47,40,0.25)',
          background: 'rgba(250,247,241,0.96)',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 4,
            fontFamily: 'Fraunces, serif',
            color: '#143d34',
            textAlign: 'center',
          }}
        >
          {t('app.name')}
        </Title>
        <Paragraph style={{ textAlign: 'center', color: '#5c6b63', marginBottom: 24 }}>
          {t('auth.loginTitle')}
        </Paragraph>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Tabs
          centered
          items={[
            {
              key: 'password',
              label: t('auth.passwordTab'),
              children: (
                <Form layout="vertical" onFinish={(v) => void onPassword(v)} size="large">
                  <Form.Item
                    name="email"
                    label={t('auth.email')}
                    rules={[{ required: true, message: t('auth.required') }]}
                  >
                    <Input prefix={<MailOutlined />} autoComplete="username" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={t('auth.password')}
                    rules={[{ required: true, message: t('auth.required') }]}
                  >
                    <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48 }}>
                    {t('auth.submit')}
                  </Button>
                </Form>
              ),
            },
            {
              key: 'pin',
              label: t('auth.pinTab'),
              children: (
                <Form layout="vertical" onFinish={(v) => void onPin(v)} size="large">
                  <Form.Item
                    name="pin"
                    label={t('auth.pin')}
                    rules={[{ required: true, message: t('auth.required') }]}
                  >
                    <Input.Password
                      prefix={<NumberOutlined />}
                      inputMode="numeric"
                      maxLength={8}
                      autoComplete="one-time-code"
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48 }}>
                    {t('auth.submit')}
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
