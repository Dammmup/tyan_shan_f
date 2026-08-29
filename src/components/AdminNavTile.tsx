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
    minHeight: 64,
    width: '100%',
    padding: '14px 12px',
    border: 'none',
    borderRadius: 8,
    background: color,
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    lineHeight: 1.25,
    textAlign: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
  };
}
