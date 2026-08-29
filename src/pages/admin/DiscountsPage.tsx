import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { discountsApi } from '../../api/endpoints';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { formatMoney, tengeToTiyns, tiynsToTenge } from '../../utils/money';
import type { Discount, DiscountType } from '../../types';

type FormValues = {
  name: string;
  type: DiscountType;
  value: number;
  maxPercentAllowed: number;
  isActive: boolean;
};

export function DiscountsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['discounts'], queryFn: discountsApi.list });

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      type: 'PERCENT',
      value: 10,
      maxPercentAllowed: 30,
      isActive: true,
    },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      value: (v) => (v >= 0 ? null : t('auth.required')),
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        value:
          values.type === 'FIXED' ? tengeToTiyns(values.value) : Math.trunc(values.value),
        maxPercentAllowed: Math.trunc(values.maxPercentAllowed),
        isActive: values.isActive,
      };
      if (editing) return discountsApi.update(editing._id, payload);
      return discountsApi.create(payload);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setOpened(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const remove = (d: Discount) => {
    modals.openConfirmModal({
      title: t('admin.discounts'),
      children: <Text size="sm">{d.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await discountsApi.remove(d._id);
          notifications.show({ color: 'teal', message: t('app.success') });
          await qc.invalidateQueries({ queryKey: ['discounts'] });
        } catch {
          notifications.show({ color: 'red', message: t('app.error') });
        }
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    form.setValues({
      name: '',
      type: 'PERCENT',
      value: 10,
      maxPercentAllowed: 30,
      isActive: true,
    });
    setOpened(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    form.setValues({
      name: d.name,
      type: d.type,
      value: d.type === 'FIXED' ? tiynsToTenge(d.value) : d.value,
      maxPercentAllowed: d.maxPercentAllowed ?? d.maxPercent ?? 100,
      isActive: d.isActive !== false,
    });
    setOpened(true);
  };

  return (
    <AdminPageFrame
      title={t('admin.discounts')}
      actions={
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('app.create')}
        </Button>
      }
    >
      <Paper p="md" withBorder shadow="xs" radius="md" bg="rgba(250,247,241,0.9)">
        <Table.ScrollContainer minWidth={680}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Active</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data || []).map((d) => (
                <Table.Tr key={d._id} opacity={d.isActive === false ? 0.55 : 1}>
                  <Table.Td fw={600}>{d.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{d.type}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {d.type === 'PERCENT' ? `${d.value}%` : formatMoney(d.value)}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={d.isActive === false ? 'gray' : 'teal'} variant="light">
                      {d.isActive === false ? 'OFF' : 'ON'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" color="teal" onClick={() => openEdit(d)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => remove(d)}
                        disabled={d.isActive === false}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!isLoading && !(data || []).length ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center">
                      {t('app.empty')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal opened={opened} onClose={() => setOpened(false)} title={t('admin.discounts')}>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <TextInput label="Name" {...form.getInputProps('name')} />
            <Select
              label="Type"
              data={[
                { value: 'PERCENT', label: 'PERCENT' },
                { value: 'FIXED', label: 'FIXED ₸' },
              ]}
              {...form.getInputProps('type')}
            />
            <NumberInput
              label={form.values.type === 'FIXED' ? 'Amount ₸' : 'Percent %'}
              min={0}
              {...form.getInputProps('value')}
            />
            <NumberInput
              label="Max % allowed"
              min={0}
              max={100}
              {...form.getInputProps('maxPercentAllowed')}
            />
            <Switch
              label="Active"
              checked={form.values.isActive}
              onChange={(e) => form.setFieldValue('isActive', e.currentTarget.checked)}
            />
            <Button type="submit" loading={saveMutation.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </AdminPageFrame>
  );
}
