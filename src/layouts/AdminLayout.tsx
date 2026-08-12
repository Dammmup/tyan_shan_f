import { useMemo, useState } from 'react';
import {
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconCash,
  IconChartBar,
  IconDiscount2,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconPrinter,
  IconSettings,
  IconShield,
  IconToolsKitchen2,
  IconUsers,
  IconBuildingStore,
  IconHistory,
  IconSofa,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { disconnectSocket } from '../websocket/socket';

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [opened, { toggle, close }] = useDisclosure();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(
    () => [
      { key: '/admin', label: t('admin.dashboard'), icon: IconLayoutDashboard },
      { key: '/admin/floor', label: t('waiter.title'), icon: IconSofa },
      { key: '/admin/pos', label: t('cashier.title'), icon: IconCash },
      { key: '/admin/kitchen-view', label: t('kitchen.title'), icon: IconToolsKitchen2 },
      { key: '/admin/menu', label: t('admin.menu'), icon: IconToolsKitchen2 },
      { key: '/admin/halls', label: t('admin.halls'), icon: IconBuildingStore },
      { key: '/admin/employees', label: t('admin.employees'), icon: IconUsers },
      { key: '/admin/roles', label: t('admin.roles'), icon: IconShield },
      { key: '/admin/printers', label: t('admin.printers'), icon: IconPrinter },
      { key: '/admin/discounts', label: t('admin.discounts'), icon: IconDiscount2 },
      { key: '/admin/reports', label: t('admin.reports'), icon: IconChartBar },
      { key: '/admin/audit', label: t('admin.audit'), icon: IconHistory },
      { key: '/admin/settings', label: t('admin.settings'), icon: IconSettings },
    ],
    [t],
  );

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  const asideCollapsed = !isMobile && collapsed;

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: asideCollapsed ? 80 : 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background:
            'radial-gradient(ellipse at top left, rgba(31,111,91,0.08), transparent 45%), linear-gradient(180deg, #f3eee4 0%, #ebe4d8 100%)',
          minHeight: '100vh',
        },
        header: {
          background: 'linear-gradient(90deg, #143d34, #1f6f5b)',
          borderBottom: 'none',
        },
        navbar: {
          background: '#143d34',
          borderInlineEnd: 'none',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {isMobile ? (
              <Burger opened={opened} onClick={toggle} color="#f4efe6" size="sm" />
            ) : (
              <Button
                variant="subtle"
                color="gray"
                c="#f4efe6"
                onClick={() => setCollapsed((v) => !v)}
                leftSection={<IconMenu2 size={18} />}
              >
                {asideCollapsed ? '' : t('app.name')}
              </Button>
            )}
            <Text c="#f4efe6" size="sm">
              {user?.name} · {t(`roles.${user?.role}`, { defaultValue: user?.role })}
            </Text>
          </Group>
          <Button
            variant="light"
            color="gray"
            leftSection={<IconLogout size={16} />}
            onClick={() => void onLogout()}
          >
            {t('app.logout')}
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section mb="md" px="xs">
          <Title order={3} c="#f4efe6" style={{ fontFamily: 'Fraunces, serif' }}>
            {asideCollapsed ? 'TS' : t('app.name')}
          </Title>
          {!asideCollapsed && (
            <Text size="xs" c="rgba(244,239,230,0.65)">
              {t('app.tagline')}
            </Text>
          )}
        </AppShell.Section>
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={4}>
            {items.map((item) => {
              const active =
                item.key === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.key);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  active={active}
                  label={asideCollapsed ? undefined : item.label}
                  leftSection={<Icon size={18} stroke={1.6} />}
                  onClick={() => {
                    navigate(item.key);
                    close();
                  }}
                  color="teal"
                  variant="filled"
                  styles={{
                    root: {
                      borderRadius: 10,
                      color: '#f4efe6',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
