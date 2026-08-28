import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
        minHeight: 72,
        padding: '12px 10px',
        border: 'none',
        borderRadius: 4,
        background: color,
        color: '#fff',
        fontWeight: 600,
        fontSize: 15,
        lineHeight: 1.25,
        textAlign: 'center',
        cursor: 'pointer',
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

  const left = GROUPS.filter((g) => g.key === 'order' || g.key === 'staff');
  const right = GROUPS.filter((g) => g.key === 'shift' || g.key === 'ops');

  const openTile = (tile: HubTile) => {
    if (tile.menu) {
      navigate(`/admin/hub/${tile.menu}`);
      return;
    }
    if (tile.path) navigate(tile.path);
  };

  const renderGroup = (group: HubGroup) => (
    <Stack key={group.key} gap={8} mb="lg">
      <Text
        size="sm"
        c="#4a453f"
        fw={600}
        style={{ cursor: group.menu ? 'pointer' : undefined }}
        onClick={() => group.menu && navigate(`/admin/hub/${group.menu}`)}
      >
        {t(group.titleKey)}
      </Text>
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing={10}>
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
  );

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 8, md: 28 }}>
        <div>{left.map(renderGroup)}</div>
        <div>{right.map(renderGroup)}</div>
      </SimpleGrid>
    </div>
  );
}
