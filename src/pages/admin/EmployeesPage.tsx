import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/endpoints';

const { Title } = Typography;

export function EmployeesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.employees')}
      </Title>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={data || []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          {
            title: t('admin.roles'),
            dataIndex: 'roleName',
            render: (v: string) => v || '—',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag>,
          },
        ]}
      />
    </div>
  );
}
