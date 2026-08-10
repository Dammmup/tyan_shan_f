import { useQuery } from '@tanstack/react-query';
import { Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { auditApi } from '../../api/endpoints';

const { Title } = Typography;

export function AuditPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list({ limit: 100 }),
  });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.audit')}
      </Title>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={data || []}
        columns={[
          {
            title: 'Time',
            dataIndex: 'createdAt',
            render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm:ss'),
          },
          { title: 'User', dataIndex: 'userName' },
          { title: 'Action', dataIndex: 'action' },
          { title: 'Entity', dataIndex: 'entity' },
          { title: 'ID', dataIndex: 'entityId' },
        ]}
      />
    </div>
  );
}
