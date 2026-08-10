import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconKey, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { rolesApi, usersApi } from '../../api/endpoints';
import type { Employee } from '../../types';

type EmpForm = {
  name: string;
  email: string;
  password: string;
  roleId: string;
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pinUser, setPinUser] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });

  const form = useForm<EmpForm>({
    initialValues: { name: '', email: '', password: '', roleId: '' },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      email: (v) => (/^\S+@\S+$/.test(v) || editing ? null : t('auth.required')),
      password: (v) => (editing || v.length >= 6 ? null : t('auth.required')),
      roleId: (v) => (v ? null : t('auth.required')),
    },
  });

  const roleOptions = useMemo(
    () => (rolesQuery.data || []).map((r) => ({ value: r._id, label: r.name })),
    [rolesQuery.data],
  );

  const saveMutation = useMutation({
    mutationFn: async (values: EmpForm) => {
      if (editing) {
        const id = editing.id || editing._id!;
        return usersApi.update(id, { name: values.name, roleId: values.roleId });
      }
      return usersApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        roleId: values.roleId,
      });
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setOpened(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const pinMutation = useMutation({
    mutationFn: () => usersApi.setPin(pinUser!.id || pinUser!._id!, pin),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setPinOpen(false);
      setPin('');
      setPinUser(null);
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => usersApi.archive(id),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const openCreate = () => {
    setEditing(null);
    form.setValues({
      name: '',
      email: '',
      password: '',
      roleId: roleOptions[0]?.value || '',
    });
    setOpened(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    form.setValues({
      name: emp.name,
      email: emp.email || '',
      password: '',
      roleId: emp.roleId,
    });
    setOpened(true);
  };

  const confirmArchive = (emp: Employee) => {
    modals.openConfirmModal({
      title: t('admin.employees'),
      children: <Text size="sm">{emp.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => archiveMutation.mutate(emp.id || emp._id!),
    });
  };

  const rows = (usersQuery.data || []).map((emp) => (
    <Table.Tr key={emp.id || emp._id}>
      <Table.Td>
        <Text fw={600}>{emp.name}</Text>
        <Text size="xs" c="dimmed">
          {emp.email}
        </Text>
      </Table.Td>
      <Table.Td>{emp.roleName || '—'}</Table.Td>
      <Table.Td>
        <Badge color={emp.status === 'ACTIVE' ? 'teal' : 'gray'} variant="light">
          {emp.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={emp.hasPin ? 'teal' : 'gray'} variant="outline">
          PIN {emp.hasPin ? '✓' : '—'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={6} justify="flex-end">
          <ActionIcon variant="subtle" color="teal" onClick={() => openEdit(emp)}>
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="teal"
            onClick={() => {
              setPinUser(emp);
              setPin('');
              setPinOpen(true);
            }}
          >
            <IconKey size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => confirmArchive(emp)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t('admin.employees')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('app.create')}
        </Button>
      </Group>

      <Paper p="md" withBorder shadow="xs" bg="rgba(250,247,241,0.9)">
        <Table.ScrollContainer minWidth={720}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>{t('admin.roles')}</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>PIN</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
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
            <TextInput label={t('auth.name') || 'Name'} {...form.getInputProps('name')} />
            {!editing && (
              <TextInput label={t('auth.email')} {...form.getInputProps('email')} />
            )}
            {!editing && (
              <PasswordInput label={t('auth.password')} {...form.getInputProps('password')} />
            )}
            <Select
              label={t('admin.roles')}
              data={roleOptions}
              {...form.getInputProps('roleId')}
            />
            <Button type="submit" loading={saveMutation.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={pinOpen} onClose={() => setPinOpen(false)} title="PIN">
        <Stack>
          <PasswordInput
            label="PIN"
            value={pin}
            onChange={(e) => setPin(e.currentTarget.value)}
            inputMode="numeric"
          />
          <Button
            loading={pinMutation.isPending}
            onClick={() => pinMutation.mutate()}
            disabled={pin.length < 4}
          >
            {t('app.save')}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
