import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';

type Props = {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Extra bottom space (e.g. staff bars) */
  padBottom?: boolean;
};

/** Shared chrome for admin content pages (not floor/POS). */
export function AdminPageFrame({ title, hint, actions, children, padBottom }: Props) {
  return (
    <div
      className="admin-page-frame"
      style={{
        padding: '16px 16px max(24px, env(safe-area-inset-bottom, 24px))',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        paddingBottom: padBottom
          ? 'calc(120px + env(safe-area-inset-bottom, 0px))'
          : undefined,
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title
              order={2}
              style={{
                margin: 0,
                fontFamily: 'Fraunces, serif',
                color: '#143d34',
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
              }}
            >
              {title}
            </Title>
            {hint ? (
              <Text size="sm" c="dimmed" mt={4}>
                {hint}
              </Text>
            ) : null}
          </div>
          {actions ? <Group gap="sm">{actions}</Group> : null}
        </Group>
        {children}
      </Stack>
    </div>
  );
}
