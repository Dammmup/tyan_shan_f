import type {
  AuditLogEntry,
  Category,
  DashboardStats,
  Discount,
  Employee,
  Hall,
  KitchenOrder,
  KitchenStatus,
  Modifier,
  ModifierGroup,
  Order,
  PaymentMethod,
  PaymentSplit,
  Printer,
  Product,
  ProductAvailability,
  Role,
  Restaurant,
  Shift,
  Table,
} from '../types';
import { api } from './client';
import { useAuthStore } from '../stores/authStore';

function withRestaurant<T extends Record<string, unknown>>(params?: T): T & { restaurantId?: string } {
  const rid =
    useAuthStore.getState().restaurantId ||
    useAuthStore.getState().user?.restaurantId ||
    undefined;
  return { ...(params || ({} as T)), ...(rid ? { restaurantId: rid } : {}) };
}

export const hallsApi = {
  list: () => api.get<Hall[]>('/halls', { params: withRestaurant() }).then((r) => r.data),
  create: (body: Partial<Hall>) =>
    api.post<Hall>('/halls', withRestaurant(body as Record<string, unknown>)).then((r) => r.data),
  update: (id: string, body: Partial<Hall>) =>
    api.patch<Hall>(`/halls/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.patch(`/halls/${id}`, { isActive: false }),
};

export const tablesApi = {
  list: (hallId?: string) =>
    api
      .get<Table[]>('/tables', { params: withRestaurant({ hallId }) })
      .then((r) => r.data),
  create: (body: Partial<Table>) =>
    api.post<Table>('/tables', withRestaurant(body as Record<string, unknown>)).then((r) => r.data),
  update: (id: string, body: Partial<Table>) =>
    api.patch<Table>(`/tables/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.patch(`/tables/${id}`, { isActive: false }),
};

export const menuApi = {
  categories: () => api.get<Category[]>('/menu/categories').then((r) => r.data),
  createCategory: (body: Partial<Category> & { name: string }) =>
    api.post<Category>('/menu/categories', body).then((r) => r.data),
  updateCategory: (id: string, body: Partial<Category>) =>
    api.patch<Category>(`/menu/categories/${id}`, body).then((r) => r.data),
  removeCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  products: (categoryId?: string) =>
    api.get<Product[]>('/menu/products', { params: { categoryId } }).then((r) => r.data),
  stock: () => api.get<Product[]>('/menu/stock').then((r) => r.data),
  adjustStock: (id: string, body: { delta: number; reason?: string }) =>
    api.patch<Product>(`/menu/products/${id}/stock`, body).then((r) => r.data),
  createProduct: (body: Record<string, unknown>) =>
    api.post<Product>('/menu/products', body).then((r) => r.data),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    api.patch<Product>(`/menu/products/${id}`, body).then((r) => r.data),
  removeProduct: (id: string) => api.delete(`/menu/products/${id}`),
  setStopList: (id: string, availability: ProductAvailability) =>
    api.patch<Product>(`/menu/products/${id}/stop-list`, { availability }).then((r) => r.data),
  modifierGroups: () =>
    api.get<ModifierGroup[]>('/menu/modifier-groups').then((r) => r.data),
  createModifierGroup: (body: {
    name: string;
    required?: boolean;
    minSelect?: number;
    maxSelect?: number;
  }) => api.post<ModifierGroup>('/menu/modifier-groups', body).then((r) => r.data),
  updateModifierGroup: (
    id: string,
    body: Partial<{
      name: string;
      required: boolean;
      minSelect: number;
      maxSelect: number;
      isActive: boolean;
    }>,
  ) => api.patch<ModifierGroup>(`/menu/modifier-groups/${id}`, body).then((r) => r.data),
  removeModifierGroup: (id: string) => api.delete(`/menu/modifier-groups/${id}`),
  modifiers: (groupId?: string) =>
    api.get<Modifier[]>('/menu/modifiers', { params: { groupId } }).then((r) => r.data),
  createModifier: (body: { name: string; groupId: string; priceTiyns: number }) =>
    api.post<Modifier>('/menu/modifiers', body).then((r) => r.data),
  updateModifier: (
    id: string,
    body: Partial<{ name: string; priceTiyns: number; isActive: boolean }>,
  ) => api.patch<Modifier>(`/menu/modifiers/${id}`, body).then((r) => r.data),
  removeModifier: (id: string) => api.delete(`/menu/modifiers/${id}`),
};

export const ordersApi = {
  list: (params?: { status?: string; open?: boolean }) => {
    const query: Record<string, string | boolean | undefined> = {
      status: params?.status,
    };
    if (params?.open) {
      query.status = 'OPEN,IN_PROGRESS,READY,SERVED';
    }
    return api.get<Order[]>('/orders', { params: withRestaurant(query) }).then((r) => {
      if (!params?.open) return r.data;
      const openStatuses = new Set(['OPEN', 'IN_PROGRESS', 'READY', 'SERVED']);
      return r.data.filter((o) => openStatuses.has(o.status));
    });
  },
  byTable: async (tableId: string) => {
    const raw = await api.get<Order | { order: Order; items: Order['items'] }>(
      `/orders/by-table/${tableId}`,
      { params: withRestaurant() },
    );
    const data = raw.data;
    if (data && typeof data === 'object' && 'order' in data) {
      return { ...data.order, items: data.items || [] };
    }
    return data as Order;
  },
  get: async (id: string) => {
    const raw = await api.get<Order | { order: Order; items: Order['items'] }>(`/orders/${id}`);
    const data = raw.data;
    if (data && typeof data === 'object' && 'order' in data) {
      return { ...data.order, items: data.items || [] };
    }
    return data as Order;
  },
  create: (body: { tableId: string; guests?: number }) =>
    api
      .post<Order | { order: Order; items?: Order['items'] }>(
        '/orders',
        withRestaurant(body as Record<string, unknown>),
      )
      .then((r) => {
        const data = r.data;
        if (data && typeof data === 'object' && 'order' in data) {
          return { ...data.order, items: data.items || [] };
        }
        return data as Order;
      }),
  addItem: (
    orderId: string,
    body: {
      productId: string;
      quantity: number;
      modifierIds?: string[];
      note?: string;
    },
  ) =>
    api.post<Order | { order: Order; items: Order['items'] }>(`/orders/${orderId}/items`, body).then(async () =>
      ordersApi.get(orderId),
    ),
  removeItem: (orderId: string, itemId: string) =>
    api.delete(`/orders/${orderId}/items/${itemId}`).then(async () => ordersApi.get(orderId)),
  cancel: (orderId: string) =>
    api.post(`/orders/${orderId}/cancel`).then(async () => ordersApi.get(orderId)),
  setPrepaid: (
    orderId: string,
    body: { amountTiyns: number; method?: 'CASH' | 'CARD'; note?: string },
  ) => api.post(`/orders/${orderId}/prepaid`, body).then(async () => ordersApi.get(orderId)),
  transfer: (orderId: string, body: { targetTableId: string; itemIds?: string[] }) =>
    api
      .post<{ source: Order; target: Order }>(`/orders/${orderId}/transfer`, body)
      .then((r) => r.data),
  sendSuborder: (orderId: string, itemIds?: string[]) =>
    api.post(`/orders/${orderId}/suborders`, { itemIds }).then(async () => ordersApi.get(orderId)),
  precheck: (orderId: string) =>
    api.post<{ ok: boolean; printJobId: string }>(`/orders/${orderId}/precheck`).then((r) => r.data),
};

export const kitchenApi = {
  list: (status?: KitchenStatus) =>
    api.get<KitchenOrder[]>('/kitchen', { params: { status } }).then((r) => r.data),
  accept: (id: string) => api.post<KitchenOrder>(`/kitchen/${id}/accept`).then((r) => r.data),
  cooking: (id: string) => api.post<KitchenOrder>(`/kitchen/${id}/cooking`).then((r) => r.data),
  ready: (id: string) => api.post<KitchenOrder>(`/kitchen/${id}/ready`).then((r) => r.data),
  served: (id: string) => api.post<KitchenOrder>(`/kitchen/${id}/served`).then((r) => r.data),
};

export const paymentsApi = {
  create: (body: {
    orderId: string;
    method: PaymentMethod;
    amountTiyns?: number;
    receivedCashTiyns?: number;
    splits?: PaymentSplit[];
  }) => {
    const amountTiyns =
      body.amountTiyns ??
      body.splits?.reduce((s, p) => s + p.amountTiyns, 0) ??
      0;
    return api
      .post('/payments', {
        orderId: body.orderId,
        method: body.method,
        amountTiyns,
        splits: body.splits,
      })
      .then((r) => r.data);
  },
};

export const shiftsApi = {
  current: () => api.get<Shift | null>('/shifts/current').then((r) => r.data),
  list: (limit = 20) =>
    api.get<Shift[]>('/shifts', { params: { limit } }).then((r) => r.data),
  open: (openingCashTiyns: number) =>
    api.post<Shift>('/shifts/open', { openingCashTiyns }).then((r) => r.data),
  close: async (closingCashTiyns: number) => {
    const current = await api.get<Shift | null>('/shifts/current').then((r) => r.data);
    if (!current?._id) throw new Error('No open shift');
    return api
      .post<Shift>(`/shifts/${current._id}/close`, { actualCashTiyns: closingCashTiyns })
      .then((r) => r.data);
  },
  cashIn: async (amountTiyns: number, comment?: string) => {
    const current = await api.get<Shift | null>('/shifts/current').then((r) => r.data);
    if (!current?._id) throw new Error('No open shift');
    return api
      .post(`/shifts/${current._id}/cash`, {
        type: 'CASH_IN',
        amountTiyns,
        reason: comment,
      })
      .then((r) => r.data);
  },
  cashOut: async (amountTiyns: number, comment?: string) => {
    const current = await api.get<Shift | null>('/shifts/current').then((r) => r.data);
    if (!current?._id) throw new Error('No open shift');
    return api
      .post(`/shifts/${current._id}/cash`, {
        type: 'CASH_OUT',
        amountTiyns,
        reason: comment,
      })
      .then((r) => r.data);
  },
};

export const usersApi = {
  list: () => api.get<Employee[]>('/users').then((r) => r.data),
  create: (body: Record<string, unknown>) =>
    api.post<Employee>('/users', body).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<Employee>(`/users/${id}`, body).then((r) => r.data),
  setPin: (id: string, pin: string) =>
    api.post(`/users/${id}/pin`, { pin }).then((r) => r.data),
  archive: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const rolesApi = {
  list: () => api.get<Role[]>('/roles').then((r) => r.data),
  create: (body: { name: string; permissions: string[] }) =>
    api.post<Role>('/roles', body).then((r) => r.data),
  update: (id: string, body: { name?: string; permissions?: string[] }) =>
    api.patch<Role>(`/roles/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/roles/${id}`),
};

export const restaurantsApi = {
  list: () => api.get<Restaurant[]>('/restaurants').then((r) => r.data),
  get: (id: string) => api.get<Restaurant>(`/restaurants/${id}`).then((r) => r.data),
  update: (
    id: string,
    body: Partial<Pick<Restaurant, 'name' | 'address' | 'timezone' | 'serviceChargePercent'>>,
  ) => api.patch<Restaurant>(`/restaurants/${id}`, body).then((r) => r.data),
};

export const printersApi = {
  list: () => api.get<Printer[]>('/printers').then((r) => r.data),
  create: (body: Partial<Printer>) =>
    api.post<Printer>('/printers', body).then((r) => r.data),
  update: (id: string, body: Partial<Printer>) =>
    api.patch<Printer>(`/printers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/printers/${id}`),
};

export const discountsApi = {
  list: () =>
    api.get<Discount[]>('/discounts', { params: withRestaurant() }).then((r) => r.data),
  create: (body: Record<string, unknown>) =>
    api.post<Discount>('/discounts', withRestaurant(body)).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<Discount>(`/discounts/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/discounts/${id}`),
  apply: (orderId: string, discountId: string) =>
    api
      .post(`/discounts/orders/${orderId}/apply`, { discountId })
      .then((r) => r.data),
};

export const reportsApi = {
  dashboard: (date?: string) =>
    api
      .get<DashboardStats>('/reports/dashboard/today', {
        params: withRestaurant(date ? { date } : {}),
      })
      .then((r) => r.data),
  waiters: (date?: string) =>
    api
      .get<Array<{ _id: string; orders: number; revenueTiyns: number }>>('/reports/by-waiters', {
        params: withRestaurant(date ? { date } : {}),
      })
      .then((r) =>
        r.data.map((row) => ({
          label: String(row._id || '—'),
          count: row.orders,
          amountTiyns: row.revenueTiyns,
        })),
      ),
  products: (date?: string) =>
    api
      .get<Array<{ _id: { name?: string }; qty: number; revenueTiyns: number }>>(
        '/reports/by-products',
        { params: withRestaurant(date ? { date } : {}) },
      )
      .then((r) =>
        r.data.map((row) => ({
          label: row._id?.name || '—',
          count: row.qty,
          amountTiyns: row.revenueTiyns,
        })),
      ),
  payments: (date?: string) =>
    api
      .get<Array<{ _id: string; count: number; amountTiyns: number }>>(
        '/reports/by-payment-methods',
        { params: withRestaurant(date ? { date } : {}) },
      )
      .then((r) =>
        r.data.map((row) => ({
          label: String(row._id || '—'),
          count: row.count,
          amountTiyns: row.amountTiyns,
        })),
      ),
  shift: (id: string) =>
    api
      .get<{
        shift: Shift;
        paymentsCount: number;
        paymentsTotalTiyns: number;
        ordersCount: number;
        paidOrders: number;
        cancelledOrders?: number;
        byMethod?: Record<string, { count: number; amountTiyns: number }>;
      } | null>(`/reports/shifts/${id}`, { params: withRestaurant() })
      .then((r) => r.data),
};

export const auditApi = {
  list: (params?: { limit?: number }) =>
    api.get<AuditLogEntry[]>('/audit', { params }).then((r) => r.data),
};
