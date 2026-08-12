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
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconEye, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { hallsApi, ordersApi, tablesApi } from '../../api/endpoints';
import type { Hall, Table as HallTable } from '../../types';
import { TABLE_STATUS_COLORS } from '../../utils/roles';
import { waiterHome, waiterOrderPath } from '../../utils/paths';
import { useAuthStore } from '../../stores/authStore';

type HallForm = { name: string; sortOrder: number };
type TableForm = { name: string; seats: number };

export function HallsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [hallId, setHallId] = useState<string | undefined>();
  const [hallModal, setHallModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [editingTable, setEditingTable] = useState<HallTable | null>(null);

  const hallsQuery = useQuery({ queryKey: ['halls'], queryFn: hallsApi.list });
  const activeHallId = hallId || hallsQuery.data?.[0]?._id;
  const tablesQuery = useQuery({
    queryKey: ['tables', activeHallId],
    queryFn: () => tablesApi.list(activeHallId),
    enabled: Boolean(activeHallId),
  });

  const hallForm = useForm<HallForm>({
    initialValues: { name: '', sortOrder: 0 },
    validate: { name: (v) => (v.trim() ? null : t('auth.required')) },
  });

  const tableForm = useForm<TableForm>({
    initialValues: { name: '', seats: 4 },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      seats: (v) => (v >= 1 ? null : t('auth.required')),
    },
  });

  const saveHall = useMutation({
    mutationFn: async (values: HallForm) => {
      const body = { name: values.name.trim(), sortOrder: values.sortOrder };
      if (editingHall) return hallsApi.update(editingHall._id, body);
      return hallsApi.create(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setHallModal(false);
      setEditingHall(null);
      hallForm.reset();
      await qc.invalidateQueries({ queryKey: ['halls'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const removeHall = useMutation({
    mutationFn: (id: string) => hallsApi.remove(id),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setHallId(undefined);
      await qc.invalidateQueries({ queryKey: ['halls'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const saveTable = useMutation({
    mutationFn: async (values: TableForm) => {
      if (!activeHallId) throw new Error('no hall');
      if (editingTable) {
        return tablesApi.update(editingTable._id, {
          name: values.name.trim(),
          seats: values.seats,
        });
      }
      return tablesApi.create({
        name: values.name.trim(),
        hallId: activeHallId,
        seats: values.seats,
      });
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setTableModal(false);
      setEditingTable(null);
      tableForm.reset();
      await qc.invalidateQueries({ queryKey: ['tables', activeHallId] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const removeTable = useMutation({
    mutationFn: (id: string) => tablesApi.remove(id),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      await qc.invalidateQueries({ queryKey: ['tables', activeHallId] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const openCreateHall = () => {
    setEditingHall(null);
    hallForm.setValues({ name: '', sortOrder: (hallsQuery.data?.length || 0) + 1 });
    setHallModal(true);
  };

  const openEditHall = (hall: Hall) => {
    setEditingHall(hall);
    hallForm.setValues({ name: hall.name, sortOrder: hall.sortOrder || 0 });
    setHallModal(true);
  };

  const openCreateTable = () => {
    setEditingTable(null);
    tableForm.setValues({ name: '', seats: 4 });
    setTableModal(true);
  };

  const openEditTable = (table: HallTable) => {
    setEditingTable(table);
    tableForm.setValues({
      name: table.name,
      seats: table.seats || table.capacity || 4,
    });
    setTableModal(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t('admin.halls')}</Title>
        <Group>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openCreateHall}>
            {t('admin.addHall')}
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreateTable}
            disabled={!activeHallId}
          >
            {t('admin.addTable')}
          </Button>
        </Group>
      </Group>

      <Group>
        <Select
          style={{ minWidth: 220 }}
          value={activeHallId}
          onChange={(v) => setHallId(v || undefined)}
          data={(hallsQuery.data || []).map((h) => ({ value: h._id, label: h.name }))}
          placeholder={t('admin.halls')}
        />
        {activeHallId && (
          <>
            <ActionIcon
              variant="subtle"
              onClick={() => {
                const hall = hallsQuery.data?.find((h) => h._id === activeHallId);
                if (hall) openEditHall(hall);
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() =>
                modals.openConfirmModal({
                  title: t('app.delete'),
                  children: <Text size="sm">{t('admin.deleteHallConfirm')}</Text>,
                  labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
                  confirmProps: { color: 'red' },
                  onConfirm: () => removeHall.mutate(activeHallId),
                })
              }
            >
              <IconTrash size={18} />
            </ActionIcon>
          </>
        )}
      </Group>

      <Paper withBorder radius="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('auth.name')}</Table.Th>
              <Table.Th>{t('admin.seats')}</Table.Th>
              <Table.Th>{t('admin.status')}</Table.Th>
              <Table.Th style={{ width: 100 }}>{t('app.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(tablesQuery.data || []).map((table) => (
              <Table.Tr key={table._id}>
                <Table.Td>
                  <Group gap="xs">
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: TABLE_STATUS_COLORS[table.status] || '#888',
                      }}
                    />
                    <Text fw={600}>{table.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{table.seats || table.capacity || '—'}</Table.Td>
                <Table.Td>
                  <Badge variant="light">{t(`tableStatus.${table.status}`)}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {table.currentOrderId || table.status === 'OCCUPIED' ? (
                      <Tooltip label={t('waiter.openOrder')}>
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => {
                            void (async () => {
                              try {
                                if (table.currentOrderId) {
                                  navigate(waiterOrderPath(table.currentOrderId, user?.role));
                                  return;
                                }
                                const order = await ordersApi.byTable(table._id);
                                if (order?._id) {
                                  navigate(waiterOrderPath(order._id, user?.role));
                                  return;
                                }
                              } catch {
                                // fall through to hall view
                              }
                              navigate(waiterHome(user?.role));
                            })();
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null}
                    <ActionIcon variant="subtle" onClick={() => openEditTable(table)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() =>
                        modals.openConfirmModal({
                          title: t('app.delete'),
                          children: <Text size="sm">{t('admin.deleteTableConfirm')}</Text>,
                          labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
                          confirmProps: { color: 'red' },
                          onConfirm: () => removeTable.mutate(table._id),
                        })
                      }
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {!tablesQuery.data?.length && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="md">
                    {t('app.empty')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={hallModal}
        onClose={() => setHallModal(false)}
        title={editingHall ? t('app.edit') : t('admin.addHall')}
      >
        <form onSubmit={hallForm.onSubmit((v) => saveHall.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...hallForm.getInputProps('name')} />
            <NumberInput label={t('admin.sortOrder')} min={0} {...hallForm.getInputProps('sortOrder')} />
            <Button type="submit" loading={saveHall.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={tableModal}
        onClose={() => setTableModal(false)}
        title={editingTable ? t('app.edit') : t('admin.addTable')}
      >
        <form onSubmit={tableForm.onSubmit((v) => saveTable.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...tableForm.getInputProps('name')} />
            <NumberInput label={t('admin.seats')} min={1} {...tableForm.getInputProps('seats')} />
            <Button type="submit" loading={saveTable.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
