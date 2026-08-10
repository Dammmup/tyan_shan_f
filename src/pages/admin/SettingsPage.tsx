import { Radio, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n';

const { Title, Paragraph } = Typography;

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <Title level={3} style={{ fontFamily: 'Fraunces, serif', marginTop: 0 }}>
        {t('admin.settings')}
      </Title>
      <Paragraph>{t('admin.languageHint')}</Paragraph>
      <Radio.Group
        value={i18n.language}
        onChange={(e) => setAppLanguage(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="large"
        options={[
          { value: 'ru', label: 'Русский' },
          { value: 'kk', label: 'Қазақша' },
          { value: 'en', label: 'English' },
        ]}
      />
    </div>
  );
}
