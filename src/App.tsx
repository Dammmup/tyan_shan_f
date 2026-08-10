import type { ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import { AppRouter } from './routes';
import { appTheme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

function AntdLocaleShell({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? enUS : ruRU;
  return (
    <ConfigProvider theme={appTheme} locale={locale}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdLocaleShell>
        <AppRouter />
      </AntdLocaleShell>
    </QueryClientProvider>
  );
}
