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
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlusOutlined,
  SendOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffHeader } from '../../components/StaffHeader';
import { menuApi, ordersApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import type { Product } from '../../types';

const { Text, Title } = Typography;

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

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: Boolean(orderId),
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

  const order = orderQuery.data;
  const newItems = useMemo(
    () => (order?.items || []).filter((i) => i.status === 'NEW'),
    [order],
  );
  const sentItems = useMemo(
    () => (order?.items || []).filter((i) => i.status !== 'NEW' && i.status !== 'CANCELLED'),
    [order],
  );

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
          <Button
            icon={<ArrowLeftOutlined />}
            size="large"
            onClick={() => navigate('/waiter')}
          >
            {t('app.back')}
          </Button>
        }
      />

      <div style={{ padding: 12 }}>
        <Text type="secondary">
          {order?.tableName} · {t(`orderStatus.${order?.status || 'OPEN'}`)}
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
                  {formatMoney(p.priceTiyns)}
                </div>
                {stopped && <Tag color="red">{t('waiter.stopped')}</Tag>}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          background: 'rgba(20,61,52,0.95)',
          display: 'flex',
          gap: 8,
        }}
      >
        <Button size="large" block onClick={() => setCartOpen(true)}>
          {t('waiter.cart')} ({order?.items?.length || 0}) · {formatMoney(order?.totalTiyns || 0)}
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          disabled={!newItems.length}
          loading={sendMutation.isPending}
          onClick={() => sendMutation.mutate()}
          style={{ minWidth: 140 }}
        >
          {t('waiter.sendSuborder')}
        </Button>
        <Button
          size="large"
          icon={<WalletOutlined />}
          onClick={() => navigate(`/cashier?orderId=${orderId}`)}
          style={{ minWidth: 120 }}
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
                description={formatMoney(item.totalTiyns)}
              />
            </List.Item>
          )}
        />
        <Divider />
        <Title level={5}>{t('waiter.sentItems')}</Title>
        <List
          dataSource={sentItems}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={`${item.quantity}× ${item.nameSnapshot}`}
                description={
                  <Space>
                    <Tag>{item.status}</Tag>
                    <span>{formatMoney(item.totalTiyns)}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <Divider />
        <Flex justify="space-between" align="center">
          <Text strong>{t('payment.total')}</Text>
          <Title level={3} style={{ margin: 0, color: '#1f6f5b' }}>
            {formatMoney(order?.totalTiyns || 0)}
          </Title>
        </Flex>
      </Drawer>
    </div>
  );
}
