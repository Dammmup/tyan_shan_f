import { useQuery } from '@tanstack/react-query';
import { DatePicker, Descriptions, Table, Tabs, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { reportsApi, shiftsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import { formatDateTime } from '../../utils/time';

const { Text } = Typography;

function ReportTable({
  queryKey,
  date,
  fetcher,
}: {
  queryKey: string;
  date: string;
  fetcher: (date: string) => Promise<{ label: string; count?: number; amountTiyns: number }[]>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', queryKey, date],
    queryFn: () => fetcher(date),
  });
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
  const [day, setDay] = useState<Dayjs>(() => dayjs());
  const date = day.format('YYYY-MM-DD');

  return (
    <AdminPageFrame
      title={t('admin.reports')}
      hint={t('admin.reportDateHint')}
      actions={
        <DatePicker
          value={day}
          onChange={(v) => v && setDay(v)}
          allowClear={false}
          format="DD.MM.YYYY"
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          size="large"
        />
      }
    >
      <Tabs
        items={[
          {
            key: 'waiters',
            label: t('admin.reportWaiters'),
            children: (
              <ReportTable queryKey="waiters" date={date} fetcher={reportsApi.waiters} />
            ),
          },
          {
            key: 'products',
            label: t('admin.reportProducts'),
            children: (
              <ReportTable queryKey="products" date={date} fetcher={reportsApi.products} />
            ),
          },
          {
            key: 'payments',
            label: t('admin.reportPayments'),
            children: (
              <ReportTable queryKey="payments" date={date} fetcher={reportsApi.payments} />
            ),
          },
          {
            key: 'shifts',
            label: t('admin.reportShifts'),
            children: <ShiftsReport />,
          },
        ]}
      />
    </AdminPageFrame>
  );
}
