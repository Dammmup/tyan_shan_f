import type { ReactNode } from 'react';
import { Button, Flex, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { disconnectSocket } from '../websocket/socket';
import { isAdminRole } from '../utils/roles';

const { Text, Title } = Typography;

interface Props {
  title: string;
  extra?: ReactNode;
}

export function StaffHeader({ title, extra }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showFloorSwitch = isAdminRole(user?.role);

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      wrap="wrap"
      gap={12}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 110,
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'linear-gradient(120deg, #143d34 0%, #1f6f5b 55%, #2a5548 100%)',
        color: '#f7f3ea',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        maxWidth: '100vw',
      }}
    >
      <div>
        <Title level={4} style={{ color: '#f7f3ea', margin: 0, fontFamily: 'Fraunces, serif' }}>
          {title}
        </Title>
        <Text style={{ color: 'rgba(247,243,234,0.75)' }}>
          {user?.name} · {t(`roles.${user?.role}`, { defaultValue: user?.role })}
        </Text>
      </div>
      <Flex gap={8} align="center" wrap="wrap">
        {showFloorSwitch && (
          <>
            <Button size="large" onClick={() => navigate('/waiter')}>
              {t('waiter.title')}
            </Button>
            <Button size="large" onClick={() => navigate('/cashier')}>
              {t('cashier.title')}
            </Button>
            <Button size="large" onClick={() => navigate('/kitchen')}>
              {t('kitchen.title')}
            </Button>
            <Button size="large" onClick={() => navigate('/admin')}>
              {t('admin.dashboard')}
            </Button>
          </>
        )}
        {extra}
        <Button icon={<LogoutOutlined />} onClick={() => void onLogout()} size="large">
          {t('app.logout')}
        </Button>
      </Flex>
    </Flex>
  );
}
