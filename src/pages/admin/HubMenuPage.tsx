import { useMemo, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      <div style={{ padding: 24 }}>
        <p>{t('app.empty')}</p>
        <button type="button" onClick={() => navigate('/admin')}>
          {t('hub.toHome')}
        </button>
      </div>
    );
  }

  const goBack = () => {
    if (menu.parentId) navigate(`/admin/hub/${menu.parentId}`);
    else navigate('/admin');
  };

  return (
    <div style={{ minHeight: 'calc(100dvh - 48px)', background: '#cfd6e4' }}>
      <div
        style={{
          background: '#1e1e1e',
          color: '#fff',
          textAlign: 'center',
          padding: '10px 16px',
          fontWeight: 600,
          fontSize: 18,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          padding: 8,
          alignItems: 'stretch',
        }}
      >
        <button type="button" onClick={goBack} aria-label={t('app.back')} style={tileStyle(72)}>
          ←
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            style={tileStyle(item.id === 'close' ? 160 : 140)}
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
    </div>
  );
}

function tileStyle(minWidth: number): CSSProperties {
  return {
    minWidth,
    flex: '1 1 120px',
    maxWidth: 220,
    minHeight: 88,
    padding: '12px 10px',
    border: '1px solid rgba(0,0,0,0.15)',
    background: TILE_BLUE,
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.25,
    textAlign: 'center',
    cursor: 'pointer',
  };
}
