import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Col, Empty, Flex, Row, Segmented, Spin, Tag, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { StaffHeader } from '../../components/StaffHeader';
import { kitchenApi } from '../../api/endpoints';
import { connectSocket, joinKitchenRoom } from '../../websocket/socket';
import { useAuthStore } from '../../stores/authStore';
import { centerLabel } from '../../utils/centers';
import { formatDateTime, formatElapsed } from '../../utils/time';
import { isAdminEmbeddedFloor } from '../../utils/paths';
import type { KitchenOrder, KitchenStatus, ProductionCenter } from '../../types';

const { Text, Title } = Typography;

const COLUMNS: { key: KitchenStatus; next?: KitchenStatus; actionKey: string }[] = [
  { key: 'NEW', next: 'ACCEPTED', actionKey: 'kitchen.accept' },
  { key: 'COOKING', next: 'READY', actionKey: 'kitchen.markReady' },
  { key: 'READY', next: 'SERVED', actionKey: 'kitchen.markServed' },
];

const CENTER_FILTERS: Array<{ value: 'ALL' | ProductionCenter; label: string }> = [
  { value: 'ALL', label: 'Все цеха' },
  { value: 'COLD', label: 'Холодный' },
  { value: 'KITCHEN', label: 'Китайский' },
  { value: 'GRILL', label: 'Мангал' },
  { value: 'BAR', label: 'Бар' },
  { value: 'DESSERT', label: 'Десерты' },
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
  const elapsed = formatElapsed(order.createdAt);
  return (
    <div
      style={{
        background: 'var(--card, #faf7f1)',
        borderRadius: 12,
        padding: '14px 12px',
        marginBottom: 10,
        border: '1px solid #d4cbbd',
        boxShadow: '0 4px 12px rgba(20,61,52,0.08)',
        touchAction: 'manipulation',
      }}
    >
      <Flex justify="space-between" align="flex-start" gap={8}>
        <div style={{ minWidth: 0 }}>
          <Title level={5} style={{ margin: 0, fontFamily: 'Fraunces, serif', color: 'var(--brand, #143d34)' }}>
            #{order.orderNumber ?? order.orderId.slice(-4)}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {order.tableName || '—'}
            {order.createdAt ? ` · ${formatDateTime(order.createdAt)}` : ''}
            {elapsed ? ` · ${elapsed}` : ''}
          </Text>
        </div>
        <Tag color="geekblue" style={{ margin: 0 }}>
          {centerLabel(order.productionCenter)}
        </Tag>
      </Flex>
      <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
        {order.items.map((item, idx) => (
          <li key={`${item.name}-${idx}`} style={{ marginBottom: 4, fontSize: 15, fontWeight: 600 }}>
            {item.quantity}× {item.name}
            {item.modifiers?.length ? (
              <div style={{ color: '#5c6b63', fontSize: 12, fontWeight: 400 }}>
                {item.modifiers
                  .map((m) => (typeof m === 'string' ? m : (m as { name?: string }).name || ''))
                  .filter(Boolean)
                  .join(', ')}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <Button type="primary" block size="large" loading={loading} onClick={onAction} style={{ height: 44 }}>
        {actionLabel}
      </Button>
    </div>
  );
}

export function KitchenPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const embedded = isAdminEmbeddedFloor(location.pathname);
  const restaurantId = useAuthStore((s) => s.restaurantId);
  const role = useAuthStore((s) => s.user?.role);
  const roleLockedCenter: ProductionCenter | null =
    role === 'BAR' ? 'BAR' : role === 'KITCHEN' ? 'KITCHEN' : null;
  const [centerFilter, setCenterFilter] = useState<'ALL' | ProductionCenter>(
    roleLockedCenter || 'ALL',
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    if (roleLockedCenter) setCenterFilter(roleLockedCenter);
  }, [roleLockedCenter]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  const filterOptions = useMemo(() => {
    if (role === 'BAR') {
      return [{ value: 'BAR' as const, label: 'Бар' }];
    }
    if (role === 'KITCHEN') {
      return CENTER_FILTERS.filter((f) => f.value !== 'BAR');
    }
    return CENTER_FILTERS;
  }, [role]);

  const filtered = useMemo(() => {
    const all = listQuery.data || [];
    if (role === 'BAR') return all.filter((o) => o.productionCenter === 'BAR');
    if (role === 'KITCHEN') {
      const kitchenSet = all.filter((o) => o.productionCenter !== 'BAR');
      if (centerFilter === 'ALL') return kitchenSet;
      return kitchenSet.filter((o) => o.productionCenter === centerFilter);
    }
    if (centerFilter === 'ALL') return all;
    return all.filter((o) => o.productionCenter === centerFilter);
  }, [listQuery.data, centerFilter, role]);

  const byStatus = (status: KitchenStatus) => {
    if (status === 'COOKING') {
      return filtered.filter((o) => o.status === 'COOKING' || o.status === 'ACCEPTED');
    }
    return filtered.filter((o) => o.status === status);
  };

  return (
    <div style={{ minHeight: embedded ? undefined : '100vh', background: '#ebe4d8' }}>
      {!embedded && <StaffHeader title={t('kitchen.title')} />}
      {embedded && (
        <Title level={3} style={{ marginTop: 0, marginBottom: 12, fontFamily: 'Fraunces, serif', color: 'var(--brand, #143d34)' }}>
          {t('kitchen.title')}
        </Title>
      )}
      <div style={{ padding: embedded ? 0 : 12 }}>
        {filterOptions.length > 1 && (
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <Segmented
              value={centerFilter}
              onChange={(v) => setCenterFilter(v as 'ALL' | ProductionCenter)}
              options={filterOptions}
              size="large"
            />
          </div>
        )}
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
                    fontSize: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{t(`kitchenStatus.${col.key}`)}</span>
                  <span style={{ opacity: 0.8 }}>{byStatus(col.key).length}</span>
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
