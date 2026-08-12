import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PercentageOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  SwapOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApplyDiscountModal } from '../../components/ApplyDiscountModal';
import { StaffHeader } from '../../components/StaffHeader';
import { menuApi, ordersApi, tablesApi } from '../../api/endpoints';
import { formatMoney, itemLineTotalTiyns } from '../../utils/money';
import { centerLabel } from '../../utils/centers';
import { formatDateTime, formatElapsed } from '../../utils/time';
import type { Product } from '../../types';

const { Text, Title } = Typography;

const TRANSFERABLE = new Set(['NEW', 'SENT', 'COOKING', 'READY']);

export function WaiterOrderPage() {
  const { orderId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [modifierIds, setModifierIds] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [targetTableId, setTargetTableId] = useState<string | undefined>();

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: Boolean(orderId),
  });

  const tablesQuery = useQuery({
    queryKey: ['tables', 'all'],
    queryFn: () => tablesApi.list(),
    enabled: transferOpen,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.categories,
  });

  const activeCategory = categoryId || categoriesQuery.data?.[0]?._id;

  const productsQuery = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => menuApi.products(activeCategory),
    enabled: Boolean(activeCategory),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  };

  const addMutation = useMutation({
    mutationFn: () =>
      ordersApi.addItem(orderId, {
        productId: product!._id,
        quantity: qty,
        modifierIds,
      }),
    onSuccess: async () => {
      message.success(t('app.success'));
      setProduct(null);
      setQty(1);
      setModifierIds([]);
      await invalidate();
    },
    onError: () => message.error(t('app.error')),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => ordersApi.removeItem(orderId, itemId),
    onSuccess: async () => {
      await invalidate();
    },
    onError: () => message.error(t('app.error')),
  });

  const sendMutation = useMutation({
    mutationFn: () => ordersApi.sendSuborder(orderId),
    onSuccess: async () => {
      message.success(t('app.success'));
      await invalidate();
    },
    onError: () => message.error(t('app.error')),
  });

  const precheckMutation = useMutation({
    mutationFn: () => ordersApi.precheck(orderId),
    onSuccess: async () => {
      message.success(t('waiter.precheck'));
      await invalidate();
    },
    onError: () => message.error(t('app.error')),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: async () => {
      message.success(t('app.success'));
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate('/waiter');
    },
    onError: () => message.error(t('app.error')),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      ordersApi.transfer(orderId, {
        targetTableId: targetTableId!,
        itemIds: selectedItemIds.length ? selectedItemIds : undefined,
      }),
    onSuccess: async (res) => {
      message.success(t('waiter.transferDone'));
      setTransferOpen(false);
      setSelectedItemIds([]);
      setTargetTableId(undefined);
      setCartOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      navigate(`/waiter/orders/${res.target._id}`);
    },
    onError: () => message.error(t('app.error')),
  });

  const order = orderQuery.data;
  const newItems = useMemo(
    () => (order?.items || []).filter((i) => i.status === 'NEW'),
    [order],
  );
  const sentItems = useMemo(
    () => (order?.items || []).filter((i) => i.status !== 'NEW' && i.status !== 'CANCELLED'),
    [order],
  );
  const transferableItems = useMemo(
    () => (order?.items || []).filter((i) => TRANSFERABLE.has(i.status)),
    [order],
  );

  const tableOptions = useMemo(
    () =>
      (tablesQuery.data || [])
        .filter((tbl) => tbl._id !== order?.tableId && tbl.status !== 'DISABLED')
        .map((tbl) => ({
          value: tbl._id,
          label: `${tbl.name}${tbl.status === 'OCCUPIED' ? ` (${t('tableStatus.OCCUPIED')})` : ''}`,
        })),
    [tablesQuery.data, order?.tableId, t],
  );

  const toggleItem = (id: string, checked: boolean) => {
    setSelectedItemIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
    );
  };

  if (orderQuery.isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ebe4d8', paddingBottom: 88 }}>
      <StaffHeader
        title={`${t('waiter.order')} #${order?.number ?? orderId.slice(-4)}`}
        extra={
          <Space>
            {order?.status !== 'PAID' && order?.status !== 'CANCELLED' && (
              <Button
                danger
                icon={<StopOutlined />}
                size="large"
                loading={cancelOrderMutation.isPending}
                onClick={() => {
                  Modal.confirm({
                    title: t('waiter.cancelOrder'),
                    content: t('waiter.cancelOrderHint'),
                    okText: t('app.confirm'),
                    cancelText: t('app.cancel'),
                    okButtonProps: { danger: true },
                    onOk: () => cancelOrderMutation.mutateAsync(),
                  });
                }}
              >
                {t('waiter.cancelOrder')}
              </Button>
            )}
            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate('/waiter')}
            >
              {t('app.back')}
            </Button>
          </Space>
        }
      />

      <div style={{ padding: 12 }}>
        <Text type="secondary">
          {order?.tableName} · {t(`orderStatus.${order?.status || 'OPEN'}`)}
          {order?.createdAt
            ? ` · ${formatDateTime(order.createdAt)} (${formatElapsed(order.createdAt)})`
            : ''}
        </Text>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0' }}>
          {(categoriesQuery.data || []).map((c) => (
            <Button
              key={c._id}
              type={activeCategory === c._id ? 'primary' : 'default'}
              size="large"
              onClick={() => setCategoryId(c._id)}
              style={{ flexShrink: 0 }}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          {(productsQuery.data || []).map((p) => {
            const stopped = p.availability === 'STOPPED';
            return (
              <button
                key={p._id}
                type="button"
                disabled={stopped}
                onClick={() => {
                  setProduct(p);
                  setQty(1);
                  setModifierIds([]);
                }}
                style={{
                  textAlign: 'left',
                  border: '1px solid #d4cbbd',
                  borderRadius: 12,
                  padding: 14,
                  minHeight: 96,
                  background: stopped ? '#ddd6cb' : '#faf7f1',
                  cursor: stopped ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ marginTop: 8, color: '#1f6f5b', fontWeight: 600 }}>
                  {formatMoney(p.priceTiyns ?? p.basePriceTiyns ?? 0)}
                </div>
                {stopped && <Tag color="red">{t('waiter.stopped')}</Tag>}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="staff-bottom-bar"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          padding: 10,
          background: 'rgba(20,61,52,0.95)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth: '100vw',
        }}
      >
        <Button size="large" style={{ flex: '1 1 140px' }} onClick={() => setCartOpen(true)}>
          {t('waiter.cart')} ({order?.items?.length || 0}) · {formatMoney(order?.totalTiyns || 0)}
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          disabled={!newItems.length}
          loading={sendMutation.isPending}
          onClick={() => sendMutation.mutate()}
          style={{ flex: '1 1 120px' }}
        >
          {t('waiter.sendSuborder')}
        </Button>
        <Button
          size="large"
          icon={<PercentageOutlined />}
          disabled={!order?.items?.length}
          onClick={() => setDiscountOpen(true)}
          style={{ flex: '1 1 100px' }}
        >
          {t('waiter.discount')}
        </Button>
        <Button
          size="large"
          icon={<FileTextOutlined />}
          disabled={!order?.items?.length}
          loading={precheckMutation.isPending}
          onClick={() => precheckMutation.mutate()}
          style={{ flex: '1 1 100px' }}
        >
          {t('waiter.precheck')}
        </Button>
        <Button
          size="large"
          icon={<SwapOutlined />}
          disabled={!transferableItems.length}
          onClick={() => {
            setSelectedItemIds(transferableItems.map((i) => i._id));
            setTransferOpen(true);
          }}
          style={{ flex: '1 1 100px' }}
        >
          {t('waiter.transfer')}
        </Button>
        <Button
          size="large"
          icon={<WalletOutlined />}
          onClick={() => navigate(`/cashier?orderId=${orderId}`)}
          style={{ flex: '1 1 100px' }}
        >
          {t('waiter.payLink')}
        </Button>
      </div>

      <Modal
        open={Boolean(product)}
        title={product?.name}
        onCancel={() => setProduct(null)}
        onOk={() => addMutation.mutate()}
        confirmLoading={addMutation.isPending}
        okText={t('waiter.add')}
        okButtonProps={{ icon: <PlusOutlined />, size: 'large' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text>{t('waiter.qty')}</Text>
            <InputNumber
              min={1}
              max={50}
              value={qty}
              onChange={(v) => setQty(Number(v) || 1)}
              size="large"
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
          {(product?.modifierGroups || []).map((group) => (
            <div key={group._id}>
              <Text strong>
                {group.name} ({t('waiter.modifiers')})
              </Text>
              <Checkbox.Group
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                value={modifierIds}
                onChange={(vals) => setModifierIds(vals as string[])}
                options={group.modifiers.map((m) => ({
                  label: `${m.name} (+${formatMoney(m.priceTiyns)})`,
                  value: m._id,
                }))}
              />
            </div>
          ))}
        </Space>
      </Modal>

      <Drawer
        title={t('waiter.cart')}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        size="large"
      >
        <Title level={5}>{t('waiter.newItems')}</Title>
        <List
          locale={{ emptyText: t('waiter.emptyCart') }}
          dataSource={newItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Checkbox
                  key="sel"
                  checked={selectedItemIds.includes(item._id)}
                  onChange={(e) => toggleItem(item._id, e.target.checked)}
                />,
                <Button
                  key="del"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeMutation.mutate(item._id)}
                />,
              ]}
            >
              <List.Item.Meta
                title={`${item.quantity}× ${item.nameSnapshot}`}
                description={
                  <Space size={8} wrap>
                    <span>{formatMoney(itemLineTotalTiyns(item))}</span>
                    {item.productionCenter ? (
                      <Tag>{centerLabel(item.productionCenter)}</Tag>
                    ) : null}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <Divider />
        <Title level={5}>{t('waiter.sentItems')}</Title>
        <List
          dataSource={sentItems}
          renderItem={(item) => (
            <List.Item
              actions={
                TRANSFERABLE.has(item.status)
                  ? [
                      <Checkbox
                        key="sel"
                        checked={selectedItemIds.includes(item._id)}
                        onChange={(e) => toggleItem(item._id, e.target.checked)}
                      />,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                title={`${item.quantity}× ${item.nameSnapshot}`}
                description={
                  <Space>
                    <Tag>{item.status}</Tag>
                    {item.productionCenter ? (
                      <Tag color="blue">{centerLabel(item.productionCenter)}</Tag>
                    ) : null}
                    <span>{formatMoney(itemLineTotalTiyns(item))}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <Divider />
        <Button
          icon={<SwapOutlined />}
          block
          size="large"
          disabled={!transferableItems.length}
          onClick={() => {
            if (!selectedItemIds.length) {
              setSelectedItemIds(transferableItems.map((i) => i._id));
            }
            setTransferOpen(true);
          }}
          style={{ marginBottom: 12 }}
        >
          {t('waiter.transfer')}
          {selectedItemIds.length ? ` (${selectedItemIds.length})` : ''}
        </Button>
        <Flex vertical gap={6}>
          <Flex justify="space-between">
            <Text type="secondary">{t('waiter.subtotal')}</Text>
            <Text>{formatMoney(order?.subtotalTiyns || 0)}</Text>
          </Flex>
          {(order?.discountTiyns || 0) > 0 && (
            <Flex justify="space-between">
              <Text type="secondary">{t('waiter.discount')}</Text>
              <Text>−{formatMoney(order?.discountTiyns || 0)}</Text>
            </Flex>
          )}
          <Flex justify="space-between">
            <Text type="secondary">{t('waiter.service')}</Text>
            <Text>{formatMoney(order?.serviceChargeTiyns || 0)}</Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Text strong>{t('payment.total')}</Text>
            <Title level={3} style={{ margin: 0, color: '#1f6f5b' }}>
              {formatMoney(order?.totalTiyns || 0)}
            </Title>
          </Flex>
          <Button
            size="large"
            icon={<PercentageOutlined />}
            block
            disabled={!order?.items?.length}
            onClick={() => setDiscountOpen(true)}
            style={{ marginTop: 8 }}
          >
            {t('waiter.applyDiscount')}
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<FileTextOutlined />}
            block
            disabled={!order?.items?.length}
            loading={precheckMutation.isPending}
            onClick={() => precheckMutation.mutate()}
            style={{ marginTop: 8 }}
          >
            {t('waiter.precheck')}
          </Button>
        </Flex>
      </Drawer>

      <Modal
        open={transferOpen}
        title={t('waiter.transfer')}
        onCancel={() => {
          setTransferOpen(false);
          setTargetTableId(undefined);
        }}
        onOk={() => transferMutation.mutate()}
        confirmLoading={transferMutation.isPending}
        okButtonProps={{ disabled: !targetTableId }}
        okText={t('waiter.transferConfirm')}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {t('waiter.transferHint')}
        </Text>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('waiter.transferItems')}: {selectedItemIds.length || transferableItems.length}
        </Text>
        <Select
          style={{ width: '100%' }}
          size="large"
          showSearch
          optionFilterProp="label"
          placeholder={t('waiter.selectTable')}
          value={targetTableId}
          onChange={setTargetTableId}
          options={tableOptions}
          loading={tablesQuery.isLoading}
        />
        <Button
          type="link"
          style={{ paddingLeft: 0, marginTop: 8 }}
          onClick={() => setSelectedItemIds(transferableItems.map((i) => i._id))}
        >
          {t('waiter.transferAll')}
        </Button>
      </Modal>

      <ApplyDiscountModal
        open={discountOpen}
        orderId={orderId}
        onClose={() => setDiscountOpen(false)}
      />
    </div>
  );
}
