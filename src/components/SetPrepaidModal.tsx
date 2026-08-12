import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, InputNumber, Modal, Radio, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ordersApi } from '../api/endpoints';
import { tengeToTiyns, tiynsToTenge } from '../utils/money';
import type { Order } from '../types';

const { Text } = Typography;

type Props = {
  open: boolean;
  order: Order | undefined;
  onClose: () => void;
};

export function SetPrepaidModal({ open, order, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tenge, setTenge] = useState(0);
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !order) return;
    setTenge(tiynsToTenge(order.prepaidTiyns || 0));
    setMethod(order.prepaidMethod === 'CARD' ? 'CARD' : 'CASH');
    setNote(order.prepaidNote || '');
  }, [open, order?._id, order?.prepaidTiyns, order?.prepaidMethod, order?.prepaidNote]);

  const mutation = useMutation({
    mutationFn: () =>
      ordersApi.setPrepaid(order!._id, {
        amountTiyns: tengeToTiyns(tenge),
        method: tenge > 0 ? method : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: async () => {
      message.success(t('app.success'));
      onClose();
      await qc.invalidateQueries({ queryKey: ['order', order?._id] });
      await qc.invalidateQueries({ queryKey: ['orders'] });
      await qc.invalidateQueries({ queryKey: ['shift'] });
    },
    onError: () => message.error(t('app.error')),
  });

  return (
    <Modal
      open={open}
      title={t('waiter.prepaid')}
      onCancel={onClose}
      onOk={() => mutation.mutate()}
      confirmLoading={mutation.isPending}
      okText={t('app.save')}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        {t('waiter.prepaidHint')}
      </Text>
      <InputNumber
        min={0}
        value={tenge}
        onChange={(v) => setTenge(Number(v) || 0)}
        size="large"
        style={{ width: '100%', marginBottom: 12 }}
        addonAfter="₸"
      />
      <Radio.Group
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 12 }}
        options={[
          { value: 'CASH', label: t('payment.CASH') },
          { value: 'CARD', label: t('payment.CARD') },
        ]}
      />
      <Input
        placeholder={t('cashier.cashComment')}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        size="large"
      />
    </Modal>
  );
}
