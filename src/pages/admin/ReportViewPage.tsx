import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { reportsApi, shiftsApi } from '../../api/endpoints';
import { formatMoney } from '../../utils/money';
import { formatDateTime } from '../../utils/time';
import { waiterOrderPath } from '../../utils/paths';
import { useAuthStore } from '../../stores/authStore';
import type { HubReportId } from '../../hub/hubConfig';

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
  const showDate =
    report === 'dashboard' ||
    report === 'waiters' ||
    report === 'products' ||
    report === 'payments' ||
    report === 'paid-orders' ||
    report === 'open-orders';

  return (
    <AdminPageFrame
      title={title}
      actions={
        showDate ? (
          <DatePicker
            value={day}
            onChange={(v) => v && setDay(v)}
            allowClear={false}
            format="DD.MM.YYYY"
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            size="large"
            style={{ width: 160 }}
          />
        ) : undefined
      }
    >
      {report === 'dashboard' &&
        (dashboardQuery.isLoading ? (
          <Loader color="teal" />
        ) : (
          <Stack gap="sm">
            {[
              [t('admin.revenueToday'), formatMoney(dashboardQuery.data?.revenueTodayTiyns || 0)],
              [t('admin.ordersToday'), String(dashboardQuery.data?.ordersCount || 0)],
              [t('admin.avgCheck'), formatMoney(dashboardQuery.data?.avgCheckTiyns || 0)],
              [t('admin.guestsToday'), String(dashboardQuery.data?.guestsCount || 0)],
            ].map(([label, value]) => (
              <Card key={label} padding="md" radius="md" withBorder bg="#faf7f1">
                <Text size="sm" c="dimmed">
                  {label}
                </Text>
                <Title order={3} mt={4} style={{ fontFamily: 'Fraunces, serif', color: '#143d34' }}>
                  {value}
                </Title>
              </Card>
            ))}
          </Stack>
        ))}

      {(report === 'waiters' || report === 'products' || report === 'payments') && (
        <Card padding={0} radius="md" withBorder bg="#faf7f1">
          <Table.ScrollContainer minWidth={320}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('auth.name')}</Table.Th>
                  <Table.Th>Count</Table.Th>
                  <Table.Th>{t('payment.amount')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tableQuery.isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Loader size="sm" color="teal" />
                    </Table.Td>
                  </Table.Tr>
                ) : (tableQuery.data || []).length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text c="dimmed">{t('app.empty')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  (tableQuery.data || []).map((row) => (
                    <Table.Tr key={row.label}>
                      <Table.Td>{row.label}</Table.Td>
                      <Table.Td>{row.count ?? '—'}</Table.Td>
                      <Table.Td>{formatMoney(row.amountTiyns || 0)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}

      {report === 'paid-orders' && (
        <Stack gap="sm">
          {dashboardQuery.isLoading ? (
            <Loader color="teal" />
          ) : (dashboardQuery.data?.paidOrders || []).length === 0 ? (
            <Text c="dimmed">{t('app.empty')}</Text>
          ) : (
            (dashboardQuery.data?.paidOrders || []).map((order) => (
              <Card key={order._id} padding="md" radius="md" withBorder bg="#faf7f1">
                <Text fw={700}>
                  #{order.number ?? order._id.slice(-4)} · {order.tableName || '—'}
                </Text>
                <Text size="sm" c="dimmed">
                  {order.waiterName || '—'}
                  {order.paidAt ? ` · ${formatDateTime(order.paidAt)}` : ''}
                </Text>
                <Text fw={600} mt={6} c="#1f6f5b">
                  {formatMoney(order.totalTiyns)}
                </Text>
              </Card>
            ))
          )}
        </Stack>
      )}

      {report === 'open-orders' && (
        <Stack gap="sm">
          {dashboardQuery.isLoading ? (
            <Loader color="teal" />
          ) : (dashboardQuery.data?.openOrders || []).length === 0 ? (
            <Text c="dimmed">{t('app.empty')}</Text>
          ) : (
            (dashboardQuery.data?.openOrders || []).map((order) => (
              <Card
                key={order._id}
                padding="md"
                radius="md"
                withBorder
                bg="#faf7f1"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(waiterOrderPath(order._id, user?.role))}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <div style={{ minWidth: 0 }}>
                    <Text fw={700}>
                      #{order.number ?? order._id.slice(-4)} · {order.tableName || '—'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t(`orderStatus.${order.status}`)} · {formatMoney(order.totalTiyns)}
                    </Text>
                  </div>
                  <Button
                    size="sm"
                    color="teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(waiterOrderPath(order._id, user?.role));
                    }}
                  >
                    {t('waiter.openOrder')}
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      )}

      {report === 'shifts' && (
        <Stack gap="md">
          <Card padding={0} radius="md" withBorder bg="#faf7f1">
            <Table.ScrollContainer minWidth={320}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('admin.openedAt')}</Table.Th>
                    <Table.Th>{t('admin.status')}</Table.Th>
                    <Table.Th>{t('cashier.openingCash')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(shiftsQuery.data || []).map((row) => (
                    <Table.Tr
                      key={row._id}
                      style={{
                        cursor: 'pointer',
                        background:
                          selectedShift === row._id ? 'rgba(31,111,91,0.1)' : undefined,
                      }}
                      onClick={() => setSelectedShift(row._id)}
                    >
                      <Table.Td>{formatDateTime(row.openedAt)}</Table.Td>
                      <Table.Td>{row.status}</Table.Td>
                      <Table.Td>{formatMoney(row.openingCashTiyns || 0)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
          {selectedShift && shiftDetail.data ? (
            <Card padding="md" radius="md" withBorder bg="#faf7f1">
              <Text>
                {t('admin.reportPayments')}: {shiftDetail.data.paymentsCount} ·{' '}
                {formatMoney(shiftDetail.data.paymentsTotalTiyns)}
              </Text>
              <Text mt={6}>
                {t('admin.ordersToday')}: {shiftDetail.data.ordersCount} (
                {t('orderStatus.PAID')}: {shiftDetail.data.paidOrders})
              </Text>
            </Card>
          ) : (
            <Text c="dimmed">{t('admin.selectShift')}</Text>
          )}
        </Stack>
      )}
    </AdminPageFrame>
  );
}
