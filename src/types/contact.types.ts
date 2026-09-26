export interface IContact {
  _id?: string;
  accountId: string;
  name: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactCreate {
  accountId: string;
  name: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  createdBy: string;
}

export interface IContactUpdate {
  name?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface IContactQuery {
  accountId?: string;
  name?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IContactResponse {
  _id: string;
  accountId: string;
  name: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} 