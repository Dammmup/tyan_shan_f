import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatePicker, Descriptions, List, Spin, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportsApi, shiftsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import { formatDateTime } from '../../utils/time';
import { waiterOrderPath } from '../../utils/paths';
import { useAuthStore } from '../../stores/authStore';
import type { HubReportId } from '../../hub/hubConfig';

const { Title, Text } = Typography;

const TITLES: Partial<Record<HubReportId, string>> = {
  dashboard: 'hub.revTotal',
  waiters: 'admin.reportWaiters',
  products: 'admin.reportProducts',
  payments: 'admin.reportPayments',
  shifts: 'admin.reportShifts',
  'paid-orders': 'hub.closedOrders',
  'open-orders': 'admin.openTables',
};

export function ReportViewPage() {
  const { reportId = 'dashboard' } = useParams();
  const report = reportId as HubReportId;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [day, setDay] = useState<Dayjs>(() => dayjs());
  const date = day.format('YYYY-MM-DD');

  const dashboardQuery = useQuery({
    queryKey: ['reports', 'view', 'dashboard', date],
    queryFn: () => reportsApi.dashboard(date),
    enabled: report === 'dashboard' || report === 'paid-orders' || report === 'open-orders',
  });

  const tableQuery = useQuery({
    queryKey: ['reports', 'view', report, date],
    queryFn: async () => {
      if (report === 'waiters') return reportsApi.waiters(date);
      if (report === 'products') return reportsApi.products(date);
      if (report === 'payments') return reportsApi.payments(date);
      return [];
    },
    enabled: report === 'waiters' || report === 'products' || report === 'payments',
  });

  const shiftsQuery = useQuery({
    queryKey: ['shifts', 'list', 'view'],
    queryFn: () => shiftsApi.list(30),
    enabled: report === 'shifts',
  });

  const [selectedShift, setSelectedShift] = useState<string | undefined>();
  const shiftDetail = useQuery({
    queryKey: ['reports', 'shift', selectedShift],
    queryFn: () => reportsApi.shift(selectedShift!),
    enabled: report === 'shifts' && Boolean(selectedShift),
  });

  const title = t(TITLES[report] || 'admin.reports');

  return (
    <div style={{ padding: 16, background: '#e8e4dc', minHeight: '100%' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            minWidth: 64,
            minHeight: 48,
            background: '#2f6db5',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <Title level={3} style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>
          {title}
        </Title>
        {(report === 'dashboard' ||
          report === 'waiters' ||
          report === 'products' ||
          report === 'payments' ||
          report === 'paid-orders') && (
          <DatePicker
            value={day}
            onChange={(v) => v && setDay(v)}
            allowClear={false}
            format="DD.MM.YYYY"
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          />
        )}
      </div>

      {report === 'dashboard' && (
        dashboardQuery.isLoading ? (
          <Spin />
        ) : (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={t('admin.revenueToday')}>
              {formatMoney(dashboardQuery.data?.revenueTodayTiyns || 0)}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.ordersToday')}>
              {dashboardQuery.data?.ordersCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.avgCheck')}>
              {formatMoney(dashboardQuery.data?.avgCheckTiyns || 0)}
            </Descriptions.Item>
            <Descriptions.Item label={t('admin.guestsToday')}>
              {dashboardQuery.data?.guestsCount || 0}
            </Descriptions.Item>
          </Descriptions>
        )
      )}

      {(report === 'waiters' || report === 'products' || report === 'payments') && (
        <Table
          rowKey={(r) => r.label}
          loading={tableQuery.isLoading}
          dataSource={tableQuery.data || []}
          columns={[
            { title: t('auth.name'), dataIndex: 'label' },
            { title: 'Count', dataIndex: 'count' },
            {
              title: t('payment.amount', { defaultValue: 'Amount' }),
              dataIndex: 'amountTiyns',
              render: (v: number) => formatMoney(v || 0),
            },
          ]}
        />
      )}

      {report === 'paid-orders' && (
        <List
          loading={dashboardQuery.isLoading}
          locale={{ emptyText: t('app.empty') }}
          dataSource={dashboardQuery.data?.paidOrders || []}
          renderItem={(order) => (
            <List.Item>
              <List.Item.Meta
                title={`#${order.number ?? order._id.slice(-4)} · ${order.tableName || '—'} · ${order.waiterName || '—'}`}
                description={
                  order.paidAt
                    ? `${formatMoney(order.totalTiyns)} · ${formatDateTime(order.paidAt)}`
                    : formatMoney(order.totalTiyns)
                }
              />
            </List.Item>
          )}
        />
      )}

      {report === 'open-orders' && (
        <List
          loading={dashboardQuery.isLoading}
          locale={{ emptyText: t('app.empty') }}
          dataSource={dashboardQuery.data?.openOrders || []}
          renderItem={(order) => (
            <List.Item
              actions={[
                <button
                  key="open"
                  type="button"
                  onClick={() => navigate(waiterOrderPath(order._id, user?.role))}
                  style={{
                    background: '#1f6f5b',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    cursor: 'pointer',
                  }}
                >
                  {t('waiter.openOrder')}
                </button>,
              ]}
            >
              <List.Item.Meta
                title={`#${order.number ?? order._id.slice(-4)} · ${order.tableName || '—'}`}
                description={`${formatMoney(order.totalTiyns)} · ${t(`orderStatus.${order.status}`)}`}
              />
            </List.Item>
          )}
        />
      )}

      {report === 'shifts' && (
        <>
          <Table
            rowKey="_id"
            loading={shiftsQuery.isLoading}
            dataSource={shiftsQuery.data || []}
            pagination={{ pageSize: 10 }}
            onRow={(row) => ({
              onClick: () => setSelectedShift(row._id),
              style: {
                cursor: 'pointer',
                background: selectedShift === row._id ? 'rgba(47,109,181,0.12)' : undefined,
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
              },
              {
                title: t('cashier.openingCash'),
                dataIndex: 'openingCashTiyns',
                render: (v: number) => formatMoney(v || 0),
              },
            ]}
          />
          {selectedShift && shiftDetail.data && (
            <Descriptions bordered size="small" style={{ marginTop: 16 }} column={1}>
              <Descriptions.Item label={t('admin.reportPayments')}>
                {shiftDetail.data.paymentsCount} · {formatMoney(shiftDetail.data.paymentsTotalTiyns)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.ordersToday')}>
                {shiftDetail.data.ordersCount} ({t('orderStatus.PAID')}: {shiftDetail.data.paidOrders})
              </Descriptions.Item>
            </Descriptions>
          )}
          {!selectedShift && (
            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              {t('admin.selectShift')}
            </Text>
          )}
        </>
      )}
    </div>
  );
}
