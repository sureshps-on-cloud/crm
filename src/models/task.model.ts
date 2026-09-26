import { model, Schema, Document } from 'mongoose';
import { 
  ITask, 
  TaskStatus, 
  TaskType, 
  TaskPriority, 
  TaskSource, 
  ITaskComment 
} from '../types/task.types.js';

const taskCommentSchema = new Schema<ITaskComment>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new Schema<ITask & Document>({
  title: { type: String, required: true, trim: true },
  details: { type: String, trim: true },
  status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.PENDING, required: true },
  type: { type: String, enum: Object.values(TaskType), required: true },
  priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM, required: true },
  source: { type: String, enum: Object.values(TaskSource), required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  orderEntitlementId: { type: Schema.Types.ObjectId, ref: 'OrderEntitlement' },
  dueDate: { type: Date, required: true },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  comments: [taskCommentSchema],
}, { timestamps: true });

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ accountId: 1 });
taskSchema.index({ dueDate: 1 });

export interface ITaskDocument extends ITask, Document {}

export const TaskModel = model<ITaskDocument>('Task', taskSchema); 