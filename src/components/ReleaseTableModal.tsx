import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Divider,
  Form,
  InputNumber,
  Modal,
  Radio,
  Space,
  Typography,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { paymentsApi } from '../api/endpoints';
import { formatMoney, orderDueTiyns, tengeToTiyns, tiynsToTenge } from '../utils/money';
import type { Order, PaymentMethod } from '../types';

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  order: Order;
  onClose: () => void;
  onPaid?: () => void;
};

/** Admin-only: record payment method, then free the table. */
export function ReleaseTableModal({ open, order, onClose, onPaid }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const dueTiyns = orderDueTiyns(order);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [receivedTenge, setReceivedTenge] = useState(0);
  const [cashPartTenge, setCashPartTenge] = useState(0);
  const [cardPartTenge, setCardPartTenge] = useState(0);

  useEffect(() => {
    if (!open) return;
    const tenge = tiynsToTenge(dueTiyns);
    setMethod('CASH');
    setReceivedTenge(tenge);
    setCashPartTenge(Math.floor(tenge / 2));
    setCardPartTenge(tenge - Math.floor(tenge / 2));
  }, [open, order._id, dueTiyns]);

  const changeTiyns =
    method === 'CASH' ? Math.max(0, tengeToTiyns(receivedTenge) - dueTiyns) : 0;

  const payMutation = useMutation({
    mutationFn: async () => {
      if (method === 'CASH') {
        return paymentsApi.create({
          orderId: order._id,
          method: 'CASH',
          amountTiyns: dueTiyns,
          receivedCashTiyns: tengeToTiyns(receivedTenge),
        });
      }
      if (method === 'CARD') {
        return paymentsApi.create({
          orderId: order._id,
          method: 'CARD',
          amountTiyns: dueTiyns,
        });
      }
      return paymentsApi.create({
        orderId: order._id,
        method: 'SPLIT',
        splits: [
          { method: 'CASH', amountTiyns: tengeToTiyns(cashPartTenge) },
          { method: 'CARD', amountTiyns: tengeToTiyns(cardPartTenge) },
        ],
      });
    },
    onSuccess: async () => {
      message.success(t('waiter.tableReleased'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['order'] }),
        queryClient.invalidateQueries({ queryKey: ['tables'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      onClose();
      onPaid?.();
    },
    onError: () => message.error(t('app.error')),
  });

  return (
    <Modal
      open={open}
      title={t('waiter.releaseTable')}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        {t('waiter.releaseTableHint')}
      </Text>
      <Title level={3} style={{ marginTop: 0, fontFamily: 'Fraunces, serif' }}>
        {t('waiter.due')}: {formatMoney(dueTiyns)}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {t('payment.total')}: {formatMoney(order.totalTiyns)}
        {(order.prepaidTiyns || 0) > 0
          ? ` · ${t('waiter.prepaid')}: −${formatMoney(order.prepaidTiyns || 0)}`
          : ''}
      </Text>

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
          <Alert type="info" message={`${t('payment.change')}: ${formatMoney(changeTiyns)}`} />
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
      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button size="large" onClick={onClose}>
          {t('app.cancel')}
        </Button>
        <Button
          type="primary"
          size="large"
          loading={payMutation.isPending}
          onClick={() => payMutation.mutate()}
        >
          {t('waiter.releaseTableConfirm')}
        </Button>
      </Space>
    </Modal>
  );
}
