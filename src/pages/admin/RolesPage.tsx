import { useQuery } from '@tanstack/react-query';
import { Collapse, Spin, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { rolesApi } from '../../api/endpoints';

const { Title } = Typography;

export function RolesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.roles')}
      </Title>
      {isLoading ? (
        <Spin />
      ) : (
        <Collapse
          accordion
          items={(data || []).map((role) => ({
            key: role._id,
            label: role.name,
            children: (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(role.permissions || []).map((p) => (
                  <Tag key={p} color="cyan">
                    {p}
                  </Tag>
                ))}
                {!role.permissions?.length && t('app.empty')}
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
