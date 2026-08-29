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
import { printersApi } from '../../api/endpoints';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import type { Printer, ProductionCenter } from '../../types';
import { ALL_CENTERS, centerLabel } from '../../utils/centers';

type FormValues = {
  name: string;
  ip: string;
  port: number;
  productionCenter: ProductionCenter;
  isActive: boolean;
};

export function PrintersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['printers'], queryFn: printersApi.list });
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      ip: '127.0.0.1',
      port: 9100,
      productionCenter: 'KITCHEN',
      isActive: true,
    },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      ip: (v) => (v.trim() ? null : t('auth.required')),
      port: (v) => (v > 0 ? null : t('auth.required')),
      productionCenter: (v) => (v ? null : t('auth.required')),
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        name: values.name.trim(),
        ip: values.ip.trim(),
        port: values.port,
        productionCenter: values.productionCenter,
        isActive: values.isActive,
      };
      if (editing) return printersApi.update(editing._id, body);
      return printersApi.create(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setOpened(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => printersApi.remove(id),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      await qc.invalidateQueries({ queryKey: ['printers'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const openCreate = () => {
    setEditing(null);
    form.setValues({
      name: '',
      ip: '127.0.0.1',
      port: 9100,
      productionCenter: 'KITCHEN',
      isActive: true,
    });
    setOpened(true);
  };

  const openEdit = (p: Printer) => {
    setEditing(p);
    form.setValues({
      name: p.name,
      ip: p.ip || '127.0.0.1',
      port: p.port || 9100,
      productionCenter: (p.productionCenter || 'KITCHEN') as ProductionCenter,
      isActive: p.isActive !== false,
    });
    setOpened(true);
  };

  return (
    <AdminPageFrame
      title={t('admin.printers')}
      actions={
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('app.create')}
        </Button>
      }
    >
      <Paper p="md" withBorder radius="md" bg="rgba(250,247,241,0.9)">
        <Table.ScrollContainer minWidth={720}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Имя</Table.Th>
                <Table.Th>Цех</Table.Th>
                <Table.Th>IP</Table.Th>
                <Table.Th>Port</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data || []).map((p) => (
                <Table.Tr key={p._id}>
                  <Table.Td>
                    <Text fw={600}>{p.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{centerLabel(p.productionCenter)}</Badge>
                  </Table.Td>
                  <Table.Td>{p.ip}</Table.Td>
                  <Table.Td>{p.port}</Table.Td>
                  <Table.Td>
                    <Badge color={p.isActive === false ? 'gray' : 'teal'} variant="light">
                      {p.isActive === false ? 'OFF' : 'ON'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-end">
                      <ActionIcon variant="subtle" color="teal" onClick={() => openEdit(p)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          modals.openConfirmModal({
                            title: t('admin.printers'),
                            children: <Text size="sm">{p.name}</Text>,
                            labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
                            confirmProps: { color: 'red' },
                            onConfirm: () => removeMutation.mutate(p._id),
                          })
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!isLoading && !(data || []).length && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed">{t('app.empty')}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editing ? t('app.edit') : t('app.create')}
      >
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <TextInput label="Имя" placeholder="Холодный цех" {...form.getInputProps('name')} />
            <Select
              label="Цех"
              data={ALL_CENTERS.map((c) => ({ value: c, label: centerLabel(c) }))}
              {...form.getInputProps('productionCenter')}
            />
            <TextInput label="IP" {...form.getInputProps('ip')} />
            <NumberInput label="Port" min={1} max={65535} {...form.getInputProps('port')} />
            <Switch
              label="Активен"
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
