import { useQuery } from '@tanstack/react-query';
import { Descriptions, Table, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsApi, shiftsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import { formatDateTime } from '../../utils/time';

const { Title, Text } = Typography;

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

function ShiftsReport() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const shiftsQuery = useQuery({
    queryKey: ['shifts', 'list'],
    queryFn: () => shiftsApi.list(30),
  });
  const detailQuery = useQuery({
    queryKey: ['reports', 'shift', selectedId],
    queryFn: () => reportsApi.shift(selectedId!),
    enabled: Boolean(selectedId),
  });

  const detail = detailQuery.data;

  return (
    <div>
      <Table
        rowKey="_id"
        loading={shiftsQuery.isLoading}
        dataSource={shiftsQuery.data || []}
        pagination={{ pageSize: 10 }}
        onRow={(row) => ({
          onClick: () => setSelectedId(row._id),
          style: {
            cursor: 'pointer',
            background: selectedId === row._id ? 'rgba(31,111,91,0.08)' : undefined,
          },
        })}
        columns={[
          {
            title: t('admin.openedAt'),
            dataIndex: 'openedAt',
            render: (v: string) => formatDateTime(v),
          },
          {
            title: t('admin.status'),
            dataIndex: 'status',
            render: (v: string) => (v === 'OPEN' ? t('cashier.openShift') : t('cashier.closeShift')),
          },
          {
            title: t('cashier.openingCash'),
            dataIndex: 'openingCashTiyns',
            render: (v: number) => formatMoney(v || 0),
          },
          {
            title: t('cashier.discrepancy'),
            dataIndex: 'discrepancyTiyns',
            render: (v?: number) => (v == null ? '—' : formatMoney(v)),
          },
        ]}
      />
      {selectedId && detail && (
        <Descriptions
          bordered
          size="small"
          style={{ marginTop: 16 }}
          title={t('admin.shiftReport')}
          column={1}
          items={[
            {
              key: 'payments',
              label: t('admin.reportPayments'),
              children: `${detail.paymentsCount} · ${formatMoney(detail.paymentsTotalTiyns)}`,
            },
            {
              key: 'orders',
              label: t('admin.ordersToday'),
              children: `${detail.ordersCount} (${t('orderStatus.PAID')}: ${detail.paidOrders}${
                detail.cancelledOrders != null
                  ? `, ${t('orderStatus.CANCELLED')}: ${detail.cancelledOrders}`
                  : ''
              })`,
            },
            ...(detail.byMethod
              ? Object.entries(detail.byMethod).map(([method, row]) => ({
                  key: method,
                  label: method,
                  children: `${row.count} · ${formatMoney(row.amountTiyns)}`,
                }))
              : []),
            detail.shift.expectedCashTiyns != null
              ? {
                  key: 'expected',
                  label: t('cashier.expected'),
                  children: formatMoney(detail.shift.expectedCashTiyns),
                }
              : {
                  key: 'hint',
                  label: '—',
                  children: <Text type="secondary">{t('admin.selectShift')}</Text>,
                },
          ]}
        />
      )}
    </div>
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
          {
            key: 'shifts',
            label: t('admin.reportShifts'),
            children: <ShiftsReport />,
          },
        ]}
      />
    </div>
  );
}
