import type { AppRole } from '../types';
import { isAdminRole } from './roles';

/** Floor paths: admin keeps sidebar under /admin/*; staff uses top-level routes. */
export function waiterHome(role?: AppRole | null): string {
  return isAdminRole(role) ? '/admin/floor' : '/waiter';
}

export function waiterOrderPath(orderId: string, role?: AppRole | null): string {
  return isAdminRole(role)
    ? `/admin/floor/orders/${orderId}`
    : `/waiter/orders/${orderId}`;
}

export function cashierHome(role?: AppRole | null): string {
  return isAdminRole(role) ? '/admin/pos' : '/cashier';
}

export function kitchenHome(role?: AppRole | null): string {
  return isAdminRole(role) ? '/admin/kitchen-view' : '/kitchen';
}

export function isAdminEmbeddedFloor(pathname: string): boolean {
  return (
    pathname.startsWith('/admin/floor') ||
    pathname.startsWith('/admin/pos') ||
    pathname.startsWith('/admin/kitchen-view')
  );
}
