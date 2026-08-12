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
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { rolesApi, usersApi } from '../../api/endpoints';
import type { Employee } from '../../types';

type EmpForm = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  pin: string;
};

function empId(emp: Employee) {
  return emp.id || emp._id || '';
}

export function EmployeesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });

  const form = useForm<EmpForm>({
    initialValues: { name: '', email: '', password: '', roleId: '', pin: '' },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      email: (v) => {
        if (editing) return null;
        if (!v.trim()) return t('auth.required');
        return /^\S+@\S+\.\S+$/.test(v) ? null : 'email must be an email';
      },
      password: (v) => (editing || v.length >= 6 ? null : t('auth.required')),
      roleId: (v) => (v ? null : t('auth.required')),
      pin: (v) => (!v || v.length >= 4 ? null : 'PIN минимум 4 цифры'),
    },
  });

  const roleOptions = useMemo(
    () =>
      (rolesQuery.data || []).map((r) => ({
        value: String((r as { _id?: string; id?: string })._id || (r as { id?: string }).id || ''),
        label: r.name,
      })).filter((r) => r.value),
    [rolesQuery.data],
  );

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rolesQuery.data || []) {
      const id = String((r as { _id?: string; id?: string })._id || (r as { id?: string }).id || '');
      if (id) map.set(id, r.name);
    }
    return map;
  }, [rolesQuery.data]);

  const employees = useMemo(() => {
    return (usersQuery.data || []).map((emp) => ({
      ...emp,
      id: empId(emp),
      displayName: emp.name || emp.email || empId(emp) || '—',
      displayRole:
        emp.roleName ||
        roleNameById.get(String(emp.roleId)) ||
        t(`roles.${emp.roleId}`, { defaultValue: '—' }),
    }));
  }, [usersQuery.data, roleNameById, t]);

  const saveMutation = useMutation({
    mutationFn: async (values: EmpForm) => {
      if (editing) {
        const id = empId(editing);
        await usersApi.update(id, { name: values.name.trim(), roleId: values.roleId });
        if (values.pin.trim()) {
          await usersApi.setPin(id, values.pin.trim());
        }
        return;
      }
      const created = await usersApi.create({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        roleId: values.roleId,
      });
      const id = empId(created);
      if (id && values.pin.trim()) {
        await usersApi.setPin(id, values.pin.trim());
      }
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setOpened(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message || t('app.error');
      notifications.show({
        color: 'red',
        message: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    },
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
      pin: '',
    });
    setOpened(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    form.setValues({
      name: emp.name || '',
      email: emp.email || '',
      password: '',
      roleId: String(emp.roleId || ''),
      pin: '',
    });
    setOpened(true);
  };

  const confirmArchive = (emp: Employee & { displayName: string }) => {
    modals.openConfirmModal({
      title: t('admin.employees'),
      children: <Text size="sm">{emp.displayName}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => archiveMutation.mutate(empId(emp)),
    });
  };

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
                <Table.Th>Имя</Table.Th>
                <Table.Th>{t('admin.roles')}</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>PIN</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employees.map((emp) => (
                <Table.Tr key={emp.id}>
                  <Table.Td>
                    <Text fw={600}>{emp.displayName}</Text>
                    <Text size="xs" c="dimmed">
                      {emp.email || '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>{emp.displayRole}</Table.Td>
                  <Table.Td>
                    <Badge color={emp.status === 'ACTIVE' ? 'teal' : 'gray'} variant="light">
                      {emp.status || '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={emp.hasPin ? 'teal' : 'orange'} variant="light">
                      {emp.hasPin ? t('admin.pinSet') : t('admin.pinMissing')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-end">
                      <ActionIcon variant="subtle" color="teal" onClick={() => openEdit(emp)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => confirmArchive(emp)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
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
            <TextInput label="Имя" {...form.getInputProps('name')} />
            {!editing && (
              <TextInput
                label={t('auth.email')}
                placeholder="waiter@demo.kz"
                {...form.getInputProps('email')}
              />
            )}
            {!editing && (
              <PasswordInput label={t('auth.password')} {...form.getInputProps('password')} />
            )}
            <Select
              label={t('admin.roles')}
              data={roleOptions}
              searchable
              {...form.getInputProps('roleId')}
            />
            <TextInput
              label="PIN"
              description={
                editing
                  ? editing.hasPin
                    ? t('admin.pinEditHintSet')
                    : t('admin.pinEditHintMissing')
                  : t('admin.pinCreateHint')
              }
              placeholder="1111"
              inputMode="numeric"
              autoComplete="off"
              {...form.getInputProps('pin')}
            />
            <Button type="submit" loading={saveMutation.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
