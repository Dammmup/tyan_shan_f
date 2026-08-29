import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminNavTile, AdminNavTileGrid } from '../../components/AdminNavTile';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { HUB_MENUS, resolveHubAction } from '../../hub/hubConfig';

const MENU_ACCENT: Record<string, string> = {
  order: '#5f8f4e',
  shift: '#b39a72',
  'cash-reports': '#b39a72',
  'view-reports': '#b39a72',
  staff: '#3a6ea5',
  ops: '#8b3a4a',
};

export function HubMenuPage() {
  const { menuId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menu = HUB_MENUS[menuId];

  const title = menu ? t(menu.titleKey) : t('admin.reports');
  const items = useMemo(() => menu?.items || [], [menu]);
  const accent = MENU_ACCENT[menuId] || '#1f6f5b';

  if (!menu) {
    return (
      <AdminPageFrame title={t('app.empty')}>
        <AdminNavTile label={t('hub.toHome')} onClick={() => navigate('/admin')} />
      </AdminPageFrame>
    );
  }

  const goBack = () => {
    if (menu.parentId) navigate(`/admin/hub/${menu.parentId}`);
    else navigate('/admin');
  };

  return (
    <AdminPageFrame title={title}>
      <AdminNavTileGrid>
        <AdminNavTile label={`← ${t('app.back')}`} color="#5a6b64" onClick={goBack} />
        {items.map((item) => (
          <AdminNavTile
            key={item.id}
            label={t(item.labelKey)}
            color={item.id === 'close' ? '#8b3a4a' : accent}
            onClick={() => {
              if (item.menu) {
                navigate(`/admin/hub/${item.menu}`);
                return;
              }
              if (item.action) navigate(resolveHubAction(item.action));
            }}
          />
        ))}
      </AdminNavTileGrid>
    </AdminPageFrame>
  );
}
