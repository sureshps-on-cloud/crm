export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface IOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface IOrder {
  _id?: string;
  accountId: string;
  orderDate: Date;
  status: OrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  assignedTo?: string;
  orderEntitlementIds: string[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderCreate {
  accountId: string;
  orderDate?: Date;
  status?: OrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  assignedTo?: string;
  orderEntitlementIds?: string[];
  createdBy: string;
}

export interface IOrderUpdate {
  accountId?: string;
  orderDate?: Date;
  status?: OrderStatus;
  items?: IOrderItem[];
  totalAmount?: number;
  assignedTo?: string;
  orderEntitlementIds?: string[];
}

export interface IOrderQuery {
  accountId?: string;
  orderDate?: string | Date;
  status?: OrderStatus | string;
  assignedTo?: string;
  orderEntitlementIds?: string | string[];
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Date range filters
  orderDateAfter?: string | Date;
  orderDateBefore?: string | Date;
  totalAmountMin?: number;
  totalAmountMax?: number;
  // Product filters
  productId?: string;
  productName?: string;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IOrderResponse {
  _id: string;
  accountId: string;
  orderDate: Date;
  status: OrderStatus;
  items: IOrderItem[];
  totalAmount: number;
  assignedTo?: string;
  orderEntitlementIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} 