import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminNavTile, AdminNavTileGrid } from '../../components/AdminNavTile';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { HUB_MENUS, resolveHubAction } from '../../hub/hubConfig';

export function HubMenuPage() {
  const { menuId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menu = HUB_MENUS[menuId];

  const title = menu ? t(menu.titleKey) : t('admin.reports');
  const items = useMemo(() => menu?.items || [], [menu]);

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
            color={item.id === 'close' ? '#8b3a4a' : '#1f6f5b'}
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
