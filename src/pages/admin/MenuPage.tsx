import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Col, List, Row, Switch, Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { menuApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import type { ProductAvailability } from '../../types';

const { Title, Text } = Typography;

export function MenuPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.categories,
  });

  const activeCategory = categoryId || categoriesQuery.data?.[0]?._id;

  const productsQuery = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => menuApi.products(activeCategory),
    enabled: Boolean(activeCategory),
  });

  const stopMutation = useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: ProductAvailability }) =>
      menuApi.setStopList(id, availability),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success(t('app.success'));
    },
    onError: () => message.error(t('app.error')),
  });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.menu')}
      </Title>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Text strong>{t('admin.categories')}</Text>
          <List
            style={{ marginTop: 8 }}
            dataSource={categoriesQuery.data || []}
            renderItem={(c) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: activeCategory === c._id ? 'rgba(31,111,91,0.12)' : undefined,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
                onClick={() => setCategoryId(c._id)}
              >
                {c.name}
              </List.Item>
            )}
          />
        </Col>
        <Col xs={24} md={16}>
          <Text strong>{t('admin.products')}</Text>
          <List
            style={{ marginTop: 8 }}
            loading={productsQuery.isLoading}
            dataSource={productsQuery.data || []}
            renderItem={(p) => (
              <List.Item
                actions={[
                  <Switch
                    key="stop"
                    checkedChildren={t('availability.AVAILABLE')}
                    unCheckedChildren={t('admin.stopList')}
                    checked={p.availability === 'AVAILABLE'}
                    onChange={(checked) =>
                      stopMutation.mutate({
                        id: p._id,
                        availability: checked ? 'AVAILABLE' : 'STOPPED',
                      })
                    }
                  />,
                ]}
              >
                <List.Item.Meta
                  title={p.name}
                  description={`${formatMoney(p.priceTiyns)} · ${p.productionCenter}`}
                />
                <Button type="link">{t(`availability.${p.availability}`)}</Button>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </div>
  );
}
