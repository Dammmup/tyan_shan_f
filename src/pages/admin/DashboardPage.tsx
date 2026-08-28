import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

function TileButton({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
        width: '100%',
        padding: '14px 12px',
        border: 'none',
        borderRadius: 8,
        background: color,
        color: '#fff',
        fontWeight: 600,
        fontSize: 15,
        lineHeight: 1.25,
        textAlign: 'center',
        cursor: 'pointer',
        touchAction: 'manipulation',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      {label}
    </button>
  );
}

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
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={10}>
              {group.tiles.map((tile) => (
                <TileButton
                  key={tile.key}
                  label={t(tile.labelKey)}
                  color={group.color}
                  onClick={() => openTile(tile)}
                />
              ))}
            </SimpleGrid>
          </Stack>
        ))}
      </SimpleGrid>
    </AdminPageFrame>
  );
}
