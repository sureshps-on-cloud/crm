export enum AccountStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  BLOCKED = 'blocked'
}

export enum OutletType {
  SUPERMARKET = 'supermarket',
  PREMIUM_OUTLET = 'premium_outlet',
  LOCAL_VENDOR = 'local_vendor',
  RETAIL_OUTLET = 'retail_outlet'
}

export enum OutletSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum CustomerTier {
  PLATINUM = 'platinum',
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze'
}

export enum PaymentTerms {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  NET_7 = 'net_7',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_45 = 'net_45',
  NET_60 = 'net_60'
}

export interface IAccount {
  _id?: string;
  shopName: string;
  location: string;
  region: string;
  leadId?: string;
  status: AccountStatus;
  assignedTo: string;
  createdBy: string;
  outletType: OutletType;
  outletSize: OutletSize;
  customerTier: CustomerTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  outstandingBalance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccountCreate {
  shopName: string;
  location: string;
  region: string;
  leadId?: string;
  status?: AccountStatus;
  assignedTo: string;
  createdBy: string;
  outletType: OutletType;
  outletSize: OutletSize;
  customerTier?: CustomerTier;
  creditLimit?: number;
  paymentTerms?: PaymentTerms;
  outstandingBalance?: number;
}

export interface IAccountUpdate {
  shopName?: string;
  location?: string;
  region?: string;
  leadId?: string;
  status?: AccountStatus;
  assignedTo?: string;
  outletType?: OutletType;
  outletSize?: OutletSize;
  customerTier?: CustomerTier;
  creditLimit?: number;
  paymentTerms?: PaymentTerms;
  outstandingBalance?: number;
}

export interface IAccountQuery {
  shopName?: string;
  location?: string;
  region?: string;
  leadId?: string;
  status?: AccountStatus | string;
  assignedTo?: string;
  createdBy?: string;
  outletType?: OutletType | string;
  outletSize?: OutletSize | string;
  customerTier?: CustomerTier | string;
  paymentTerms?: PaymentTerms | string;
  creditLimitMin?: number;
  creditLimitMax?: number;
  outstandingBalanceMin?: number;
  outstandingBalanceMax?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IAccountResponse {
  _id: string;
  shopName: string;
  location: string;
  region: string;
  leadId?: string;
  status: AccountStatus;
  assignedTo: string;
  createdBy: string;
  outletType: OutletType;
  outletSize: OutletSize;
  customerTier: CustomerTier;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
} 