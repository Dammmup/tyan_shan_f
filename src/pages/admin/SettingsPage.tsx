import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  NumberInput,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { restaurantsApi } from '../../api/endpoints';
import { setAppLanguage } from '../../i18n';
import { useAuthStore } from '../../stores/authStore';
import { AdminPageFrame } from '../../components/AdminPageFrame';

type FormValues = {
  name: string;
  address: string;
  timezone: string;
  serviceChargePercent: number;
};

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const restaurantId = useAuthStore((s) => s.restaurantId || s.user?.restaurantId || null);

  const restaurantsQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantsApi.list,
  });

  const restaurant =
    restaurantsQuery.data?.find((r) => r._id === restaurantId) || restaurantsQuery.data?.[0];

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      address: '',
      timezone: 'Asia/Almaty',
      serviceChargePercent: 10,
    },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      serviceChargePercent: (v) => (v >= 0 && v <= 100 ? null : t('auth.required')),
    },
  });

  useEffect(() => {
    if (!restaurant) return;
    form.setValues({
      name: restaurant.name || '',
      address: restaurant.address || '',
      timezone: restaurant.timezone || 'Asia/Almaty',
      serviceChargePercent: restaurant.serviceChargePercent ?? 10,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?._id, restaurant?.name, restaurant?.address, restaurant?.timezone, restaurant?.serviceChargePercent]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!restaurant?._id) throw new Error('no restaurant');
      return restaurantsApi.update(restaurant._id, {
        name: values.name.trim(),
        address: values.address.trim() || undefined,
        timezone: values.timezone.trim() || 'Asia/Almaty',
        serviceChargePercent: Math.trunc(values.serviceChargePercent),
      });
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      await qc.invalidateQueries({ queryKey: ['restaurants'] });
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  return (
    <AdminPageFrame title={t('admin.settings')}>
      <Stack gap="lg" maw={640}>
        <Stack gap="xs">
          <Text fw={600}>{t('hub.configSection')}</Text>
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            {[
              { path: '/admin/menu', label: t('admin.menu') },
              { path: '/admin/halls', label: t('admin.halls') },
              { path: '/admin/printers', label: t('admin.printers') },
              { path: '/admin/roles', label: t('admin.roles') },
              { path: '/admin/discounts', label: t('admin.discounts') },
              { path: '/admin/audit', label: t('admin.audit') },
            ].map((item) => (
              <Button
                key={item.path}
                variant="light"
                color="teal"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </Button>
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="xs">
          <Text fw={600}>{t('admin.languageHint')}</Text>
          <Radio.Group value={i18n.language} onChange={(v) => setAppLanguage(v)}>
            <Stack gap="xs">
              <Radio value="ru" label="Русский" />
              <Radio value="kk" label="Қазақша" />
              <Radio value="en" label="English" />
            </Stack>
          </Radio.Group>
        </Stack>

        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack gap="sm">
            <Text fw={600}>{t('admin.restaurantSettings')}</Text>
            <TextInput label={t('admin.cafeName')} {...form.getInputProps('name')} />
            <TextInput label={t('admin.address')} {...form.getInputProps('address')} />
            <TextInput label={t('admin.timezone')} {...form.getInputProps('timezone')} />
            <NumberInput
              label={t('admin.servicePercent')}
              min={0}
              max={100}
              suffix=" %"
              {...form.getInputProps('serviceChargePercent')}
            />
            <Button type="submit" loading={saveMutation.isPending} disabled={!restaurant}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Stack>
    </AdminPageFrame>
  );
}
