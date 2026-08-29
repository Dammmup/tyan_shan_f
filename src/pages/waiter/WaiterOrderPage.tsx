import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  Input,
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
  DollarOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  PercentageOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  SwapOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ApplyDiscountModal } from '../../components/ApplyDiscountModal';
import { ReleaseTableModal } from '../../components/ReleaseTableModal';
import { SetPrepaidModal } from '../../components/SetPrepaidModal';
import { StaffHeader } from '../../components/StaffHeader';
import { menuApi, ordersApi, tablesApi } from '../../api/endpoints';
import { formatMoney, itemLineTotalTiyns, orderDueTiyns } from '../../utils/money';
import { centerLabel } from '../../utils/centers';
import { formatDateTime, formatElapsed } from '../../utils/time';
import {
  canApplyDiscount,
  canCancelOrderItem,
  canCancelWholeOrder,
  isAdminRole,
  isElevatedFloor,
} from '../../utils/roles';
import {
  isAdminEmbeddedFloor,
  waiterHome,
  waiterOrderPath,
} from '../../utils/paths';
import { useAuthStore } from '../../stores/authStore';
import type { Product } from '../../types';

const { Text, Title } = Typography;

const TRANSFERABLE = new Set(['NEW', 'SENT', 'COOKING', 'READY']);

export function WaiterOrderPage() {
  const { orderId = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const embedded = isAdminEmbeddedFloor(location.pathname);
  const allowDiscount = canApplyDiscount(user);
  const elevated = isElevatedFloor(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const canReprintPrecheck = isAdmin;
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [itemNote, setItemNote] = useState('');
  const [modifierIds, setModifierIds] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [targetTableId, setTargetTableId] = useState<string | undefined>();
  const [prepaidOpen, setPrepaidOpen] = useState(false);
  const [precheckPreviewOpen, setPrecheckPreviewOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const [bottomBarH, setBottomBarH] = useState(220);

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
        note: itemNote.trim() || undefined,
      }),
    onSuccess: async () => {
      message.success(t('app.success'));
      setProduct(null);
      setQty(1);
      setItemNote('');
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
      message.success(t('waiter.precheckPrinted'));
      setPrecheckPreviewOpen(false);
      setCartOpen(false);
      await invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      const text = Array.isArray(msg) ? msg[0] : msg;
      if (text && /precheck already/i.test(String(text))) {
        message.warning(t('waiter.precheckOnce'));
      } else {
        message.error(t('app.error'));
      }
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: async () => {
      message.success(t('app.success'));
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate(waiterHome(user?.role));
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
      navigate(waiterOrderPath(res.target._id, user?.role));
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
  const precheckItems = useMemo(
    () => (order?.items || []).filter((i) => i.status !== 'CANCELLED'),
    [order],
  );
  const precheckDone = Boolean(order?.precheckPrintedAt);
  const canPrintPrecheck =
    Boolean(precheckItems.length) &&
    order?.status !== 'PAID' &&
    order?.status !== 'CANCELLED' &&
    (!precheckDone || canReprintPrecheck);

  const openPrecheckPreview = () => {
    if (!precheckItems.length) {
      message.warning(t('waiter.emptyCart'));
      return;
    }
    if (precheckDone && !canReprintPrecheck) {
      message.warning(t('waiter.precheckOnce'));
      return;
    }
    setPrecheckPreviewOpen(true);
  };

  useEffect(() => {
    const el = bottomBarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) setBottomBarH(h);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isAdmin, order?.items?.length, canPrintPrecheck, newItems.length]);

  const tableOptions = useMemo(() => {
    const list = tablesQuery.data || [];
    const filtered = elevated
      ? list.filter((tbl) => tbl._id !== order?.tableId && tbl.status !== 'DISABLED')
      : list.filter((tbl) => tbl._id !== order?.tableId && tbl.status === 'FREE');
    return filtered.map((tbl) => ({
      value: tbl._id,
      label: `${tbl.name}${tbl.status === 'OCCUPIED' ? ` (${t('tableStatus.OCCUPIED')})` : ''}`,
    }));
  }, [tablesQuery.data, order?.tableId, t, elevated]);

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
    <div
      style={{
        minHeight: embedded ? undefined : '100vh',
        background: '#ebe4d8',
        paddingBottom: bottomBarH + 40,
      }}
    >
      {!embedded ? (
        <StaffHeader
          title={`${t('waiter.order')} #${order?.number ?? orderId.slice(-4)}`}
          extra={
            <Space>
              {order?.status !== 'PAID' &&
                order?.status !== 'CANCELLED' &&
                canCancelWholeOrder(user, order?.items || []) && (
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
                onClick={() => navigate(waiterHome(user?.role))}
              >
                {t('app.back')}
              </Button>
            </Space>
          }
        />
      ) : (
        <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 8 }}>
          <Typography.Title level={4} style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>
            {`${t('waiter.order')} #${order?.number ?? orderId.slice(-4)}`}
          </Typography.Title>
          <Space>
            {order?.status !== 'PAID' &&
              order?.status !== 'CANCELLED' &&
              canCancelWholeOrder(user, order?.items || []) && (
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
              onClick={() => navigate(waiterHome(user?.role))}
            >
              {t('app.back')}
            </Button>
          </Space>
        </Flex>
      )}

      <div style={{ padding: embedded ? 0 : 12 }}>
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
                  setItemNote('');
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
        ref={bottomBarRef}
        className={`staff-bottom-bar${embedded ? ' staff-bottom-bar--admin' : ''}`}
        style={{
          position: 'fixed',
          left: embedded ? 'var(--admin-aside-offset, 0px)' : 0,
          right: 0,
          bottom: 0,
          zIndex: 300,
          padding: 10,
          background: 'rgba(20,61,52,0.95)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          maxWidth: embedded ? 'none' : '100vw',
          boxSizing: 'border-box',
        }}
      >
        <Button size="large" style={{ flex: '1 1 100%' }} onClick={() => setCartOpen(true)}>
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
          icon={<FileTextOutlined />}
          disabled={!canPrintPrecheck}
          onClick={openPrecheckPreview}
          style={{ flex: '1 1 100px' }}
        >
          {precheckDone && !canReprintPrecheck ? t('waiter.precheckDone') : t('waiter.precheck')}
        </Button>
        <Button
          size="large"
          icon={<EllipsisOutlined />}
          onClick={() => setMoreOpen(true)}
          style={{ flex: '1 1 90px' }}
        >
          {t('waiter.moreActions')}
        </Button>
      </div>

      <Drawer
        title={t('waiter.moreActions')}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        placement="bottom"
        height="auto"
        styles={{ body: { paddingBottom: 24 } }}
      >
        <Flex vertical gap={10}>
          <Button
            size="large"
            block
            icon={<PercentageOutlined />}
            disabled={!order?.items?.length || !allowDiscount}
            onClick={() => {
              setMoreOpen(false);
              setDiscountOpen(true);
            }}
          >
            {t('waiter.discount')}
          </Button>
          <Button
            size="large"
            block
            icon={<DollarOutlined />}
            disabled={order?.status === 'PAID' || order?.status === 'CANCELLED'}
            onClick={() => {
              setMoreOpen(false);
              setPrepaidOpen(true);
            }}
          >
            {t('waiter.prepaid')}
          </Button>
          <Button
            size="large"
            block
            icon={<SwapOutlined />}
            disabled={!transferableItems.length}
            onClick={() => {
              setSelectedItemIds(transferableItems.map((i) => i._id));
              setMoreOpen(false);
              setTransferOpen(true);
            }}
          >
            {t('waiter.transfer')}
          </Button>
          {isAdmin && (
            <Button
              type="primary"
              size="large"
              block
              icon={<WalletOutlined />}
              disabled={order?.status === 'PAID' || order?.status === 'CANCELLED'}
              onClick={() => {
                setMoreOpen(false);
                setReleaseOpen(true);
              }}
            >
              {t('waiter.releaseTable')}
            </Button>
          )}
        </Flex>
      </Drawer>

      <Modal
        open={Boolean(product)}
        title={product?.name}
        onCancel={() => {
          setProduct(null);
          setItemNote('');
          setModifierIds([]);
          setQty(1);
        }}
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
          <div>
            <Text>{t('waiter.itemNote')}</Text>
            <Input.TextArea
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder={t('waiter.itemNotePlaceholder')}
              maxLength={200}
              rows={2}
              style={{ marginTop: 8 }}
              size="large"
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
                ...(canCancelOrderItem(user, item)
                  ? [
                      <Button
                        key="del"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeMutation.mutate(item._id)}
                      />,
                    ]
                  : []),
              ]}
            >
              <List.Item.Meta
                title={`${item.quantity}× ${item.nameSnapshot}`}
                description={
                  <Space size={8} wrap direction="vertical">
                    <Space size={8} wrap>
                      <span>{formatMoney(itemLineTotalTiyns(item))}</span>
                      {item.productionCenter ? (
                        <Tag>{centerLabel(item.productionCenter)}</Tag>
                      ) : null}
                    </Space>
                    {item.note ? <Text type="secondary">{item.note}</Text> : null}
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
                  <Space direction="vertical" size={4}>
                    <Space wrap>
                      <Tag>{item.status}</Tag>
                      {item.productionCenter ? (
                        <Tag color="blue">{centerLabel(item.productionCenter)}</Tag>
                      ) : null}
                      <span>{formatMoney(itemLineTotalTiyns(item))}</span>
                    </Space>
                    {item.note ? <Text type="secondary">{item.note}</Text> : null}
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
          {(order?.prepaidTiyns || 0) > 0 && (
            <Flex justify="space-between">
              <Text type="secondary">{t('waiter.prepaid')}</Text>
              <Text>−{formatMoney(order?.prepaidTiyns || 0)}</Text>
            </Flex>
          )}
          <Flex justify="space-between" align="center">
            <Text strong>{t('waiter.due')}</Text>
            <Title level={3} style={{ margin: 0, color: '#1f6f5b' }}>
              {formatMoney(orderDueTiyns(order || {}))}
            </Title>
          </Flex>
          <Button
            size="large"
            icon={<DollarOutlined />}
            block
            disabled={order?.status === 'PAID' || order?.status === 'CANCELLED'}
            onClick={() => setPrepaidOpen(true)}
            style={{ marginTop: 8 }}
          >
            {t('waiter.prepaid')}
          </Button>
          <Button
            size="large"
            icon={<PercentageOutlined />}
            block
            disabled={!order?.items?.length || !allowDiscount}
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
            disabled={!canPrintPrecheck}
            onClick={openPrecheckPreview}
            style={{ marginTop: 8 }}
          >
            {precheckDone && !canReprintPrecheck ? t('waiter.precheckDone') : t('waiter.precheck')}
          </Button>
          {isAdmin && (
            <Button
              size="large"
              icon={<WalletOutlined />}
              block
              disabled={order?.status === 'PAID' || order?.status === 'CANCELLED'}
              onClick={() => setReleaseOpen(true)}
              style={{ marginTop: 8 }}
            >
              {t('waiter.releaseTable')}
            </Button>
          )}
        </Flex>
      </Drawer>

      <Modal
        open={precheckPreviewOpen}
        onCancel={() => setPrecheckPreviewOpen(false)}
        footer={null}
        width="100%"
        style={{ top: 0, maxWidth: '100vw', paddingBottom: 0, margin: 0 }}
        styles={{
          container: {
            height: '100dvh',
            maxHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            padding: 0,
            overflow: 'hidden',
          },
          header: {
            margin: 0,
            padding: '12px 16px',
            flexShrink: 0,
          },
          body: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
            background: '#f7f3ea',
            borderRadius: 0,
          },
        }}
        rootClassName="precheck-preview-modal"
        zIndex={1200}
        title={
          <span style={{ fontFamily: 'Fraunces, serif' }}>
            {t('waiter.precheckPreview')}
            {order?.tableName ? ` · ${order.tableName}` : ''}
            {` · #${order?.number ?? orderId.slice(-4)}`}
          </span>
        }
        destroyOnClose
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: 16,
            paddingBottom: 8,
          }}
        >
          <List
            dataSource={precheckItems}
            locale={{ emptyText: t('waiter.emptyCart') }}
            renderItem={(item) => {
              const mods = (item.modifiers || [])
                .map((m) => m.name || m.nameSnapshot || '')
                .filter(Boolean)
                .join(', ');
              return (
                <List.Item style={{ padding: '12px 0', borderColor: 'rgba(20,61,52,0.12)' }}>
                  <Flex justify="space-between" align="flex-start" style={{ width: '100%', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 17 }}>
                        {item.quantity}× {item.nameSnapshot}
                      </Text>
                      {mods ? (
                        <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                          {mods}
                        </Text>
                      ) : null}
                      {item.note ? (
                        <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                          {item.note}
                        </Text>
                      ) : null}
                    </div>
                    <Text strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
                      {formatMoney(itemLineTotalTiyns(item))}
                    </Text>
                  </Flex>
                </List.Item>
              );
            }}
          />

          <Divider style={{ margin: '16px 0' }} />

          <Flex vertical gap={10}>
            <Flex justify="space-between">
              <Text type="secondary" style={{ fontSize: 16 }}>
                {t('waiter.subtotal')}
              </Text>
              <Text style={{ fontSize: 16 }}>{formatMoney(order?.subtotalTiyns || 0)}</Text>
            </Flex>
            {(order?.discountTiyns || 0) > 0 && (
              <Flex justify="space-between">
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {t('waiter.discount')}
                </Text>
                <Text style={{ fontSize: 16 }}>−{formatMoney(order?.discountTiyns || 0)}</Text>
              </Flex>
            )}
            <Flex justify="space-between">
              <Text type="secondary" style={{ fontSize: 16 }}>
                {t('waiter.service')}
              </Text>
              <Text style={{ fontSize: 16 }}>{formatMoney(order?.serviceChargeTiyns || 0)}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text strong style={{ fontSize: 18 }}>
                {t('waiter.total')}
              </Text>
              <Text strong style={{ fontSize: 20 }}>
                {formatMoney(order?.totalTiyns || 0)}
              </Text>
            </Flex>
            {(order?.prepaidTiyns || 0) > 0 && (
              <>
                <Flex justify="space-between">
                  <Text type="secondary" style={{ fontSize: 16 }}>
                    {t('waiter.prepaid')}
                  </Text>
                  <Text style={{ fontSize: 16 }}>−{formatMoney(order?.prepaidTiyns || 0)}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text strong style={{ fontSize: 18 }}>
                    {t('waiter.due')}
                  </Text>
                  <Title level={2} style={{ margin: 0, color: '#1f6f5b', fontFamily: 'Fraunces, serif' }}>
                    {formatMoney(orderDueTiyns(order || {}))}
                  </Title>
                </Flex>
              </>
            )}
          </Flex>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
            background: '#f7f3ea',
            borderTop: '1px solid rgba(20,61,52,0.12)',
            display: 'flex',
            gap: 10,
          }}
        >
          <Button size="large" block onClick={() => setPrecheckPreviewOpen(false)} style={{ height: 52 }}>
            {t('app.cancel')}
          </Button>
          <Button
            type="primary"
            size="large"
            block
            icon={<FileTextOutlined />}
            loading={precheckMutation.isPending}
            disabled={!canPrintPrecheck}
            onClick={() => precheckMutation.mutate()}
            style={{ height: 52 }}
          >
            {t('waiter.precheckPrint')}
          </Button>
        </div>
      </Modal>

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
          {elevated ? t('waiter.transferHint') : t('waiter.transferFreeOnly')}
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
      <SetPrepaidModal
        open={prepaidOpen}
        order={order}
        onClose={() => setPrepaidOpen(false)}
      />
      {order && (
        <ReleaseTableModal
          open={releaseOpen}
          order={order}
          onClose={() => setReleaseOpen(false)}
          onPaid={() => navigate(waiterHome(user?.role))}
        />
      )}
    </div>
  );
}
