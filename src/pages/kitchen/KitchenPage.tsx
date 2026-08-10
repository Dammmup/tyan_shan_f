import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Col, Empty, Flex, Row, Spin, Tag, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { StaffHeader } from '../../components/StaffHeader';
import { kitchenApi } from '../../api/endpoints';
import { connectSocket, joinKitchenRoom } from '../../websocket/socket';
import { useAuthStore } from '../../stores/authStore';
import type { KitchenOrder, KitchenStatus } from '../../types';

const { Text, Title } = Typography;

const COLUMNS: { key: KitchenStatus; next?: KitchenStatus; actionKey: string }[] = [
  { key: 'NEW', next: 'ACCEPTED', actionKey: 'kitchen.accept' },
  { key: 'COOKING', next: 'READY', actionKey: 'kitchen.markReady' },
  { key: 'READY', next: 'SERVED', actionKey: 'kitchen.markServed' },
];

function Ticket({
  order,
  actionLabel,
  onAction,
  loading,
}: {
  order: KitchenOrder;
  actionLabel: string;
  onAction: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        background: '#faf7f1',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        border: '1px solid #d4cbbd',
        boxShadow: '0 6px 14px rgba(20,61,52,0.08)',
      }}
    >
      <Flex justify="space-between" align="center">
        <Title level={4} style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>
          #{order.orderNumber ?? order.orderId.slice(-4)}
        </Title>
        <Tag color="geekblue">{order.productionCenter}</Tag>
      </Flex>
      <Text type="secondary">
        {order.tableName}
      </Text>
      <ul style={{ paddingLeft: 18, margin: '10px 0' }}>
        {order.items.map((item, idx) => (
          <li key={`${item.name}-${idx}`} style={{ marginBottom: 4, fontSize: 16 }}>
            <strong>{item.quantity}×</strong> {item.name}
            {item.modifiers?.length ? (
              <div style={{ color: '#5c6b63', fontSize: 13 }}>
                {item.modifiers
                  .map((m) => (typeof m === 'string' ? m : (m as { name?: string }).name || ''))
                  .filter(Boolean)
                  .join(', ')}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <Button type="primary" block size="large" loading={loading} onClick={onAction} style={{ height: 48 }}>
        {actionLabel}
      </Button>
    </div>
  );
}

export function KitchenPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.restaurantId);

  const listQuery = useQuery({
    queryKey: ['kitchen'],
    queryFn: () => kitchenApi.list(),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const s = connectSocket();
    if (restaurantId) joinKitchenRoom(restaurantId);
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    };
    s.on('KITCHEN_ORDER_CREATED', refresh);
    s.on('KITCHEN_ORDER_UPDATED', refresh);
    s.on('KITCHEN_STATUS_CHANGED', refresh);
    s.on('KITCHEN_UPDATED', refresh);
    s.on('ORDER_UPDATED', refresh);
    return () => {
      s.off('KITCHEN_ORDER_CREATED', refresh);
      s.off('KITCHEN_ORDER_UPDATED', refresh);
      s.off('KITCHEN_STATUS_CHANGED', refresh);
      s.off('KITCHEN_UPDATED', refresh);
      s.off('ORDER_UPDATED', refresh);
    };
  }, [restaurantId, queryClient]);

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: KitchenStatus }) => {
      if (status === 'ACCEPTED') {
        await kitchenApi.accept(id);
        return kitchenApi.cooking(id);
      }
      if (status === 'READY') return kitchenApi.ready(id);
      if (status === 'SERVED') return kitchenApi.served(id);
      return kitchenApi.cooking(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    },
    onError: () => message.error(t('app.error')),
  });

  const byStatus = (status: KitchenStatus) => {
    const all = listQuery.data || [];
    if (status === 'COOKING') {
      return all.filter((o) => o.status === 'COOKING' || o.status === 'ACCEPTED');
    }
    return all.filter((o) => o.status === status);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ebe4d8' }}>
      <StaffHeader title={t('kitchen.title')} />
      <div style={{ padding: 12 }}>
        {listQuery.isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Spin size="large" />
          </Flex>
        ) : (
          <Row gutter={[12, 12]}>
            {COLUMNS.map((col) => (
              <Col xs={24} md={8} key={col.key}>
                <div
                  style={{
                    background: '#143d34',
                    color: '#f4efe6',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginBottom: 10,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {t(`kitchenStatus.${col.key}`)}
                </div>
                {byStatus(col.key).length === 0 ? (
                  <Empty description={t('kitchen.empty')} />
                ) : (
                  byStatus(col.key).map((order) => (
                    <Ticket
                      key={order._id}
                      order={order}
                      actionLabel={t(col.actionKey)}
                      loading={mutation.isPending && mutation.variables?.id === order._id}
                      onAction={() =>
                        mutation.mutate({
                          id: order._id,
                          status: col.next || 'COOKING',
                        })
                      }
                    />
                  ))
                )}
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
