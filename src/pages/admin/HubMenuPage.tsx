import { useMemo, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { HUB_MENUS, resolveHubAction } from '../../hub/hubConfig';

const TILE_BLUE = '#2f6db5';

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
        <button type="button" onClick={() => navigate('/admin')}>
          {t('hub.toHome')}
        </button>
      </AdminPageFrame>
    );
  }

  const goBack = () => {
    if (menu.parentId) navigate(`/admin/hub/${menu.parentId}`);
    else navigate('/admin');
  };

  return (
    <AdminPageFrame title={title}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        <button type="button" onClick={goBack} aria-label={t('app.back')} style={tileStyle()}>
          ← {t('app.back')}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            style={tileStyle()}
            onClick={() => {
              if (item.menu) {
                navigate(`/admin/hub/${item.menu}`);
                return;
              }
              if (item.action) navigate(resolveHubAction(item.action));
            }}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
    </AdminPageFrame>
  );
}

function tileStyle(): CSSProperties {
  return {
    minHeight: 72,
    padding: '14px 12px',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 8,
    background: TILE_BLUE,
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.25,
    textAlign: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
  };
}
