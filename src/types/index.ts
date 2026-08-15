export type UserStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'DISABLED';
export type OrderStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'CANCELLED';
export type OrderItemStatus =
  | 'NEW'
  | 'SENT'
  | 'COOKING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED';
export type KitchenStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'COOKING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED';
export type ProductionCenter =
  | 'COLD'
  | 'KITCHEN'
  | 'BAR'
  | 'GRILL'
  | 'DESSERT'
  | 'OTHER';
export type PaymentMethod = 'CASH' | 'CARD' | 'SPLIT';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type DiscountType = 'PERCENT' | 'FIXED';
export type ProductAvailability = 'AVAILABLE' | 'STOPPED' | 'HIDDEN';

export type AppRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAITER'
  | 'SENIOR_WAITER'
  | 'KITCHEN'
  | 'BAR'
  | string;

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: AppRole;
  roleId?: string;
  organizationId: string;
  restaurantId: string | null;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface Hall {
  _id: string;
  name: string;
  restaurantId: string;
  sortOrder?: number;
}

export interface Table {
  _id: string;
  name: string;
  hallId: string;
  restaurantId: string;
  status: TableStatus;
  seats?: number;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  currentOrderId?: string | null;
}

export interface Category {
  _id: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface Modifier {
  _id: string;
  name: string;
  groupId?: string;
  priceTiyns: number;
  isActive?: boolean;
}

export interface ModifierGroup {
  _id: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  required?: boolean;
  modifiers: Modifier[];
}

export interface Employee {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  roleId: string;
  roleName?: string;
  status: UserStatus;
  restaurantId?: string | null;
  hasPin?: boolean;
  /** Visible to owner/admin only. */
  pinCode?: string | null;
}

export interface Product {
  _id: string;
  name: string;
  categoryId: string;
  basePriceTiyns?: number;
  priceTiyns: number;
  availability: ProductAvailability;
  productionCenter: ProductionCenter;
  description?: string;
  isActive?: boolean;
  modifierGroupIds?: string[];
  modifierGroups?: ModifierGroup[];
}

export interface OrderItemModifier {
  modifierId: string;
  name?: string;
  nameSnapshot?: string;
  priceTiyns?: number;
  priceSnapshot?: number;
}

export interface OrderItem {
  _id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  status: OrderItemStatus;
  productionCenter?: ProductionCenter;
  modifiers?: OrderItemModifier[];
  /** Line total in tiyns (API field). */
  lineTotalTiyns?: number;
  /** Legacy alias — prefer lineTotalTiyns. */
  totalTiyns?: number;
  note?: string;
}

export interface Order {
  _id: string;
  number?: number | string;
  tableId: string;
  tableName?: string;
  hallId?: string;
  waiterId?: string;
  waiterName?: string;
  status: OrderStatus;
  guests?: number;
  items: OrderItem[];
  subtotalTiyns: number;
  discountTiyns?: number;
  serviceChargeTiyns?: number;
  totalTiyns: number;
  prepaidTiyns?: number;
  prepaidMethod?: 'CASH' | 'CARD' | null;
  prepaidNote?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
  precheckPrintedAt?: string | null;
}

export interface DashboardOrderSummary {
  _id: string;
  status: OrderStatus;
  totalTiyns: number;
  prepaidTiyns?: number;
  guests?: number;
  tableId: string;
  tableName?: string;
  waiterId?: string;
  waiterName?: string;
  createdAt?: string;
  paidAt?: string | null;
  number?: string;
}

export interface KitchenOrderItem {
  name: string;
  quantity: number;
  modifiers?: Array<string | { name?: string }>;
  note?: string;
}

export interface KitchenOrder {
  _id: string;
  orderId: string;
  orderNumber?: number | string;
  tableName?: string;
  status: KitchenStatus;
  productionCenter: ProductionCenter;
  items: KitchenOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSplit {
  method: 'CASH' | 'CARD';
  amountTiyns: number;
}

export interface Shift {
  _id: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  openingCashTiyns: number;
  closingCashTiyns?: number;
  expectedCashTiyns?: number;
  discrepancyTiyns?: number;
  openedByName?: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface Restaurant {
  _id: string;
  name: string;
  address?: string;
  timezone?: string;
  serviceChargePercent?: number;
  isActive?: boolean;
}

export interface Printer {
  _id: string;
  name: string;
  ip: string;
  port: number;
  productionCenter?: ProductionCenter;
  isActive?: boolean;
}

export interface Discount {
  _id: string;
  name: string;
  type: DiscountType;
  value: number;
  isActive?: boolean;
  maxPercent?: number;
  maxPercentAllowed?: number;
}

export interface DashboardStats {
  revenueTodayTiyns: number;
  ordersCount: number;
  avgCheckTiyns: number;
  guestsCount: number;
  ordersOpen?: number;
  ordersPaid?: number;
  paidOrders?: DashboardOrderSummary[];
  openOrders?: DashboardOrderSummary[];
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  entity?: string;
  entityId?: string;
  userName?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface ReportRow {
  label: string;
  count?: number;
  amountTiyns: number;
}
