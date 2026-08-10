import type { ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AppRouter } from './routes';
import { appTheme } from './theme';
import { mantineTheme } from './theme/mantine';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

function Providers({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? enUS : ruRU;
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications position="top-right" zIndex={4000} />
        <ConfigProvider theme={appTheme} locale={locale}>
          <AntApp>{children}</AntApp>
        </ConfigProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Providers>
        <AppRouter />
      </Providers>
    </QueryClientProvider>
  );
}
