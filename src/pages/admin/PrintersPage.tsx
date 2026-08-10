import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { printersApi } from '../../api/endpoints';

const { Title } = Typography;

export function PrintersPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['printers'], queryFn: printersApi.list });

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.printers')}
      </Title>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={data || []}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'IP', dataIndex: 'ip' },
          { title: 'Port', dataIndex: 'port' },
          { title: 'Center', dataIndex: 'productionCenter' },
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
