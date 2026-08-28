/** Nested admin hub menus (r_k-style). Leaf nodes navigate to path or report view. */

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
  | 'pos-close'
  | 'pos-cash-in'
  | 'pos-cash-out'
  | 'kitchen';

export type HubMenuItem = {
  id: string;
  labelKey: string;
  /** Nested menu id under /admin/hub/:menuId */
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
      { id: 'balance', labelKey: 'hub.repBalance', menu: 'cash-balance' },
      { id: 'revenue', labelKey: 'hub.repRevenue', menu: 'cash-revenue' },
      { id: 'expense', labelKey: 'hub.repExpense', menu: 'cash-expense' },
      { id: 'special', labelKey: 'hub.repSpecial', menu: 'cash-special' },
      { id: 'fiscal', labelKey: 'hub.repFiscal', menu: 'cash-fiscal' },
      { id: 'close', labelKey: 'hub.closeBracket', action: { type: 'close' } },
    ],
  },
  'cash-balance': {
    id: 'cash-balance',
    titleKey: 'hub.cashReportsTitle',
    parentId: 'cash-reports',
    items: [
      {
        id: 'intention',
        labelKey: 'hub.balanceIntention',
        action: { type: 'report', report: 'paid-orders' },
      },
      {
        id: 'cash-balance-report',
        labelKey: 'hub.balanceCash',
        action: { type: 'report', report: 'shifts' },
      },
      {
        id: 'system-balance',
        labelKey: 'hub.balanceSystem',
        action: { type: 'report', report: 'dashboard' },
      },
    ],
  },
  'cash-revenue': {
    id: 'cash-revenue',
    titleKey: 'hub.cashReportsTitle',
    parentId: 'cash-reports',
    items: [
      {
        id: 'waiter-balance',
        labelKey: 'hub.revWaiterBalance',
        action: { type: 'report', report: 'waiters' },
      },
      {
        id: 'expeditors',
        labelKey: 'hub.revExpeditors',
        action: { type: 'report', report: 'waiters' },
      },
      {
        id: 'total-rev',
        labelKey: 'hub.revTotal',
        action: { type: 'report', report: 'dashboard' },
      },
      {
        id: 'by-cashiers',
        labelKey: 'hub.revByCashiers',
        action: { type: 'report', report: 'payments' },
      },
      {
        id: 'by-waiters',
        labelKey: 'hub.revByWaiters',
        action: { type: 'report', report: 'waiters' },
      },
      {
        id: 'by-depts',
        labelKey: 'hub.revByDepts',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'by-stations',
        labelKey: 'hub.revByStations',
        action: { type: 'report', report: 'products' },
      },
    ],
  },
  'cash-expense': {
    id: 'cash-expense',
    titleKey: 'hub.cashReportsTitle',
    parentId: 'cash-reports',
    items: [
      {
        id: 'running-out',
        labelKey: 'hub.expRunningOut',
        action: { type: 'report', report: 'stop-list' },
      },
      {
        id: 'forbidden',
        labelKey: 'hub.expForbidden',
        action: { type: 'report', report: 'hidden-dishes' },
      },
      {
        id: 'dish-usage',
        labelKey: 'hub.expDishUsage',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'combo-usage',
        labelKey: 'hub.expComboUsage',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'stock',
        labelKey: 'hub.expStock',
        action: { type: 'report', report: 'menu' },
      },
      {
        id: 'goods-in',
        labelKey: 'hub.expGoodsIn',
        action: { type: 'report', report: 'audit' },
      },
      {
        id: 'by-cat',
        labelKey: 'hub.expByCategory',
        action: { type: 'report', report: 'products' },
      },
      {
        id: 'mod-stop',
        labelKey: 'hub.expModStop',
        action: { type: 'report', report: 'stop-list' },
      },
    ],
  },
  'cash-special': {
    id: 'cash-special',
    titleKey: 'hub.cashReportsTitle',
    parentId: 'cash-reports',
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
        id: 'audit',
        labelKey: 'hub.specAudit',
        action: { type: 'report', report: 'audit' },
      },
      {
        id: 'discounts',
        labelKey: 'hub.specDiscounts',
        action: { type: 'path', to: '/admin/discounts' },
      },
    ],
  },
  'cash-fiscal': {
    id: 'cash-fiscal',
    titleKey: 'hub.cashReportsTitle',
    parentId: 'cash-reports',
    items: [
      {
        id: 'printers',
        labelKey: 'hub.fiscalPrinters',
        action: { type: 'report', report: 'printers' },
      },
      {
        id: 'shift',
        labelKey: 'hub.fiscalShift',
        action: { type: 'report', report: 'shifts' },
      },
      {
        id: 'payments',
        labelKey: 'hub.fiscalPayments',
        action: { type: 'report', report: 'payments' },
      },
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
    'pos-close': '/admin/pos?action=close',
    'pos-cash-in': '/admin/pos?action=cash-in',
    'pos-cash-out': '/admin/pos?action=cash-out',
    kitchen: '/admin/kitchen-view',
  };
  return map[action.report];
}
