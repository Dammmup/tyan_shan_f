import type { CSSProperties, ReactNode } from 'react';
import { SimpleGrid } from '@mantine/core';

/** Shared tile look for hub / submenu pages. */
export function AdminNavTile({
  label,
  color = '#1f6f5b',
  onClick,
}: {
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={tileStyle(color)}>
      {label}
    </button>
  );
}

export function AdminNavTileGrid({ children }: { children: ReactNode }) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={10}>
      {children}
    </SimpleGrid>
  );
}

function tileStyle(color: string): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    width: '100%',
    padding: '16px 14px',
    border: '1px solid rgba(20,61,52,0.18)',
    borderRadius: 10,
    background: color,
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 650,
    fontSize: 15,
    letterSpacing: 0.2,
    lineHeight: 1.25,
    textAlign: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxShadow: '0 1px 0 rgba(20,61,52,0.12)',
  };
}
