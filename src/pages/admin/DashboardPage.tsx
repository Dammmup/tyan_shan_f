import { useQuery } from '@tanstack/react-query';
import { Col, Row, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';

const { Title, Text } = Typography;

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #143d34, #1f6f5b)',
        color: '#f4efe6',
        borderRadius: 14,
        padding: 20,
        minHeight: 120,
      }}
    >
      <Text style={{ color: 'rgba(244,239,230,0.75)' }}>{label}</Text>
      <Title level={2} style={{ color: '#fff', margin: '8px 0 0', fontFamily: 'Fraunces, serif' }}>
        {value}
      </Title>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  });

  if (isLoading) return <Spin />;

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.dashboard')}
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatTile
            label={t('admin.revenueToday')}
            value={formatMoney(data?.revenueTodayTiyns || 0)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile label={t('admin.ordersToday')} value={String(data?.ordersCount || 0)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile label={t('admin.avgCheck')} value={formatMoney(data?.avgCheckTiyns || 0)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatTile label={t('admin.guestsToday')} value={String(data?.guestsCount || 0)} />
        </Col>
      </Row>
    </div>
  );
}
