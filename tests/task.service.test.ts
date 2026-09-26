import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TaskService } from '../src/services/task.service.js';
import { TaskModel, ITaskDocument } from '../src/models/task.model.js';
import { TaskStatus, TaskType, TaskPriority } from '../src/types/task.types.js';

let mongoServer: MongoMemoryServer;
let taskService: TaskService;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  taskService = new TaskService();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await TaskModel.deleteMany({});
});

describe('TaskService', () => {
  const mockUser = { userId: new mongoose.Types.ObjectId().toHexString(), userName: 'Test Manager' };
  const mockAgent = { userId: new mongoose.Types.ObjectId().toHexString(), userName: 'Test Agent' };
  
  it('should create a new task manually', async () => {
    const taskData = {
      title: 'Manual Test Task',
      type: TaskType.SALES_VISIT,
      priority: TaskPriority.HIGH,
      assignedTo: mockAgent.userId,
      assignedBy: mockUser.userId,
      dueDate: new Date('2024-10-10'),
    };

    const createdTask = await taskService.createTask(taskData, mockUser);

    expect(createdTask).toBeDefined();
    expect(createdTask.title).toBe(taskData.title);
    expect(createdTask.status).toBe(TaskStatus.TODO);
    expect(createdTask.comments).toHaveLength(1);
    expect(createdTask.comments[0].comment).toBe('Task created.');
  });

  it('should update a task status and add a comment', async () => {
    const task = await new TaskModel({
      title: 'Status Update Task',
      type: TaskType.DELIVERY,
      priority: TaskPriority.MEDIUM,
      source: 'MANUAL',
      assignedBy: mockUser.userId,
      dueDate: new Date(),
    }).save();

    const newStatus = TaskStatus.IN_PROGRESS;
    const comment = 'Agent has started the delivery.';
    
    const updatedTask = await taskService.updateTaskStatus(task._id.toHexString(), newStatus, comment, mockAgent);

    expect(updatedTask).toBeDefined();
    expect(updatedTask?.status).toBe(newStatus);
    expect(updatedTask?.comments).toHaveLength(1);
    expect(updatedTask?.comments[0].comment).toBe(comment);
    expect(updatedTask?.comments[0].user.toHexString()).toBe(mockAgent.userId);
  });
  
  it('should set completedDate when status is COMPLETED', async () => {
    const task = await new TaskModel({ title: 'Completion Test', type: TaskType.OTHER, priority: TaskPriority.LOW, source: 'MANUAL', assignedBy: mockUser.userId, dueDate: new Date() }).save();
    
    const updatedTask = await taskService.updateTaskStatus(task._id.toHexString(), TaskStatus.COMPLETED, 'Task is done.', mockAgent);
    
    expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
    expect(updatedTask?.completedDate).toBeDefined();
    expect(updatedTask?.completedDate).toBeInstanceOf(Date);
  });

  it('should list tasks filtered by status', async () => {
    await new TaskModel({ title: 'Task 1', type: TaskType.OTHER, status: TaskStatus.TODO, priority: TaskPriority.LOW, source: 'MANUAL', assignedBy: mockUser.userId, dueDate: new Date() }).save();
    await new TaskModel({ title: 'Task 2', type: TaskType.OTHER, status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, source: 'MANUAL', assignedBy: mockUser.userId, dueDate: new Date() }).save();
    
    const result = await taskService.listTasks({ status: TaskStatus.TODO });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe(TaskStatus.TODO);
  });
}); 