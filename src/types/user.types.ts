export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES_REP = 'sales_rep'
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserCreate {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
}

export interface IUserUpdate {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  managerId?: string;
  managerName?: string;
}

export interface IUserQuery {
  name?: string;
  email?: string;
  role?: UserRole | string;
  managerId?: string;
  managerName?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
  createdAt: Date;
  updatedAt: Date;
} 