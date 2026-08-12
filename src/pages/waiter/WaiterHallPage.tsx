import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Flex,
  InputNumber,
  Modal,
  Select,
  Spin,
  Typography,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { StaffHeader } from '../../components/StaffHeader';
import { hallsApi, ordersApi, tablesApi } from '../../api/endpoints';
import { TABLE_STATUS_COLORS } from '../../utils/roles';
import { formatDateTime, formatElapsed } from '../../utils/time';
import { connectSocket, joinRestaurantRoom } from '../../websocket/socket';
import { useAuthStore } from '../../stores/authStore';
import { useEffect } from 'react';
import type { Table } from '../../types';

const { Text } = Typography;

export function WaiterHallPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.restaurantId);
  const [hallId, setHallId] = useState<string | undefined>();
  const [createFor, setCreateFor] = useState<Table | null>(null);
  const [guests, setGuests] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = connectSocket();
    if (restaurantId) joinRestaurantRoom(restaurantId);
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
    };
    s.on('TABLE_UPDATED', refresh);
    s.on('ORDER_UPDATED', refresh);
    s.on('PAYMENT_CREATED', refresh);
    return () => {
      s.off('TABLE_UPDATED', refresh);
      s.off('ORDER_UPDATED', refresh);
      s.off('PAYMENT_CREATED', refresh);
    };
  }, [restaurantId, queryClient]);

  const hallsQuery = useQuery({
    queryKey: ['halls'],
    queryFn: hallsApi.list,
  });

  const activeHallId = hallId || hallsQuery.data?.[0]?._id;

  const tablesQuery = useQuery({
    queryKey: ['tables', activeHallId],
    queryFn: () => tablesApi.list(activeHallId),
    enabled: Boolean(activeHallId),
  });

  const tables = tablesQuery.data || [];

  const openOrdersQuery = useQuery({
    queryKey: ['orders', 'open-hall'],
    queryFn: () => ordersApi.list({ open: true }),
    refetchInterval: 20000,
  });

  const orderTimeByTable = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of openOrdersQuery.data || []) {
      if (o.tableId && o.createdAt) map.set(o.tableId, o.createdAt);
    }
    return map;
  }, [openOrdersQuery.data]);

  const hallOptions = useMemo(
    () => (hallsQuery.data || []).map((h) => ({ value: h._id, label: h.name })),
    [hallsQuery.data],
  );

  const openTable = async (table: Table) => {
    if (table.status === 'DISABLED') return;

    if (table.currentOrderId) {
      navigate(`/waiter/orders/${table.currentOrderId}`);
      return;
    }

    if (table.status === 'OCCUPIED') {
      // try find open order for table
      try {
        const orders = await ordersApi.list({ open: true });
        const found = orders.find((o) => o.tableId === table._id);
        if (found) {
          navigate(`/waiter/orders/${found._id}`);
          return;
        }
      } catch {
        // fall through to create
      }
    }

    setCreateFor(table);
    setGuests(table.capacity || 2);
  };

  const createOrder = async () => {
    if (!createFor) return;
    setBusy(true);
    try {
      const order = await ordersApi.create({ tableId: createFor._id, guests });
      message.success(t('app.success'));
      setCreateFor(null);
      navigate(`/waiter/orders/${order._id}`);
    } catch {
      message.error(t('app.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ebe4d8' }}>
      <StaffHeader
        title={t('waiter.title')}
        extra={
          <Select
            style={{ minWidth: 160 }}
            options={hallOptions}
            value={activeHallId}
            onChange={setHallId}
            size="large"
          />
        }
      />

      <div style={{ padding: 16 }}>
        {(hallsQuery.isLoading || tablesQuery.isLoading) && (
          <Flex justify="center" style={{ padding: 48 }}>
            <Spin size="large" />
          </Flex>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 12,
          }}
        >
          {tables.map((table) => {
            const color = TABLE_STATUS_COLORS[table.status] || '#8a8175';
            const openedAt =
              orderTimeByTable.get(table._id) ||
              (table.currentOrderId
                ? openOrdersQuery.data?.find((o) => o._id === table.currentOrderId)?.createdAt
                : undefined);
            return (
              <button
                key={table._id}
                type="button"
                onClick={() => void openTable(table)}
                style={{
                  minHeight: 110,
                  borderRadius: 14,
                  border: 'none',
                  background: color,
                  color: '#fff',
                  cursor: table.status === 'DISABLED' ? 'not-allowed' : 'pointer',
                  opacity: table.status === 'DISABLED' ? 0.55 : 1,
                  boxShadow: '0 8px 18px rgba(20,61,52,0.18)',
                  padding: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Fraunces, serif' }}>
                  {table.name}
                </div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block' }}>
                  {t(`tableStatus.${table.status}`)}
                </Text>
                {openedAt ? (
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                    {formatDateTime(openedAt)} · {formatElapsed(openedAt)}
                  </Text>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        open={Boolean(createFor)}
        title={t('waiter.createOrder')}
        onCancel={() => setCreateFor(null)}
        onOk={() => void createOrder()}
        confirmLoading={busy}
        okText={t('waiter.createOrder')}
      >
        <Text>
          {createFor?.name} — {t('waiter.guests')}
        </Text>
        <InputNumber
          min={1}
          max={30}
          value={guests}
          onChange={(v) => setGuests(Number(v) || 1)}
          style={{ width: '100%', marginTop: 12 }}
          size="large"
        />
      </Modal>
    </div>
  );
}
