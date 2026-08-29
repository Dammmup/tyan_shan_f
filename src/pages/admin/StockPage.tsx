import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { menuApi } from '../../api/endpoints';
import type { Product } from '../../types';

export function StockPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [target, setTarget] = useState<Product | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState('');

  const stockQuery = useQuery({
    queryKey: ['menu', 'stock'],
    queryFn: () => menuApi.stock(),
  });

  const allProducts = useQuery({
    queryKey: ['products', 'all-stock'],
    queryFn: () => menuApi.products(),
  });

  const adjust = useMutation({
    mutationFn: () => menuApi.adjustStock(target!._id, { delta, reason: reason || undefined }),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.save') });
      setTarget(null);
      setDelta(0);
      setReason('');
      await qc.invalidateQueries({ queryKey: ['menu', 'stock'] });
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: Error) => notifications.show({ color: 'red', message: e.message }),
  });

  const enableTrack = useMutation({
    mutationFn: (p: Product) =>
      menuApi.updateProduct(p._id, { trackStock: true, stockQty: p.stockQty || 0 }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['menu', 'stock'] });
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const tracked = stockQuery.data || [];
  const untracked = (allProducts.data || []).filter((p) => !p.trackStock);

  return (
    <AdminPageFrame title={t('hub.expStock')} hint={t('admin.stockHint')}>
      <Stack gap="lg">
        <Table.ScrollContainer minWidth={640}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('auth.name')}</Table.Th>
                <Table.Th>{t('admin.stockQty')}</Table.Th>
                <Table.Th>{t('admin.status')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tracked.map((p) => (
                <Table.Tr key={p._id}>
                  <Table.Td fw={600}>{p.name}</Table.Td>
                  <Table.Td>
                    <Text c={(p.stockQty || 0) <= 3 ? 'red' : undefined} fw={700}>
                      {p.stockQty ?? 0}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={p.availability === 'STOPPED' ? 'red' : 'teal'} variant="light">
                      {p.availability}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => {
                        setTarget(p);
                        setDelta(0);
                      }}
                    >
                      {t('admin.stockAdjust')}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!tracked.length && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed">{t('admin.stockEmpty')}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {untracked.length > 0 && (
          <Stack gap="xs">
            <Text fw={700} c="#143d34" style={{ fontFamily: 'Fraunces, serif' }}>
              {t('admin.stockEnable')}
            </Text>
            <Group gap="xs">
              {untracked.slice(0, 12).map((p) => (
                <Button
                  key={p._id}
                  size="compact-sm"
                  variant="default"
                  loading={enableTrack.isPending}
                  onClick={() => enableTrack.mutate(p)}
                >
                  + {p.name}
                </Button>
              ))}
            </Group>
          </Stack>
        )}
      </Stack>

      <Modal
        opened={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target?.name}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t('admin.stockQty')}: {target?.stockQty ?? 0}
          </Text>
          <NumberInput
            label={t('admin.stockDelta')}
            description={t('admin.stockDeltaHint')}
            value={delta}
            onChange={(v) => setDelta(typeof v === 'number' ? v : 0)}
          />
          <TextInput
            label={t('admin.stockReason')}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Button loading={adjust.isPending} onClick={() => adjust.mutate()} disabled={!delta}>
            {t('app.save')}
          </Button>
        </Stack>
      </Modal>
    </AdminPageFrame>
  );
}
