import { useEffect, useMemo, useState } from 'react';
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
import type { Order, Table } from '../../types';

const { Text } = Typography;

function idOf(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function WaiterHallPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.restaurantId || s.user?.restaurantId);
  const [hallId, setHallId] = useState<string | undefined>();
  const [createFor, setCreateFor] = useState<Table | null>(null);
  const [guests, setGuests] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = connectSocket();
    if (restaurantId) joinRestaurantRoom(restaurantId);
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    };
    s.on('TABLE_UPDATED', refresh);
    s.on('ORDER_UPDATED', refresh);
    s.on('ORDER_CREATED', refresh);
    s.on('PAYMENT_CREATED', refresh);
    s.on('ORDER_CANCELLED', refresh);
    s.on('ORDER_PAID', refresh);
    return () => {
      s.off('TABLE_UPDATED', refresh);
      s.off('ORDER_UPDATED', refresh);
      s.off('ORDER_CREATED', refresh);
      s.off('PAYMENT_CREATED', refresh);
      s.off('ORDER_CANCELLED', refresh);
      s.off('ORDER_PAID', refresh);
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
    refetchInterval: 15000,
  });

  const tables = tablesQuery.data || [];

  const openOrdersQuery = useQuery({
    queryKey: ['orders', 'open-hall'],
    queryFn: () => ordersApi.list({ open: true }),
    refetchInterval: 10000,
  });

  const orderByTableId = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of openOrdersQuery.data || []) {
      const tid = idOf(o.tableId);
      if (tid) map.set(tid, o);
    }
    return map;
  }, [openOrdersQuery.data]);

  const hallOptions = useMemo(
    () => (hallsQuery.data || []).map((h) => ({ value: h._id, label: h.name })),
    [hallsQuery.data],
  );

  const resolveOrderId = (table: Table): string | undefined => {
    const fromMap = orderByTableId.get(idOf(table._id));
    if (fromMap?._id) return idOf(fromMap._id);
    const linked = idOf(table.currentOrderId);
    return linked || undefined;
  };

  const openTable = async (table: Table) => {
    if (table.status === 'DISABLED') return;
    setBusy(true);
    try {
      // Always resolve open order by table (owner/admin/waiter share same path).
      try {
        const byTable = await ordersApi.byTable(table._id);
        const oid = idOf(byTable?._id);
        if (oid) {
          navigate(`/waiter/orders/${oid}`);
          return;
        }
      } catch {
        // 404 = no open order yet
      }

      const knownOrderId = resolveOrderId(table);
      if (knownOrderId) {
        navigate(`/waiter/orders/${knownOrderId}`);
        return;
      }

      if (table.status === 'OCCUPIED' || table.status === 'RESERVED' || Boolean(table.currentOrderId)) {
        const order = await ordersApi.create({
          tableId: table._id,
          guests: table.capacity || table.seats || 2,
        });
        navigate(`/waiter/orders/${idOf(order._id)}`);
        return;
      }

      setCreateFor(table);
      setGuests(table.capacity || table.seats || 2);
    } catch {
      message.error(t('app.error'));
    } finally {
      setBusy(false);
    }
  };

  const createOrder = async () => {
    if (!createFor) return;
    setBusy(true);
    try {
      const order = await ordersApi.create({ tableId: createFor._id, guests });
      message.success(t('app.success'));
      setCreateFor(null);
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
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
            const order = orderByTableId.get(idOf(table._id));
            const isBusy =
              Boolean(order) || table.status === 'OCCUPIED' || Boolean(table.currentOrderId);
            const color = isBusy
              ? TABLE_STATUS_COLORS.OCCUPIED
              : TABLE_STATUS_COLORS[table.status] || '#8a8175';
            const openedAt = order?.createdAt;
            return (
              <button
                key={table._id}
                type="button"
                disabled={busy}
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
                  {isBusy ? t('tableStatus.OCCUPIED') : t(`tableStatus.${table.status}`)}
                </Text>
                {order ? (
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    #{order.number ?? idOf(order._id).slice(-4)}
                    {openedAt ? ` · ${formatElapsed(openedAt)}` : ''}
                  </Text>
                ) : openedAt ? (
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
