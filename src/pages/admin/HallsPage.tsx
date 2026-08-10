import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Col, List, Row, Select, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { hallsApi, tablesApi } from '../../api/endpoints';
import { TABLE_STATUS_COLORS } from '../../utils/roles';

const { Title, Text } = Typography;

export function HallsPage() {
  const { t } = useTranslation();
  const [hallId, setHallId] = useState<string | undefined>();

  const hallsQuery = useQuery({ queryKey: ['halls'], queryFn: hallsApi.list });
  const activeHallId = hallId || hallsQuery.data?.[0]?._id;
  const tablesQuery = useQuery({
    queryKey: ['tables', activeHallId],
    queryFn: () => tablesApi.list(activeHallId),
    enabled: Boolean(activeHallId),
  });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.halls')}
      </Title>
      <Select
        style={{ minWidth: 220, marginBottom: 16 }}
        value={activeHallId}
        onChange={setHallId}
        options={(hallsQuery.data || []).map((h) => ({ value: h._id, label: h.name }))}
      />
      <Row gutter={[12, 12]}>
        {(tablesQuery.data || []).map((table) => (
          <Col xs={12} sm={8} md={6} key={table._id}>
            <div
              style={{
                background: TABLE_STATUS_COLORS[table.status],
                color: '#fff',
                borderRadius: 12,
                padding: 16,
                minHeight: 90,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{table.name}</Text>
              <div>
                <Tag style={{ marginTop: 8 }}>{t(`tableStatus.${table.status}`)}</Tag>
              </div>
            </div>
          </Col>
        ))}
      </Row>
      {!tablesQuery.data?.length && <List locale={{ emptyText: t('app.empty') }} dataSource={[]} />}
    </div>
  );
}
