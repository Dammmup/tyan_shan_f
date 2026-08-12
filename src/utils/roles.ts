import type { AppRole, AuthUser, OrderItem } from '../types';

export function getHomePath(role: AppRole | undefined | null): string {
  switch (role) {
    case 'WAITER':
    case 'SENIOR_WAITER':
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

/** Owner/admin/manager/senior — can cancel after punch and apply discounts. */
export function isElevatedFloor(role: AppRole | undefined | null): boolean {
  return (
    role === 'OWNER' ||
    role === 'ADMIN' ||
    role === 'MANAGER' ||
    role === 'SENIOR_WAITER'
  );
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  return (user.permissions || []).includes(permission);
}

export function canApplyDiscount(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'ORDER_DISCOUNT') || isElevatedFloor(user?.role);
}

/** Waiter can remove only NEW (not yet sent) items. */
export function canCancelOrderItem(
  user: AuthUser | null | undefined,
  item: Pick<OrderItem, 'status'>,
): boolean {
  if (!user) return false;
  if (item.status === 'SERVED' || item.status === 'CANCELLED') return false;
  if (item.status === 'NEW') return true;
  return isElevatedFloor(user.role);
}

export function canCancelWholeOrder(
  user: AuthUser | null | undefined,
  items: Array<Pick<OrderItem, 'status'>>,
): boolean {
  if (!user) return false;
  if (isElevatedFloor(user.role) || isAdminRole(user.role)) return true;
  return items.every((i) => i.status === 'NEW' || i.status === 'CANCELLED');
}

export const TABLE_STATUS_COLORS: Record<string, string> = {
  FREE: '#2f6f5e',
  OCCUPIED: '#c45c26',
  RESERVED: '#b0893e',
  DISABLED: '#8a8175',
};
