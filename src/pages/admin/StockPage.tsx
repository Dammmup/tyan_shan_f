import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { menuApi } from '../../api/endpoints';
import type { Ingredient, Product } from '../../types';

export function StockPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [target, setTarget] = useState<Product | null>(null);
  const [ingTarget, setIngTarget] = useState<Ingredient | null>(null);
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');
  const [newIng, setNewIng] = useState({ name: '', unit: 'pcs', stockQty: 0 });
  const [recipeProductId, setRecipeProductId] = useState<string | null>(null);
  const [recipeLines, setRecipeLines] = useState<{ ingredientId: string; qty: number }[]>([]);

  const stockQuery = useQuery({ queryKey: ['menu', 'stock'], queryFn: () => menuApi.stock() });
  const allProducts = useQuery({
    queryKey: ['products', 'all-stock'],
    queryFn: () => menuApi.products(),
  });
  const ingredientsQuery = useQuery({
    queryKey: ['menu', 'ingredients'],
    queryFn: () => menuApi.ingredients(),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['menu'] });
    await qc.invalidateQueries({ queryKey: ['products'] });
  };

  const adjust = useMutation({
    mutationFn: () => menuApi.adjustStock(target!._id, { delta, reason: reason || undefined }),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.save') });
      setTarget(null);
      setDelta(0);
      await invalidate();
    },
  });

  const adjustIng = useMutation({
    mutationFn: () =>
      menuApi.adjustIngredientStock(ingTarget!._id, { delta, reason: reason || undefined }),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.save') });
      setIngTarget(null);
      setDelta(0);
      await invalidate();
    },
  });

  const createIng = useMutation({
    mutationFn: () =>
      menuApi.createIngredient({
        name: newIng.name.trim(),
        unit: newIng.unit,
        stockQty: newIng.stockQty,
      }),
    onSuccess: async () => {
      setNewIng({ name: '', unit: 'pcs', stockQty: 0 });
      await invalidate();
    },
  });

  const enableTrack = useMutation({
    mutationFn: (p: Product) =>
      menuApi.updateProduct(p._id, { trackStock: true, stockQty: p.stockQty || 0 }),
    onSuccess: invalidate,
  });

  const loadRecipe = useMutation({
    mutationFn: (productId: string) => menuApi.getRecipe(productId),
    onSuccess: (data) => {
      setRecipeLines(
        (data?.lines || []).map((l) => ({
          ingredientId: String(l.ingredientId),
          qty: l.qty,
        })),
      );
    },
  });

  const saveRecipe = useMutation({
    mutationFn: () => menuApi.upsertRecipe(recipeProductId!, recipeLines.filter((l) => l.ingredientId && l.qty > 0)),
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: t('app.save') });
      await invalidate();
    },
  });

  useEffect(() => {
    if (recipeProductId) loadRecipe.mutate(recipeProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeProductId]);

  const tracked = stockQuery.data || [];
  const untracked = (allProducts.data || []).filter((p) => !p.trackStock);
  const ingredients = ingredientsQuery.data || [];

  return (
    <AdminPageFrame title={t('hub.expStock')} hint={t('admin.stockHint')}>
      <Tabs defaultValue="dishes">
        <Tabs.List>
          <Tabs.Tab value="dishes">{t('admin.stockDishes')}</Tabs.Tab>
          <Tabs.Tab value="ingredients">{t('admin.stockIngredients')}</Tabs.Tab>
          <Tabs.Tab value="recipes">{t('admin.stockRecipes')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dishes" pt="md">
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
                        <Button size="xs" variant="light" onClick={() => { setTarget(p); setDelta(0); }}>
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
              <Group gap="xs">
                {untracked.slice(0, 12).map((p) => (
                  <Button key={p._id} size="compact-sm" variant="default" onClick={() => enableTrack.mutate(p)}>
                    + {p.name}
                  </Button>
                ))}
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="ingredients" pt="md">
          <Stack gap="md">
            <Group align="flex-end" grow>
              <TextInput
                label={t('auth.name')}
                value={newIng.name}
                onChange={(e) => setNewIng((s) => ({ ...s, name: e.currentTarget.value }))}
              />
              <TextInput
                label={t('admin.stockUnit')}
                value={newIng.unit}
                onChange={(e) => setNewIng((s) => ({ ...s, unit: e.currentTarget.value }))}
              />
              <NumberInput
                label={t('admin.stockQty')}
                value={newIng.stockQty}
                onChange={(v) => setNewIng((s) => ({ ...s, stockQty: typeof v === 'number' ? v : 0 }))}
              />
              <Button loading={createIng.isPending} disabled={!newIng.name.trim()} onClick={() => createIng.mutate()}>
                {t('app.create')}
              </Button>
            </Group>
            <Table.ScrollContainer minWidth={560}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('auth.name')}</Table.Th>
                    <Table.Th>{t('admin.stockUnit')}</Table.Th>
                    <Table.Th>{t('admin.stockQty')}</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ingredients.map((i) => (
                    <Table.Tr key={i._id}>
                      <Table.Td fw={600}>{i.name}</Table.Td>
                      <Table.Td>{i.unit}</Table.Td>
                      <Table.Td c={i.stockQty <= 3 ? 'red' : undefined} fw={700}>
                        {i.stockQty}
                      </Table.Td>
                      <Table.Td>
                        <Button size="xs" variant="light" onClick={() => { setIngTarget(i); setDelta(0); }}>
                          {t('admin.stockAdjust')}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="recipes" pt="md">
          <Stack gap="md">
            <Select
              label={t('admin.menu')}
              data={(allProducts.data || []).map((p) => ({ value: p._id, label: p.name }))}
              value={recipeProductId}
              onChange={setRecipeProductId}
              searchable
            />
            {recipeProductId && (
              <>
                {recipeLines.map((line, idx) => (
                  <Group key={idx} grow>
                    <Select
                      data={ingredients.map((i) => ({ value: i._id, label: `${i.name} (${i.unit})` }))}
                      value={line.ingredientId || null}
                      onChange={(v) =>
                        setRecipeLines((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, ingredientId: v || '' } : r)),
                        )
                      }
                    />
                    <NumberInput
                      label={t('admin.stockPerPortion')}
                      value={line.qty}
                      min={0}
                      decimalScale={3}
                      onChange={(v) =>
                        setRecipeLines((rows) =>
                          rows.map((r, i) => (i === idx ? { ...r, qty: typeof v === 'number' ? v : 0 } : r)),
                        )
                      }
                    />
                  </Group>
                ))}
                <Group>
                  <Button
                    variant="default"
                    onClick={() => setRecipeLines((rows) => [...rows, { ingredientId: '', qty: 0 }])}
                  >
                    +
                  </Button>
                  <Button loading={saveRecipe.isPending} onClick={() => saveRecipe.mutate()}>
                    {t('app.save')}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={Boolean(target)} onClose={() => setTarget(null)} title={target?.name}>
        <Stack>
          <NumberInput label={t('admin.stockDelta')} value={delta} onChange={(v) => setDelta(typeof v === 'number' ? v : 0)} />
          <TextInput label={t('admin.stockReason')} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Button loading={adjust.isPending} disabled={!delta} onClick={() => adjust.mutate()}>
            {t('app.save')}
          </Button>
        </Stack>
      </Modal>

      <Modal opened={Boolean(ingTarget)} onClose={() => setIngTarget(null)} title={ingTarget?.name}>
        <Stack>
          <NumberInput label={t('admin.stockDelta')} value={delta} onChange={(v) => setDelta(typeof v === 'number' ? v : 0)} />
          <TextInput label={t('admin.stockReason')} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Button loading={adjustIng.isPending} disabled={!delta} onClick={() => adjustIng.mutate()}>
            {t('app.save')}
          </Button>
        </Stack>
      </Modal>
    </AdminPageFrame>
  );
}
