import type {
  AuditLogEntry,
  Category,
  DashboardStats,
  Discount,
  Employee,
  Hall,
  KitchenOrder,
  KitchenStatus,
  Order,
  PaymentMethod,
  PaymentSplit,
  Printer,
  Product,
  ProductAvailability,
  Role,
  Shift,
  Table,
} from '../types';
import { api } from './client';

export const hallsApi = {
  list: () => api.get<Hall[]>('/halls').then((r) => r.data),
  create: (body: Partial<Hall>) => api.post<Hall>('/halls', body).then((r) => r.data),
  update: (id: string, body: Partial<Hall>) =>
    api.patch<Hall>(`/halls/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.patch(`/halls/${id}`, { isActive: false }),
};

export const tablesApi = {
  list: (hallId?: string) =>
    api.get<Table[]>('/tables', { params: { hallId } }).then((r) => r.data),
  create: (body: Partial<Table>) => api.post<Table>('/tables', body).then((r) => r.data),
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
  createProduct: (body: Record<string, unknown>) =>
    api.post<Product>('/menu/products', body).then((r) => r.data),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    api.patch<Product>(`/menu/products/${id}`, body).then((r) => r.data),
  removeProduct: (id: string) => api.delete(`/menu/products/${id}`),
  setStopList: (id: string, availability: ProductAvailability) =>
    api.patch<Product>(`/menu/products/${id}/stop-list`, { availability }).then((r) => r.data),
};

export const ordersApi = {
  list: (params?: { status?: string; open?: boolean }) => {
    const query: Record<string, string | boolean | undefined> = {
      status: params?.status,
    };
    if (params?.open) {
      query.status = 'OPEN,IN_PROGRESS,READY,SERVED';
    }
    return api.get<Order[]>('/orders', { params: query }).then((r) => {
      if (!params?.open) return r.data;
      const openStatuses = new Set(['OPEN', 'IN_PROGRESS', 'READY', 'SERVED']);
      return r.data.filter((o) => openStatuses.has(o.status));
    });
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
    api.post<Order | { order: Order; items?: Order['items'] }>('/orders', body).then((r) => {
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
  list: () => api.get<Discount[]>('/discounts').then((r) => r.data),
  create: (body: Record<string, unknown>) =>
    api.post<Discount>('/discounts', body).then((r) => r.data),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<Discount>(`/discounts/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/discounts/${id}`),
};

export const reportsApi = {
  dashboard: () =>
    api.get<DashboardStats>('/reports/dashboard/today').then((r) => r.data),
  waiters: () =>
    api.get<Array<{ _id: string; orders: number; revenueTiyns: number }>>('/reports/by-waiters').then((r) =>
      r.data.map((row) => ({
        label: String(row._id || '—'),
        count: row.orders,
        amountTiyns: row.revenueTiyns,
      })),
    ),
  products: () =>
    api
      .get<Array<{ _id: { name?: string }; qty: number; revenueTiyns: number }>>(
        '/reports/by-products',
      )
      .then((r) =>
        r.data.map((row) => ({
          label: row._id?.name || '—',
          count: row.qty,
          amountTiyns: row.revenueTiyns,
        })),
      ),
  payments: () =>
    api
      .get<Array<{ _id: string; count: number; amountTiyns: number }>>(
        '/reports/by-payment-methods',
      )
      .then((r) =>
        r.data.map((row) => ({
          label: String(row._id || '—'),
          count: row.count,
          amountTiyns: row.amountTiyns,
        })),
      ),
};

export const auditApi = {
  list: (params?: { limit?: number }) =>
    api.get<AuditLogEntry[]>('/audit', { params }).then((r) => r.data),
};
