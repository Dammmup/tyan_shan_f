import { useQuery } from '@tanstack/react-query';
import { Card, Loader, Table, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { AdminPageFrame } from '../../components/AdminPageFrame';
import { auditApi } from '../../api/endpoints';

export function AuditPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list({ limit: 100 }),
  });

  return (
    <AdminPageFrame title={t('admin.audit')}>
      <Card padding={0} radius="md" withBorder bg="#faf7f1">
        <Table.ScrollContainer minWidth={320}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Time</Table.Th>
                <Table.Th>User</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Entity</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Loader size="sm" color="teal" />
                  </Table.Td>
                </Table.Tr>
              ) : (data || []).length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed">{t('app.empty')}</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                (data || []).map((row) => (
                  <Table.Tr key={row._id}>
                    <Table.Td>{dayjs(row.createdAt).format('DD.MM.YYYY HH:mm')}</Table.Td>
                    <Table.Td>{row.userName || '—'}</Table.Td>
                    <Table.Td>{row.action}</Table.Td>
                    <Table.Td>
                      {row.entity || '—'}
                      {row.entityId ? ` · ${String(row.entityId).slice(-6)}` : ''}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </AdminPageFrame>
  );
}
