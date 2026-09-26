import { ProductCategory } from './product.types.js';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  CONVERTED = 'converted',
  DISQUALIFIED = 'disqualified'
}

export interface ILead {
  _id?: string;
  shopName: string;
  location: string;
  contactName: string;
  phone: string;
  status: LeadStatus;
  interestedProducts?: ProductCategory[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeadCreate {
  shopName: string;
  location: string;
  contactName: string;
  phone: string;
  status?: LeadStatus;
  interestedProducts?: ProductCategory[];
}

export interface ILeadUpdate {
  shopName?: string;
  location?: string;
  contactName?: string;
  phone?: string;
  status?: LeadStatus;
  interestedProducts?: ProductCategory[];
}

export interface ILeadQuery {
  shopName?: string;
  location?: string;
  contactName?: string;
  phone?: string;
  status?: LeadStatus | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface ILeadResponse {
  _id: string;
  shopName: string;
  location: string;
  contactName: string;
  phone: string;
  status: LeadStatus;
  interestedProducts?: ProductCategory[];
  createdAt: Date;
  updatedAt: Date;
} 