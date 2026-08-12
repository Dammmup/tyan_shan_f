import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { rolesApi } from '../../api/endpoints';
import type { Role } from '../../types';
import { ALL_PERMISSIONS } from '../../utils/permissions';

type FormValues = {
  name: string;
  permissions: string[];
};

export function RolesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const form = useForm<FormValues>({
    initialValues: { name: '', permissions: [] },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      permissions: (v) => (v.length ? null : t('auth.required')),
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        name: values.name.trim(),
        permissions: values.permissions,
      };
      if (editing) return rolesApi.update(editing._id, body);
      return rolesApi.create(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setOpened(false);
      setEditing(null);
      form.reset();
      await qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const openCreate = () => {
    setEditing(null);
    form.setValues({ name: '', permissions: [] });
    setOpened(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    form.setValues({
      name: role.name,
      permissions: [...(role.permissions || [])],
    });
    setOpened(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t('admin.roles')}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          {t('app.create')}
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">{t('app.loading')}</Text>
      ) : (
        <Stack gap="sm">
          {(data || []).map((role) => (
            <Stack
              key={role._id}
              gap="xs"
              p="md"
              style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 12 }}
            >
              <Group justify="space-between">
                <Text fw={700}>{role.name}</Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconEdit size={14} />}
                  onClick={() => openEdit(role)}
                >
                  {t('app.edit')}
                </Button>
              </Group>
              <Group gap={6}>
                {(role.permissions || []).map((p) => (
                  <Badge key={p} variant="light" color="cyan">
                    {p}
                  </Badge>
                ))}
                {!role.permissions?.length && (
                  <Text size="sm" c="dimmed">
                    {t('app.empty')}
                  </Text>
                )}
              </Group>
            </Stack>
          ))}
        </Stack>
      )}

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editing ? t('app.edit') : t('app.create')}
        size="lg"
      >
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...form.getInputProps('name')} />
            <Text size="sm" fw={600}>
              {t('admin.permissions')}
            </Text>
            <ScrollArea h={320} offsetScrollbars>
              <Checkbox.Group {...form.getInputProps('permissions')}>
                <Stack gap={8}>
                  {ALL_PERMISSIONS.map((p) => (
                    <Checkbox key={p} value={p} label={p} />
                  ))}
                </Stack>
              </Checkbox.Group>
            </ScrollArea>
            <Button type="submit" loading={saveMutation.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
