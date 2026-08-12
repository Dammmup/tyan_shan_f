import { useQuery } from '@tanstack/react-query';
import { Button, Col, List, Row, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ordersApi, reportsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import { formatElapsed } from '../../utils/time';
import { waiterHome, waiterOrderPath } from '../../utils/paths';
import { useAuthStore } from '../../stores/authStore';

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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
  });
  const openOrders = useQuery({
    queryKey: ['orders', 'open-dashboard'],
    queryFn: () => ordersApi.list({ open: true }),
    refetchInterval: 15000,
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

      <div style={{ marginTop: 28 }}>
        <Title level={4} style={{ fontFamily: 'Fraunces, serif' }}>
          {t('admin.openTables')}
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {t('admin.openTablesHint')}
        </Text>
        <List
          loading={openOrders.isLoading}
          locale={{ emptyText: t('app.empty') }}
          dataSource={openOrders.data || []}
          renderItem={(order) => (
            <List.Item
              actions={[
                <Button
                  key="open"
                  type="primary"
                  onClick={() => navigate(waiterOrderPath(order._id, user?.role))}
                >
                  {t('waiter.openOrder')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`#${order.number ?? String(order._id).slice(-4)} · ${t(`orderStatus.${order.status}`, { defaultValue: order.status })}`}
                description={`${formatMoney(order.totalTiyns || 0)} · ${formatElapsed(order.createdAt)}`}
              />
            </List.Item>
          )}
        />
        <Button size="large" style={{ marginTop: 8 }} onClick={() => navigate(waiterHome(user?.role))}>
          {t('waiter.title')}
        </Button>
      </div>
    </div>
  );
}
