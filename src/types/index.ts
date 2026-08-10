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
export type ProductionCenter = 'KITCHEN' | 'BAR' | 'GRILL' | 'DESSERT' | 'OTHER';
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
  priceTiyns: number;
  isActive?: boolean;
}

export interface ModifierGroup {
  _id: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  modifiers: Modifier[];
}

export interface Product {
  _id: string;
  name: string;
  categoryId: string;
  priceTiyns: number;
  availability: ProductAvailability;
  productionCenter: ProductionCenter;
  description?: string;
  modifierGroups?: ModifierGroup[];
}

export interface OrderItemModifier {
  modifierId: string;
  name: string;
  priceTiyns: number;
}

export interface OrderItem {
  _id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  status: OrderItemStatus;
  modifiers?: OrderItemModifier[];
  totalTiyns: number;
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
  totalTiyns: number;
  createdAt?: string;
  updatedAt?: string;
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

export interface Employee {
  _id: string;
  name: string;
  email?: string;
  roleId: string;
  roleName?: string;
  status: UserStatus;
  restaurantId?: string | null;
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
}

export interface DashboardStats {
  revenueTodayTiyns: number;
  ordersCount: number;
  avgCheckTiyns: number;
  guestsCount: number;
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
