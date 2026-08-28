import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
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
import { useSearchParams } from 'react-router-dom';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { menuApi } from '../../api/endpoints';
import { formatMoney, tengeToTiyns, tiynsToTenge } from '../../utils/money';
import { centerLabel } from '../../utils/centers';
import type { Category, Modifier, ModifierGroup, Product, ProductionCenter } from '../../types';

const CENTERS: ProductionCenter[] = ['COLD', 'KITCHEN', 'BAR', 'GRILL', 'DESSERT', 'OTHER'];

export function MenuPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const availabilityFilter = searchParams.get('filter'); // STOPPED | HIDDEN
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [catModal, setCatModal] = useState(false);
  const [prodModal, setProdModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [modModal, setModModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editingMod, setEditingMod] = useState<Modifier | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>();

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: menuApi.categories });
  const groupsQuery = useQuery({ queryKey: ['modifier-groups'], queryFn: menuApi.modifierGroups });
  const activeCategory = categoryId || categoriesQuery.data?.[0]?._id;
  const productsQuery = useQuery({
    queryKey: ['products', availabilityFilter ? 'all' : activeCategory],
    queryFn: () => menuApi.products(availabilityFilter ? undefined : activeCategory),
    enabled: Boolean(availabilityFilter) || Boolean(activeCategory),
  });
  const visibleProducts = useMemo(() => {
    const rows = productsQuery.data || [];
    if (availabilityFilter === 'STOPPED' || availabilityFilter === 'HIDDEN') {
      return rows.filter((p) => p.availability === availabilityFilter);
    }
    return rows;
  }, [productsQuery.data, availabilityFilter]);
  const selectedGroupId = activeGroupId || groupsQuery.data?.[0]?._id;
  const modifiersQuery = useQuery({
    queryKey: ['modifiers', selectedGroupId],
    queryFn: () => menuApi.modifiers(selectedGroupId),
    enabled: Boolean(selectedGroupId),
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
      modifierGroupIds: [] as string[],
    },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      categoryId: (v) => (v ? null : t('auth.required')),
      priceTenge: (v) => (v >= 0 ? null : t('auth.required')),
    },
  });

  const groupForm = useForm({
    initialValues: { name: '', minSelect: 0, maxSelect: 1 },
    validate: { name: (v) => (v.trim() ? null : t('auth.required')) },
  });

  const modForm = useForm({
    initialValues: { name: '', priceTenge: 0, groupId: '' },
    validate: {
      name: (v) => (v.trim() ? null : t('auth.required')),
      groupId: (v) => (v ? null : t('auth.required')),
    },
  });

  const centerOptions = useMemo(
    () => CENTERS.map((c) => ({ value: c, label: centerLabel(c) })),
    [],
  );

  const groupOptions = useMemo(
    () => (groupsQuery.data || []).map((g) => ({ value: g._id, label: g.name })),
    [groupsQuery.data],
  );

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['categories'] });
    await qc.invalidateQueries({ queryKey: ['products'] });
    await qc.invalidateQueries({ queryKey: ['modifier-groups'] });
    await qc.invalidateQueries({ queryKey: ['modifiers'] });
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
        modifierGroupIds: values.modifierGroupIds,
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

  const saveGroup = useMutation({
    mutationFn: async (values: typeof groupForm.values) => {
      const body = {
        name: values.name.trim(),
        minSelect: values.minSelect,
        maxSelect: values.maxSelect,
        required: values.minSelect > 0,
      };
      if (editingGroup) return menuApi.updateModifierGroup(editingGroup._id, body);
      return menuApi.createModifierGroup(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setGroupModal(false);
      setEditingGroup(null);
      groupForm.reset();
      await invalidate();
    },
    onError: () => notifications.show({ color: 'red', message: t('app.error') }),
  });

  const saveMod = useMutation({
    mutationFn: async (values: typeof modForm.values) => {
      const body = {
        name: values.name.trim(),
        groupId: values.groupId,
        priceTiyns: tengeToTiyns(values.priceTenge),
      };
      if (editingMod) {
        return menuApi.updateModifier(editingMod._id, {
          name: body.name,
          priceTiyns: body.priceTiyns,
        });
      }
      return menuApi.createModifier(body);
    },
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.success') });
      setModModal(false);
      setEditingMod(null);
      modForm.reset();
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

  const removeGroup = (g: ModifierGroup) => {
    modals.openConfirmModal({
      title: t('admin.modifierGroups'),
      children: <Text size="sm">{g.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await menuApi.removeModifierGroup(g._id);
          notifications.show({ color: 'teal', message: t('app.success') });
          if (activeGroupId === g._id) setActiveGroupId(undefined);
          await invalidate();
        } catch {
          notifications.show({ color: 'red', message: t('app.error') });
        }
      },
    });
  };

  const removeMod = (m: Modifier) => {
    modals.openConfirmModal({
      title: t('admin.modifiers'),
      children: <Text size="sm">{m.name}</Text>,
      labels: { confirm: t('app.delete'), cancel: t('app.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await menuApi.removeModifier(m._id);
          notifications.show({ color: 'teal', message: t('app.success') });
          await invalidate();
        } catch {
          notifications.show({ color: 'red', message: t('app.error') });
        }
      },
    });
  };

  return (
    <AdminPageFrame title={t('admin.menu')}>
      <Tabs defaultValue="products">
        <Tabs.List>
          <Tabs.Tab value="products">{t('admin.products')}</Tabs.Tab>
          <Tabs.Tab value="modifiers">{t('admin.modifiers')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="products" pt="md">
          <Group justify="flex-end" mb="md">
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
                  modifierGroupIds: [],
                });
                setProdModal(true);
              }}
            >
              {t('admin.products')}
            </Button>
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
                      <Table.Th>{t('auth.name')}</Table.Th>
                      <Table.Th>₸</Table.Th>
                      <Table.Th>{t('admin.status')}</Table.Th>
                      <Table.Th>{t('admin.stopList')}</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {visibleProducts.map((p) => (
                      <Table.Tr key={p._id}>
                        <Table.Td>
                          <Text fw={600}>{p.name}</Text>
                          {p.modifierGroups?.length ? (
                            <Text size="xs" c="dimmed">
                              {p.modifierGroups.map((g) => g.name).join(', ')}
                            </Text>
                          ) : null}
                        </Table.Td>
                        <Table.Td>
                          {formatMoney(p.priceTiyns ?? p.basePriceTiyns ?? 0)}
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{centerLabel(p.productionCenter)}</Badge>
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
                                  modifierGroupIds:
                                    p.modifierGroupIds?.map(String) ||
                                    p.modifierGroups?.map((g) => g._id) ||
                                    [],
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
        </Tabs.Panel>

        <Tabs.Panel value="modifiers" pt="md">
          <Group justify="flex-end" mb="md">
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingGroup(null);
                groupForm.setValues({ name: '', minSelect: 0, maxSelect: 1 });
                setGroupModal(true);
              }}
            >
              {t('admin.modifierGroups')}
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              disabled={!selectedGroupId}
              onClick={() => {
                setEditingMod(null);
                modForm.setValues({
                  name: '',
                  priceTenge: 0,
                  groupId: selectedGroupId || '',
                });
                setModModal(true);
              }}
            >
              {t('admin.modifiers')}
            </Button>
          </Group>

          <Group align="flex-start" grow preventGrowOverflow={false} wrap="wrap">
            <Paper p="md" withBorder maw={320} w="100%">
              <Text fw={700} mb="sm">
                {t('admin.modifierGroups')}
              </Text>
              <Stack gap={6}>
                {(groupsQuery.data || []).map((g) => (
                  <Group
                    key={g._id}
                    justify="space-between"
                    p="sm"
                    style={{
                      borderRadius: 10,
                      cursor: 'pointer',
                      background:
                        selectedGroupId === g._id ? 'rgba(31,111,91,0.12)' : 'transparent',
                    }}
                    onClick={() => setActiveGroupId(g._id)}
                  >
                    <Text fw={selectedGroupId === g._id ? 700 : 500}>{g.name}</Text>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroup(g);
                          groupForm.setValues({
                            name: g.name,
                            minSelect: g.minSelect ?? 0,
                            maxSelect: g.maxSelect ?? 1,
                          });
                          setGroupModal(true);
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
                          removeGroup(g);
                        }}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                ))}
                {!groupsQuery.data?.length && (
                  <Text c="dimmed" size="sm">
                    {t('app.empty')}
                  </Text>
                )}
              </Stack>
            </Paper>

            <Paper p="md" withBorder style={{ flex: 1 }}>
              <Text fw={700} mb="sm">
                {t('admin.modifiers')}
              </Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('auth.name')}</Table.Th>
                    <Table.Th>₸</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(modifiersQuery.data || []).map((m) => (
                    <Table.Tr key={m._id}>
                      <Table.Td>{m.name}</Table.Td>
                      <Table.Td>{formatMoney(m.priceTiyns)}</Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <ActionIcon
                            variant="subtle"
                            onClick={() => {
                              setEditingMod(m);
                              modForm.setValues({
                                name: m.name,
                                priceTenge: tiynsToTenge(m.priceTiyns),
                                groupId: m.groupId || selectedGroupId || '',
                              });
                              setModModal(true);
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red" onClick={() => removeMod(m)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {!modifiersQuery.data?.length && (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text c="dimmed" ta="center">
                          {t('app.empty')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Group>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={catModal} onClose={() => setCatModal(false)} title={t('admin.categories')}>
        <form onSubmit={catForm.onSubmit((v) => saveCat.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...catForm.getInputProps('name')} />
            <NumberInput label={t('admin.sortOrder')} {...catForm.getInputProps('sortOrder')} />
            <Button type="submit" loading={saveCat.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={prodModal} onClose={() => setProdModal(false)} title={t('admin.products')}>
        <form onSubmit={prodForm.onSubmit((v) => saveProd.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...prodForm.getInputProps('name')} />
            <Select
              label={t('admin.categories')}
              data={(categoriesQuery.data || []).map((c) => ({ value: c._id, label: c.name }))}
              {...prodForm.getInputProps('categoryId')}
            />
            <NumberInput
              label="₸"
              min={0}
              decimalScale={0}
              {...prodForm.getInputProps('priceTenge')}
            />
            <Select
              label={t('admin.status')}
              data={centerOptions}
              {...prodForm.getInputProps('productionCenter')}
            />
            <MultiSelect
              label={t('admin.modifierGroups')}
              data={groupOptions}
              {...prodForm.getInputProps('modifierGroupIds')}
            />
            <Textarea label={t('admin.description')} {...prodForm.getInputProps('description')} />
            <Button type="submit" loading={saveProd.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={groupModal}
        onClose={() => setGroupModal(false)}
        title={t('admin.modifierGroups')}
      >
        <form onSubmit={groupForm.onSubmit((v) => saveGroup.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...groupForm.getInputProps('name')} />
            <NumberInput label="Min" min={0} {...groupForm.getInputProps('minSelect')} />
            <NumberInput label="Max" min={1} {...groupForm.getInputProps('maxSelect')} />
            <Button type="submit" loading={saveGroup.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={modModal} onClose={() => setModModal(false)} title={t('admin.modifiers')}>
        <form onSubmit={modForm.onSubmit((v) => saveMod.mutate(v))}>
          <Stack>
            <TextInput label={t('auth.name')} {...modForm.getInputProps('name')} />
            <Select
              label={t('admin.modifierGroups')}
              data={groupOptions}
              disabled={Boolean(editingMod)}
              {...modForm.getInputProps('groupId')}
            />
            <NumberInput label="₸" min={0} decimalScale={0} {...modForm.getInputProps('priceTenge')} />
            <Button type="submit" loading={saveMod.isPending}>
              {t('app.save')}
            </Button>
          </Stack>
        </form>
      </Modal>
    </AdminPageFrame>
  );
}
