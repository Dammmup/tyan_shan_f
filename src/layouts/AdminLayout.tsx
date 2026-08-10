import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Button, Typography, Flex, theme } from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  PercentageOutlined,
  LogoutOutlined,
  MenuOutlined,
  PrinterOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { disconnectSocket } from '../websocket/socket';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const items = useMemo(
    () => [
      { key: '/admin', icon: <DashboardOutlined />, label: t('admin.dashboard') },
      { key: '/admin/menu', icon: <UnorderedListOutlined />, label: t('admin.menu') },
      { key: '/admin/halls', icon: <ShopOutlined />, label: t('admin.halls') },
      { key: '/admin/employees', icon: <TeamOutlined />, label: t('admin.employees') },
      { key: '/admin/roles', icon: <UserOutlined />, label: t('admin.roles') },
      { key: '/admin/printers', icon: <PrinterOutlined />, label: t('admin.printers') },
      { key: '/admin/discounts', icon: <PercentageOutlined />, label: t('admin.discounts') },
      { key: '/admin/reports', icon: <BarChartOutlined />, label: t('admin.reports') },
      { key: '/admin/audit', icon: <AuditOutlined />, label: t('admin.audit') },
      { key: '/admin/settings', icon: <SettingOutlined />, label: t('admin.settings') },
    ],
    [t],
  );

  const selected = items.find((i) =>
    i.key === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(i.key),
  )?.key;

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed || mobile}
        onCollapse={setCollapsed}
        breakpoint="lg"
        width={240}
        style={{ background: '#163f35' }}
      >
        <div style={{ padding: '18px 16px 8px' }}>
          <Title
            level={4}
            style={{
              color: '#f4efe6',
              margin: 0,
              fontFamily: 'Fraunces, serif',
              fontSize: collapsed || mobile ? 16 : 22,
            }}
          >
            {t('app.name')}
          </Title>
          {!collapsed && !mobile && (
            <Text style={{ color: 'rgba(244,239,230,0.7)', fontSize: 12 }}>{t('app.tagline')}</Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected || '/admin']}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: 'linear-gradient(90deg, #143d34, #1f6f5b)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Flex align="center" gap={12}>
            {mobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: '#fff' }} />}
                onClick={() => setCollapsed((c) => !c)}
              />
            )}
            <Text style={{ color: '#f4efe6' }}>
              {user?.name} · {t(`roles.${user?.role}`, { defaultValue: user?.role })}
            </Text>
          </Flex>
          <Button icon={<LogoutOutlined />} onClick={() => void onLogout()}>
            {t('app.logout')}
          </Button>
        </Header>
        <Content style={{ margin: 16, padding: 20, background: token.colorBgContainer, borderRadius: 12 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
