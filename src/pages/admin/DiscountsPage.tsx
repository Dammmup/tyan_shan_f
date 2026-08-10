import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { discountsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';

const { Title } = Typography;

export function DiscountsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['discounts'], queryFn: discountsApi.list });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.discounts')}
      </Title>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={data || []}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Type', dataIndex: 'type' },
          {
            title: 'Value',
            dataIndex: 'value',
            render: (v: number, row) =>
              row.type === 'PERCENT' ? `${v}%` : formatMoney(v),
          },
          {
            title: 'Active',
            dataIndex: 'isActive',
            render: (v: boolean) => (
              <Tag color={v === false ? 'default' : 'green'}>{v === false ? 'OFF' : 'ON'}</Tag>
            ),
          },
        ]}
      />
    </div>
  );
}
