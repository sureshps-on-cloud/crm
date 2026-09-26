export enum OrderEntitlementFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface IOrderEntitlement {
  _id?: string;
  accountId: string;
  productId: string;
  opportunityId: string;
  entitledQty: number;
  frequency: OrderEntitlementFrequency;
  price: number;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderEntitlementCreate {
  accountId: string;
  productId: string;
  opportunityId: string;
  entitledQty: number;
  frequency: OrderEntitlementFrequency;
  price: number;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}

export interface IOrderEntitlementUpdate {
  accountId?: string;
  productId?: string;
  opportunityId?: string;
  entitledQty?: number;
  frequency?: OrderEntitlementFrequency;
  price?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface IOrderEntitlementQuery {
  accountId?: string;
  productId?: string;
  opportunityId?: string;
  entitledQty?: number;
  frequency?: OrderEntitlementFrequency | string;
  price?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IOrderEntitlementResponse {
  _id: string;
  accountId: string;
  productId: string;
  opportunityId: string;
  entitledQty: number;
  frequency: OrderEntitlementFrequency;
  price: number;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} 