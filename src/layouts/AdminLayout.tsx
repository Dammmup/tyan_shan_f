import { useMemo, type CSSProperties } from 'react';
import { ActionIcon, AppShell, Group, Text, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconLogout, IconSettings } from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { disconnectSocket } from '../websocket/socket';

function formatNowRu(d: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isHub = location.pathname === '/admin' || location.pathname === '/admin/';
  const onStaffWorkspace =
    location.pathname.startsWith('/admin/floor') ||
    location.pathname.startsWith('/admin/pos') ||
    location.pathname.startsWith('/admin/kitchen-view');

  const nowLabel = useMemo(() => formatNowRu(new Date()), [location.pathname]);

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      header={{ height: 48 }}
      padding={0}
      style={{ ['--admin-aside-offset']: '0px' } as CSSProperties}
      styles={{
        root: {
          minHeight: '100dvh',
        },
        main: {
          background: '#d8d4cc',
          minHeight: 'calc(100dvh - 48px)',
          paddingBottom: onStaffWorkspace
            ? 'calc(110px + env(safe-area-inset-bottom, 0px))'
            : 0,
          overflow: 'auto',
        },
        header: {
          background: '#2a2a2a',
          borderBottom: 'none',
          zIndex: 200,
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            {!isHub && (
              <ActionIcon
                variant="subtle"
                color="gray"
                c="#f4efe6"
                size="lg"
                aria-label={t('app.back')}
                onClick={() => navigate('/admin')}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
            )}
            <Text c="#f4efe6" fw={700} style={{ letterSpacing: 0.5 }}>
              {t('app.name')}
            </Text>
          </Group>
          <Text c="rgba(244,239,230,0.85)" size="sm" visibleFrom="sm">
            {nowLabel}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Text c="rgba(244,239,230,0.9)" size="sm" lineClamp={1}>
              {user?.name} · {t(`roles.${user?.role}`, { defaultValue: user?.role })}
            </Text>
            <Tooltip label={t('admin.settings')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                c="#f4efe6"
                size="lg"
                aria-label={t('admin.settings')}
                onClick={() => navigate('/admin/settings')}
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('app.logout')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                c="#f4efe6"
                size="lg"
                aria-label={t('app.logout')}
                onClick={() => void onLogout()}
              >
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
