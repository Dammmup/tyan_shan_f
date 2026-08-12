import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Radio,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ApplyDiscountModal } from '../../components/ApplyDiscountModal';
import { StaffHeader } from '../../components/StaffHeader';
import { ordersApi, paymentsApi, shiftsApi } from '../../api/endpoints';
import { formatMoney, tengeToTiyns, tiynsToTenge } from '../../utils/money';
import { formatDateTime, formatElapsed } from '../../utils/time';
import type { Order, PaymentMethod } from '../../types';

const { Text, Title } = Typography;

export function CashierPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>(params.get('orderId') || undefined);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [receivedTenge, setReceivedTenge] = useState<number>(0);
  const [cashPartTenge, setCashPartTenge] = useState<number>(0);
  const [cardPartTenge, setCardPartTenge] = useState<number>(0);
  const [shiftModal, setShiftModal] = useState<'open' | 'close' | null>(null);
  const [cashModal, setCashModal] = useState<'in' | 'out' | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cashComment, setCashComment] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: () => ordersApi.list({ open: true }),
  });

  const shiftQuery = useQuery({
    queryKey: ['shift', 'current'],
    queryFn: shiftsApi.current,
  });

  const selected: Order | undefined = useMemo(
    () => (ordersQuery.data || []).find((o) => o._id === selectedId) || ordersQuery.data?.[0],
    [ordersQuery.data, selectedId],
  );

  useEffect(() => {
    if (selected) {
      setSelectedId(selected._id);
      const tenge = tiynsToTenge(selected.totalTiyns);
      setReceivedTenge(tenge);
      setCashPartTenge(Math.floor(tenge / 2));
      setCardPartTenge(tenge - Math.floor(tenge / 2));
    }
  }, [selected?._id, selected?.totalTiyns]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('no order');
      if (method === 'CASH') {
        return paymentsApi.create({
          orderId: selected._id,
          method: 'CASH',
          amountTiyns: selected.totalTiyns,
          receivedCashTiyns: tengeToTiyns(receivedTenge),
        });
      }
      if (method === 'CARD') {
        return paymentsApi.create({
          orderId: selected._id,
          method: 'CARD',
          amountTiyns: selected.totalTiyns,
        });
      }
      return paymentsApi.create({
        orderId: selected._id,
        method: 'SPLIT',
        splits: [
          { method: 'CASH', amountTiyns: tengeToTiyns(cashPartTenge) },
          { method: 'CARD', amountTiyns: tengeToTiyns(cardPartTenge) },
        ],
      });
    },
    onSuccess: async () => {
      message.success(t('app.success'));
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => message.error(t('app.error')),
  });

  const openShift = useMutation({
    mutationFn: () => shiftsApi.open(tengeToTiyns(cashAmount)),
    onSuccess: async () => {
      message.success(t('app.success'));
      setShiftModal(null);
      await queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: () => message.error(t('app.error')),
  });

  const closeShift = useMutation({
    mutationFn: () => shiftsApi.close(tengeToTiyns(cashAmount)),
    onSuccess: async (shift) => {
      message.success(
        `${t('cashier.discrepancy')}: ${formatMoney(shift.discrepancyTiyns || 0)}`,
      );
      setShiftModal(null);
      await queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: () => message.error(t('app.error')),
  });

  const cashMove = useMutation({
    mutationFn: async () => {
      const tiyns = tengeToTiyns(cashAmount);
      if (cashModal === 'in') return shiftsApi.cashIn(tiyns, cashComment || undefined);
      return shiftsApi.cashOut(tiyns, cashComment || undefined);
    },
    onSuccess: async () => {
      message.success(t('app.success'));
      setCashModal(null);
      setCashAmount(0);
      setCashComment('');
      await queryClient.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: () => message.error(t('app.error')),
  });

  const changeTiyns =
    selected && method === 'CASH'
      ? Math.max(0, tengeToTiyns(receivedTenge) - selected.totalTiyns)
      : 0;

  const shift = shiftQuery.data;
  const shiftOpen = Boolean(shift && shift.status === 'OPEN');

  return (
    <div style={{ minHeight: '100vh', background: '#ebe4d8' }}>
      <StaffHeader
        title={t('cashier.title')}
        extra={
          <Space wrap>
            {!shiftOpen ? (
              <Button size="large" type="primary" onClick={() => { setCashAmount(0); setShiftModal('open'); }}>
                {t('cashier.openShift')}
              </Button>
            ) : (
              <>
                <Button size="large" onClick={() => { setCashAmount(0); setCashComment(''); setCashModal('in'); }}>
                  {t('cashier.cashIn')}
                </Button>
                <Button size="large" onClick={() => { setCashAmount(0); setCashComment(''); setCashModal('out'); }}>
                  {t('cashier.cashOut')}
                </Button>
                <Button size="large" onClick={() => { setCashAmount(0); setShiftModal('close'); }}>
                  {t('cashier.closeShift')}
                </Button>
              </>
            )}
          </Space>
        }
      />

      <div style={{ padding: 16 }}>
        {!shiftOpen && (
          <Alert type="warning" showIcon message={t('cashier.noShift')} style={{ marginBottom: 16 }} />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title={t('cashier.openOrders')}>
              {ordersQuery.isLoading ? (
                <Spin />
              ) : (
                <List
                  dataSource={ordersQuery.data || []}
                  locale={{ emptyText: t('app.empty') }}
                  renderItem={(order) => (
                    <List.Item
                      onClick={() => setSelectedId(order._id)}
                      style={{
                        cursor: 'pointer',
                        background: selectedId === order._id ? 'rgba(31,111,91,0.1)' : undefined,
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <List.Item.Meta
                        title={`#${order.number ?? order._id.slice(-4)} · ${order.tableName || ''}`}
                        description={
                          <>
                            {t(`orderStatus.${order.status}`)}
                            {order.createdAt
                              ? ` · ${formatDateTime(order.createdAt)} (${formatElapsed(order.createdAt)})`
                              : ''}
                          </>
                        }
                      />
                      <Text strong>{formatMoney(order.totalTiyns)}</Text>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title={t('cashier.paymentForm')}>
              {!selected ? (
                <Text type="secondary">{t('cashier.selectOrder')}</Text>
              ) : (
                <>
                  <Title level={3} style={{ marginTop: 0, fontFamily: 'Fraunces, serif' }}>
                    {t('payment.total')}: {formatMoney(selected.totalTiyns)}
                  </Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {t('waiter.subtotal')}: {formatMoney(selected.subtotalTiyns || 0)}
                    {(selected.discountTiyns || 0) > 0
                      ? ` · ${t('waiter.discount')}: −${formatMoney(selected.discountTiyns || 0)}`
                      : ''}
                    {' · '}
                    {t('waiter.service')}: {formatMoney(selected.serviceChargeTiyns || 0)}
                  </Text>
                  <Button
                    icon={<PercentageOutlined />}
                    style={{ marginBottom: 16 }}
                    onClick={() => setDiscountOpen(true)}
                  >
                    {t('waiter.applyDiscount')}
                  </Button>
                  <Radio.Group
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    optionType="button"
                    buttonStyle="solid"
                    size="large"
                    style={{ marginBottom: 16, display: 'block' }}
                    options={[
                      { value: 'CASH', label: t('payment.CASH') },
                      { value: 'CARD', label: t('payment.CARD') },
                      { value: 'SPLIT', label: t('payment.SPLIT') },
                    ]}
                  />

                  {method === 'CASH' && (
                    <Form layout="vertical">
                      <Form.Item label={t('payment.received')}>
                        <InputNumber
                          min={0}
                          value={receivedTenge}
                          onChange={(v) => setReceivedTenge(Number(v) || 0)}
                          size="large"
                          style={{ width: '100%' }}
                          addonAfter="₸"
                        />
                      </Form.Item>
                      <Alert
                        type="info"
                        message={`${t('payment.change')}: ${formatMoney(changeTiyns)}`}
                      />
                    </Form>
                  )}

                  {method === 'SPLIT' && (
                    <Form layout="vertical">
                      <Form.Item label={t('payment.cashPart')}>
                        <InputNumber
                          min={0}
                          value={cashPartTenge}
                          onChange={(v) => setCashPartTenge(Number(v) || 0)}
                          size="large"
                          style={{ width: '100%' }}
                          addonAfter="₸"
                        />
                      </Form.Item>
                      <Form.Item label={t('payment.cardPart')}>
                        <InputNumber
                          min={0}
                          value={cardPartTenge}
                          onChange={(v) => setCardPartTenge(Number(v) || 0)}
                          size="large"
                          style={{ width: '100%' }}
                          addonAfter="₸"
                        />
                      </Form.Item>
                    </Form>
                  )}

                  <Divider />
                  <Button
                    type="primary"
                    size="large"
                    block
                    style={{ height: 52 }}
                    disabled={!shiftOpen}
                    loading={payMutation.isPending}
                    onClick={() => payMutation.mutate()}
                  >
                    {t('payment.pay')}
                  </Button>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        open={shiftModal !== null}
        title={shiftModal === 'open' ? t('cashier.openShift') : t('cashier.closeShift')}
        onCancel={() => setShiftModal(null)}
        onOk={() => {
          if (shiftModal === 'open') openShift.mutate();
          else closeShift.mutate();
        }}
        confirmLoading={openShift.isPending || closeShift.isPending}
      >
        <Form layout="vertical">
          <Form.Item
            label={shiftModal === 'open' ? t('cashier.openingCash') : t('cashier.closingCash')}
          >
            <InputNumber
              min={0}
              value={cashAmount}
              onChange={(v) => setCashAmount(Number(v) || 0)}
              size="large"
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>
          {shiftModal === 'close' && shift?.expectedCashTiyns != null && (
            <Alert
              type="info"
              message={`${t('cashier.expected')}: ${formatMoney(shift.expectedCashTiyns)}`}
            />
          )}
        </Form>
      </Modal>

      <Modal
        open={cashModal !== null}
        title={cashModal === 'in' ? t('cashier.cashIn') : t('cashier.cashOut')}
        onCancel={() => setCashModal(null)}
        onOk={() => cashMove.mutate()}
        confirmLoading={cashMove.isPending}
        okButtonProps={{ disabled: cashAmount <= 0 }}
      >
        <Form layout="vertical">
          <Form.Item label={t('payment.amount')}>
            <InputNumber
              min={0}
              value={cashAmount}
              onChange={(v) => setCashAmount(Number(v) || 0)}
              size="large"
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>
          <Form.Item label={t('cashier.cashComment')}>
            <Input
              value={cashComment}
              onChange={(e) => setCashComment(e.target.value)}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      {selected && (
        <ApplyDiscountModal
          open={discountOpen}
          orderId={selected._id}
          onClose={() => setDiscountOpen(false)}
        />
      )}
    </div>
  );
}
