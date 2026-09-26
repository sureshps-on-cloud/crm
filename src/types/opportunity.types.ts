export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

export interface IOpportunity {
  _id?: string;
  accountId: string;
  opportunityName: string;
  description?: string;
  stage: OpportunityStage;
  expectedCloseDate: Date;
  value: number;
  probability?: number;
  assignedTo: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOpportunityCreate {
  accountId: string;
  opportunityName: string;
  description?: string;
  stage: OpportunityStage;
  expectedCloseDate: Date;
  value: number;
  probability?: number;
  assignedTo: string;
  createdBy: string;
}

export interface IOpportunityUpdate {
  accountId?: string;
  opportunityName?: string;
  description?: string;
  stage?: OpportunityStage;
  expectedCloseDate?: Date;
  value?: number;
  probability?: number;
  assignedTo?: string;
}

export interface IOpportunityQuery {
  accountId?: string;
  opportunityName?: string;
  stage?: OpportunityStage | string;
  assignedTo?: string;
  createdBy?: string;
  valueMin?: number;
  valueMax?: number;
  probabilityMin?: number;
  probabilityMax?: number;
  expectedCloseDateAfter?: string | Date;
  expectedCloseDateBefore?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Allow any additional fields for dynamic filtering
  [key: string]: any;
}

export interface IOpportunityResponse {
  _id: string;
  accountId: string;
  opportunityName: string;
  description?: string;
  stage: OpportunityStage;
  expectedCloseDate: Date;
  value: number;
  probability?: number;
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} 