import type { AppRole } from '../types';

export function getHomePath(role: AppRole | undefined | null): string {
  switch (role) {
    case 'WAITER':
      return '/waiter';
    case 'KITCHEN':
    case 'BAR':
      return '/kitchen';
    case 'CASHIER':
      return '/cashier';
    case 'OWNER':
    case 'ADMIN':
    case 'MANAGER':
      return '/admin';
    default:
      return '/login';
  }
}

export function isAdminRole(role: AppRole | undefined | null): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';
}

export const TABLE_STATUS_COLORS: Record<string, string> = {
  FREE: '#2f6f5e',
  OCCUPIED: '#c45c26',
  RESERVED: '#b0893e',
  DISABLED: '#8a8175',
};
