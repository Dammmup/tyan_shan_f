import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminNavTile, AdminNavTileGrid } from '../../components/AdminNavTile';
import { AdminPageFrame } from '../../components/AdminPageFrame';

type HubTile = {
  key: string;
  labelKey: string;
  menu?: string;
  path?: string;
};

type HubGroup = {
  key: string;
  titleKey: string;
  color: string;
  menu?: string;
  tiles: HubTile[];
};

const GROUPS: HubGroup[] = [
  {
    key: 'order',
    titleKey: 'hub.groupOrder',
    color: '#5f8f4e',
    menu: 'order',
    tiles: [
      { key: 'create', labelKey: 'hub.createOrder', path: '/admin/floor' },
      { key: 'edit', labelKey: 'hub.editOrder', path: '/admin/reports/view/open-orders' },
      { key: 'quick', labelKey: 'hub.quickCheck', path: '/admin/pos' },
    ],
  },
  {
    key: 'shift',
    titleKey: 'hub.groupShift',
    color: '#b39a72',
    menu: 'shift',
    tiles: [
      { key: 'cashReports', labelKey: 'hub.cashReports', menu: 'cash-reports' },
      { key: 'viewReports', labelKey: 'hub.viewReports', menu: 'view-reports' },
    ],
  },
  {
    key: 'staff',
    titleKey: 'hub.groupStaff',
    color: '#3a6ea5',
    menu: 'staff',
    tiles: [
      { key: 'register', labelKey: 'hub.staffRegister', path: '/admin/employees' },
      { key: 'time', labelKey: 'hub.timeTracking', path: '/admin/audit' },
    ],
  },
  {
    key: 'ops',
    titleKey: 'hub.groupOps',
    color: '#8b3a4a',
    menu: 'ops',
    tiles: [
      { key: 'closedChecks', labelKey: 'hub.closedChecks', path: '/admin/pos?tab=paid' },
      { key: 'closedOrders', labelKey: 'hub.closedOrders', path: '/admin/reports/view/paid-orders' },
    ],
  },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openTile = (tile: HubTile) => {
    if (tile.menu) {
      navigate(`/admin/hub/${tile.menu}`);
      return;
    }
    if (tile.path) navigate(tile.path);
  };

  return (
    <AdminPageFrame title={t('admin.dashboard')}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {GROUPS.map((group) => (
          <Stack key={group.key} gap={8}>
            <Text
              size="sm"
              c="#4a453f"
              fw={700}
              style={{ cursor: group.menu ? 'pointer' : undefined }}
              onClick={() => group.menu && navigate(`/admin/hub/${group.menu}`)}
            >
              {t(group.titleKey)}
            </Text>
            <AdminNavTileGrid>
              {group.tiles.map((tile) => (
                <AdminNavTile
                  key={tile.key}
                  label={t(tile.labelKey)}
                  color={group.color}
                  onClick={() => openTile(tile)}
                />
              ))}
            </AdminNavTileGrid>
          </Stack>
        ))}
      </SimpleGrid>
    </AdminPageFrame>
  );
}
