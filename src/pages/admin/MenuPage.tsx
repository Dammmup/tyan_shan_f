import { useMemo, useState } from 'react';
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
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { menuApi } from '../../api/endpoints';
import { formatMoney, tengeToTiyns, tiynsToTenge } from '../../utils/money';
import type { Category, Product, ProductionCenter } from '../../types';

const CENTERS: ProductionCenter[] = ['KITCHEN', 'BAR', 'GRILL', 'DESSERT', 'OTHER'];

export function MenuPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [catModal, setCatModal] = useState(false);
  const [prodModal, setProdModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: menuApi.categories });
  const activeCategory = categoryId || categoriesQuery.data?.[0]?._id;
  const productsQuery = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => menuApi.products(activeCategory),
    enabled: Boolean(activeCategory),
  });

  const catForm = useForm({
    initialValues: { name: '', sortOrder: 0 },
    validate: { name: (v) => (v.trim() ? null : t('auth.required')) },
  });

  const prodForm = useForm({
    initialValues: {
      name: '',
      categoryId: '',
      priceTenge: 0,
      productionCenter: 'KITCHEN' as ProductionCenter,
      description: '',
    },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      categoryId: (v) => (v ? null : t('auth.required')),
      priceTenge: (v) => (v >= 0 ? null : t('auth.required')),
    },
  });

  const centerOptions = useMemo(
    () => CENTERS.map((c) => ({ value: c, label: c })),
    [],
  );

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['categories'] });
    await qc.invalidateQueries({ queryKey: ['products'] });
  };

  const saveCat = useMutation({
    mutationFn: async (values: { name: string; sortOrder: number }) => {
      if (editingCat) return menuApi.updateCategory(editingCat._id, values);
      return menuApi.createCategory(values);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setCatModal(false);
      setEditingCat(null);
      catForm.reset();
      await invalidate();
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const saveProd = useMutation({
    mutationFn: async (values: typeof prodForm.values) => {
      const body = {
        name: values.name,
        categoryId: values.categoryId,
        basePriceTiyns: tengeToTiyns(values.priceTenge),
        productionCenter: values.productionCenter,
        description: values.description || undefined,
      };
      if (editingProd) return menuApi.updateProduct(editingProd._id, body);
      return menuApi.createProduct(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setProdModal(false);
      setEditingProd(null);
      prodForm.reset();
      await invalidate();
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const stopMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      menuApi.setStopList(id, available ? 'AVAILABLE' : 'STOPPED'),
    onSuccess: async () => {
      await invalidate();
    },
  });

  const removeCat = (cat: Category) => {
    modals.openConfirmModal({
      title: t('admin.categories'),
      children: <Text size="sm">{cat.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await menuApi.removeCategory(cat._id);
          notifications.show({ color: 'teal', message: t('app.success') });
          if (categoryId === cat._id) setCategoryId(undefined);
          await invalidate();
        } catch {
          notifications.show({ color: 'red', message: t('app.error') });
        }
      },
    });
  };

  const removeProd = (p: Product) => {
    modals.openConfirmModal({
      title: t('admin.products'),
      children: <Text size="sm">{p.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await menuApi.removeProduct(p._id);
          notifications.show({ color: 'teal', message: t('app.success') });
          await invalidate();
        } catch {
          notifications.show({ color: 'red', message: t('app.error') });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t('admin.menu')}</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingCat(null);
              catForm.setValues({ name: '', sortOrder: (categoriesQuery.data?.length || 0) + 1 });
              setCatModal(true);
            }}
          >
            {t('admin.categories')}
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingProd(null);
              prodForm.setValues({
                name: '',
                categoryId: activeCategory || '',
                priceTenge: 0,
                productionCenter: 'KITCHEN',
                description: '',
              });
              setProdModal(true);
            }}
          >
            {t('admin.products')}
          </Button>
        </Group>
      </Group>

      <Group align="flex-start" grow preventGrowOverflow={false} wrap="wrap">
        <Paper p="md" withBorder shadow="xs" bg="rgba(250,247,241,0.9)" maw={320} w="100%">
          <Text fw={700} mb="sm">
            {t('admin.categories')}
          </Text>
          <Stack gap={6}>
            {(categoriesQuery.data || []).map((c) => (
              <Group
                key={c._id}
                justify="space-between"
                p="sm"
                style={{
                  borderRadius: 10,
                  cursor: 'pointer',
                  background:
                    activeCategory === c._id ? 'rgba(31,111,91,0.12)' : 'transparent',
                }}
                onClick={() => setCategoryId(c._id)}
              >
                <Text fw={activeCategory === c._id ? 700 : 500}>{c.name}</Text>
                <Group gap={4}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCat(c);
                      catForm.setValues({ name: c.name, sortOrder: c.sortOrder || 0 });
                      setCatModal(true);
                    }}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCat(c);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Paper p="md" withBorder shadow="xs" bg="rgba(250,247,241,0.9)" style={{ flex: 1 }}>
          <Text fw={700} mb="sm">
            {t('admin.products')}
          </Text>
          <Table.ScrollContainer minWidth={560}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Center</Table.Th>
                  <Table.Th>{t('admin.stopList')}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(productsQuery.data || []).map((p) => (
                  <Table.Tr key={p._id}>
                    <Table.Td>
                      <Text fw={600}>{p.name}</Text>
                      {p.description ? (
                        <Text size="xs" c="dimmed">
                          {p.description}
                        </Text>
                      ) : null}
                    </Table.Td>
                    <Table.Td>
                      {formatMoney(p.priceTiyns ?? p.basePriceTiyns ?? 0)}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{p.productionCenter}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={p.availability === 'AVAILABLE'}
                        onChange={(e) =>
                          stopMutation.mutate({
                            id: p._id,
                            available: e.currentTarget.checked,
                          })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="teal"
                          onClick={() => {
                            setEditingProd(p);
                            prodForm.setValues({
                              name: p.name,
                              categoryId: p.categoryId,
                              priceTenge: tiynsToTenge(p.priceTiyns ?? p.basePriceTiyns ?? 0),
                              productionCenter: p.productionCenter,
                              description: p.description || '',
                            });
                            setProdModal(true);
                          }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => removeProd(p)}>
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
      </Group>

      <Modal opened={catModal} onClose={() => setCatModal(false)} title={t('admin.categories')}>
        <form onSubmit={catForm.onSubmit((v) => saveCat.mutate(v))}>
          <Stack>
            <TextInput label="Name" {...catForm.getInputProps('name')} />
            <NumberInput label="Sort" {...catForm.getInputProps('sortOrder')} />
            <Button type="submit" loading={saveCat.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={prodModal} onClose={() => setProdModal(false)} title={t('admin.products')}>
        <form onSubmit={prodForm.onSubmit((v) => saveProd.mutate(v))}>
          <Stack>
            <TextInput label="Name" {...prodForm.getInputProps('name')} />
            <Select
              label={t('admin.categories')}
              data={(categoriesQuery.data || []).map((c) => ({ value: c._id, label: c.name }))}
              {...prodForm.getInputProps('categoryId')}
            />
            <NumberInput
              label="Price ₸"
              min={0}
              decimalScale={0}
              {...prodForm.getInputProps('priceTenge')}
            />
            <Select
              label="Production center"
              data={centerOptions}
              {...prodForm.getInputProps('productionCenter')}
            />
            <Textarea label="Description" {...prodForm.getInputProps('description')} />
            <Button type="submit" loading={saveProd.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
