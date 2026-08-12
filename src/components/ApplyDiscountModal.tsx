import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Select, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { discountsApi } from '../api/endpoints';
import { formatMoney, tiynsToTenge } from '../utils/money';

const { Text } = Typography;

type Props = {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onApplied?: () => void;
};

export function ApplyDiscountModal({ open, orderId, onClose, onApplied }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [discountId, setDiscountId] = useState<string | undefined>();

  const discountsQuery = useQuery({
    queryKey: ['discounts'],
    queryFn: discountsApi.list,
    enabled: open,
  });

  const options = useMemo(
    () =>
      (discountsQuery.data || [])
        .filter((d) => d.isActive !== false)
        .map((d) => ({
          value: d._id,
          label:
            d.type === 'PERCENT'
              ? `${d.name} (−${d.value}%)`
              : `${d.name} (−${formatMoney(d.value)})`,
        })),
    [discountsQuery.data],
  );

  const applyMutation = useMutation({
    mutationFn: () => discountsApi.apply(orderId, discountId!),
    onSuccess: async () => {
      message.success(t('app.success'));
      setDiscountId(undefined);
      onClose();
      await qc.invalidateQueries({ queryKey: ['order', orderId] });
      await qc.invalidateQueries({ queryKey: ['orders'] });
      onApplied?.();
    },
    onError: () => message.error(t('app.error')),
  });

  return (
    <Modal
      open={open}
      title={t('waiter.applyDiscount')}
      onCancel={() => {
        setDiscountId(undefined);
        onClose();
      }}
      onOk={() => applyMutation.mutate()}
      okButtonProps={{ disabled: !discountId }}
      confirmLoading={applyMutation.isPending}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        {t('waiter.applyDiscountHint')}
      </Text>
      <Select
        style={{ width: '100%' }}
        size="large"
        placeholder={t('waiter.selectDiscount')}
        value={discountId}
        onChange={setDiscountId}
        options={options}
        loading={discountsQuery.isLoading}
      />
      {discountId && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {(() => {
            const d = discountsQuery.data?.find((x) => x._id === discountId);
            if (!d) return null;
            return d.type === 'PERCENT'
              ? `−${d.value}%`
              : `−${tiynsToTenge(d.value)} ₸`;
          })()}
        </Text>
      )}
    </Modal>
  );
}
