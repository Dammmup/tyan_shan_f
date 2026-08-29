/** Nested admin hub menus. Leaf nodes navigate to real screens only. */

export type HubLeafAction =
  | { type: 'path'; to: string }
  | { type: 'report'; report: HubReportId }
  | { type: 'close' };

export type HubReportId =
  | 'dashboard'
  | 'waiters'
  | 'products'
  | 'payments'
  | 'shifts'
  | 'paid-orders'
  | 'open-orders'
  | 'stop-list'
  | 'hidden-dishes'
  | 'menu'
  | 'audit'
  | 'printers'
  | 'employees'
  | 'halls'
  | 'discounts'
  | 'roles'
  | 'floor'
  | 'pos'
  | 'pos-paid'
  | 'stock'
  | 'kitchen';

export type HubMenuItem = {
  id: string;
  labelKey: string;
  menu?: string;
  action?: HubLeafAction;
};

export type HubMenu = {
  id: string;
  titleKey: string;
  parentId?: string;
  items: HubMenuItem[];
};

export const HUB_MENUS: Record<string, HubMenu> = {
  'cash-reports': {
    id: 'cash-reports',
    titleKey: 'hub.cashReportsTitle',
    items: [
      {
        id: 'open-orders',
        labelKey: 'hub.specOpenOrders',
        action: { type: 'report', report: 'open-orders' },
      },
      {
        id: 'paid-orders',
        labelKey: 'hub.specPaidOrders',
        action: { type: 'report', report: 'paid-orders' },
      },
      {
        id: 'by-waiters',
        labelKey: 'admin.reportWaiters',
        action: { type: 'report', report: 'waiters' },
      },
      {
        id: 'by-products',
        labelKey: 'admin.reportProducts',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'by-payments',
        labelKey: 'admin.reportPayments',
        action: { type: 'report', report: 'payments' },
      },
      {
        id: 'by-shifts',
        labelKey: 'admin.reportShifts',
        action: { type: 'report', report: 'shifts' },
      },
      {
        id: 'total-rev',
        labelKey: 'hub.revTotal',
        action: { type: 'report', report: 'dashboard' },
      },
      {
        id: 'discounts',
        labelKey: 'hub.specDiscounts',
        action: { type: 'path', to: '/admin/discounts' },
      },
      {
        id: 'stock',
        labelKey: 'hub.expStock',
        action: { type: 'path', to: '/admin/stock' },
      },
      {
        id: 'stop-list',
        labelKey: 'hub.expRunningOut',
        action: { type: 'report', report: 'stop-list' },
      },
      {
        id: 'audit',
        labelKey: 'hub.specAudit',
        action: { type: 'path', to: '/admin/audit' },
      },
      {
        id: 'printer',
        labelKey: 'admin.printers',
        action: { type: 'path', to: '/admin/printers' },
      },
      { id: 'close', labelKey: 'hub.closeBracket', action: { type: 'close' } },
    ],
  },
  'view-reports': {
    id: 'view-reports',
    titleKey: 'hub.viewReportsTitle',
    items: [
      {
        id: 'waiters',
        labelKey: 'admin.reportWaiters',
        action: { type: 'report', report: 'waiters' },
      },
      {
        id: 'products',
        labelKey: 'admin.reportProducts',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'payments',
        labelKey: 'admin.reportPayments',
        action: { type: 'report', report: 'payments' },
      },
      {
        id: 'shifts',
        labelKey: 'admin.reportShifts',
        action: { type: 'report', report: 'shifts' },
      },
      {
        id: 'dashboard',
        labelKey: 'hub.revTotal',
        action: { type: 'report', report: 'dashboard' },
      },
      {
        id: 'paid-orders',
        labelKey: 'hub.closedOrders',
        action: { type: 'report', report: 'paid-orders' },
      },
      {
        id: 'open-orders',
        labelKey: 'admin.openTables',
        action: { type: 'report', report: 'open-orders' },
      },
      { id: 'close', labelKey: 'hub.closeBracket', action: { type: 'close' } },
    ],
  },
  order: {
    id: 'order',
    titleKey: 'hub.groupOrder',
    items: [
      {
        id: 'create',
        labelKey: 'hub.createOrder',
        action: { type: 'path', to: '/admin/floor' },
      },
      {
        id: 'edit',
        labelKey: 'hub.editOrder',
        action: { type: 'report', report: 'open-orders' },
      },
      {
        id: 'quick',
        labelKey: 'hub.quickCheck',
        action: { type: 'path', to: '/admin/pos' },
      },
    ],
  },
  shift: {
    id: 'shift',
    titleKey: 'hub.groupShift',
    items: [
      { id: 'cash-reports', labelKey: 'hub.cashReports', menu: 'cash-reports' },
      { id: 'view-reports', labelKey: 'hub.viewReports', menu: 'view-reports' },
    ],
  },
  staff: {
    id: 'staff',
    titleKey: 'hub.groupStaff',
    items: [
      {
        id: 'register',
        labelKey: 'hub.staffRegister',
        action: { type: 'path', to: '/admin/employees' },
      },
      {
        id: 'time',
        labelKey: 'hub.timeTracking',
        action: { type: 'path', to: '/admin/audit' },
      },
    ],
  },
  ops: {
    id: 'ops',
    titleKey: 'hub.groupOps',
    items: [
      {
        id: 'closed-checks',
        labelKey: 'hub.closedChecks',
        action: { type: 'path', to: '/admin/pos?tab=paid' },
      },
      {
        id: 'closed-orders',
        labelKey: 'hub.closedOrders',
        action: { type: 'report', report: 'paid-orders' },
      },
      {
        id: 'stock',
        labelKey: 'hub.expStock',
        action: { type: 'path', to: '/admin/stock' },
      },
    ],
  },
};

export function resolveHubAction(action: HubLeafAction): string {
  if (action.type === 'close') return '/admin';
  if (action.type === 'path') return action.to;
  const map: Record<HubReportId, string> = {
    dashboard: '/admin/reports/view/dashboard',
    waiters: '/admin/reports/view/waiters',
    products: '/admin/reports/view/products',
    payments: '/admin/reports/view/payments',
    shifts: '/admin/reports/view/shifts',
    'paid-orders': '/admin/reports/view/paid-orders',
    'open-orders': '/admin/reports/view/open-orders',
    'stop-list': '/admin/menu?filter=STOPPED',
    'hidden-dishes': '/admin/menu?filter=HIDDEN',
    menu: '/admin/menu',
    audit: '/admin/audit',
    printers: '/admin/printers',
    employees: '/admin/employees',
    halls: '/admin/halls',
    discounts: '/admin/discounts',
    roles: '/admin/roles',
    floor: '/admin/floor',
    pos: '/admin/pos',
    'pos-paid': '/admin/pos?tab=paid',
    stock: '/admin/stock',
    kitchen: '/admin/kitchen-view',
  };
  return map[action.report];
}
