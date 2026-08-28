import { useMemo, type CSSProperties } from 'react';
import {
  ActionIcon,
  AppShell,
  Group,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconLock,
  IconLogout,
  IconRefresh,
  IconSettings,
  IconX,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shiftsApi } from '../api/endpoints';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../utils/time';
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
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isHub = location.pathname === '/admin' || location.pathname === '/admin/';
  /** Floor / POS / kitchen need their own action bars — hide hub footer so it does not cover them. */
  const onStaffWorkspace =
    location.pathname.startsWith('/admin/floor') ||
    location.pathname.startsWith('/admin/pos') ||
    location.pathname.startsWith('/admin/kitchen-view');

  const shiftQuery = useQuery({
    queryKey: ['shift', 'current'],
    queryFn: shiftsApi.current,
    refetchInterval: 30000,
  });

  const nowLabel = useMemo(() => formatNowRu(new Date()), [location.pathname]);

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  const shift = shiftQuery.data;
  const shiftOpen = Boolean(shift && shift.status === 'OPEN');

  return (
    <AppShell
      header={{ height: 48 }}
      footer={onStaffWorkspace ? undefined : { height: 56 }}
      padding={0}
      style={
        {
          ['--admin-aside-offset']: '0px',
          ['--admin-footer-height']: onStaffWorkspace ? '0px' : '56px',
        } as CSSProperties
      }
      styles={{
        main: {
          background: '#d8d4cc',
          minHeight: '100%',
          // Space for fixed staff action bar (order / hall), not hub footer
          paddingBottom: onStaffWorkspace
            ? 'calc(96px + env(safe-area-inset-bottom, 0px))'
            : undefined,
        },
        header: {
          background: '#2a2a2a',
          borderBottom: 'none',
        },
        footer: {
          background: '#cfc9be',
          borderTop: '1px solid #b8b2a6',
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
          <Text c="rgba(244,239,230,0.9)" size="sm" lineClamp={1}>
            {user?.name} · {t(`roles.${user?.role}`, { defaultValue: user?.role })}
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      {!onStaffWorkspace && (
        <AppShell.Footer>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Text size="sm" c="#3a3530">
              {shiftOpen && shift?.openedAt
                ? `${t('hub.shiftOpen')} ${formatDateTime(shift.openedAt)}`
                : t('cashier.noShift')}
            </Text>
            <Group gap={8}>
              <Tooltip label={t('hub.refresh')}>
                <ActionIcon
                  size={40}
                  radius="sm"
                  style={{ background: '#3d6ea5' }}
                  c="#fff"
                  onClick={() => {
                    void queryClient.invalidateQueries();
                  }}
                >
                  <IconRefresh size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('admin.settings')}>
                <ActionIcon
                  size={40}
                  radius="sm"
                  style={{ background: '#3d6ea5' }}
                  c="#fff"
                  onClick={() => navigate('/admin/settings')}
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('app.logout')}>
                <ActionIcon
                  size={40}
                  radius="sm"
                  style={{ background: '#b33a3a' }}
                  c="#fff"
                  onClick={() => void onLogout()}
                >
                  <IconLogout size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('hub.toHome')}>
                <ActionIcon
                  size={40}
                  radius="sm"
                  style={{ background: '#b33a3a' }}
                  c="#fff"
                  onClick={() => navigate('/admin')}
                >
                  <IconX size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('hub.lock')}>
                <ActionIcon
                  size={40}
                  radius="sm"
                  style={{ background: '#b33a3a' }}
                  c="#fff"
                  onClick={() => void onLogout()}
                >
                  <IconLock size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </AppShell.Footer>
      )}
    </AppShell>
  );
}
