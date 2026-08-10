import { useQuery } from '@tanstack/react-query';
import { Tabs, Table, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';

const { Title } = Typography;

function ReportTable({
  queryKey,
  fetcher,
}: {
  queryKey: string;
  fetcher: () => Promise<{ label: string; count?: number; amountTiyns: number }[]>;
}) {
  const { data, isLoading } = useQuery({ queryKey: ['reports', queryKey], queryFn: fetcher });
  return (
    <Table
      rowKey={(r) => r.label}
      loading={isLoading}
      dataSource={data || []}
      columns={[
        { title: 'Name', dataIndex: 'label' },
        { title: 'Count', dataIndex: 'count' },
        {
          title: 'Amount',
          dataIndex: 'amountTiyns',
          render: (v: number) => formatMoney(v || 0),
        },
      ]}
    />
  );
}

export function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.reports')}
      </Title>
      <Tabs
        items={[
          {
            key: 'waiters',
            label: t('admin.reportWaiters'),
            children: <ReportTable queryKey="waiters" fetcher={reportsApi.waiters} />,
          },
          {
            key: 'products',
            label: t('admin.reportProducts'),
            children: <ReportTable queryKey="products" fetcher={reportsApi.products} />,
          },
          {
            key: 'payments',
            label: t('admin.reportPayments'),
            children: <ReportTable queryKey="payments" fetcher={reportsApi.payments} />,
          },
        ]}
      />
    </div>
  );
}
