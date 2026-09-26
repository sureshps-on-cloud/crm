// Test script for task status update and order status change
import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const headers = { 'Content-Type': 'application/json' };

// Test data
const taskId = ''; // Replace with a real task ID that has an orderId
const orderId = ''; // Replace with the associated orderId

// Helper functions
async function getTaskById(id) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
  return await response.json();
}

async function getOrderById(id) {
  const response = await fetch(`${API_BASE_URL}/orders/${id}`);
  return await response.json();
}

async function updateTaskStatus(id, status, comment) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status, comment })
  });
  return await response.json();
}

async function updateTask(id, data) {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  return await response.json();
}

// Main test function
async function runTest() {
  try {
    console.log('Starting test...');
    
    // 1. Get the current task
    const taskBefore = await getTaskById(taskId);
    console.log('Task before update:', JSON.stringify(taskBefore, null, 2));
    
    // 2. Get the current order
    const orderBefore = await getOrderById(orderId);
    console.log('Order before update:', JSON.stringify(orderBefore, null, 2));
    
    // 3. Update task status to COMPLETED using updateTaskStatus endpoint
    console.log('\nTesting updateTaskStatus endpoint...');
    const statusUpdateResult = await updateTaskStatus(taskId, 'COMPLETED', 'Task completed successfully');
    console.log('Status update result:', JSON.stringify(statusUpdateResult, null, 2));
    
    // 4. Check the order status after task status update
    let orderAfter = await getOrderById(orderId);
    console.log('Order after task status update:', JSON.stringify(orderAfter, null, 2));
    
    // 5. Reset task status (just for testing)
    await updateTaskStatus(taskId, 'TODO', 'Reset for testing');
    await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'confirmed' })
    });
    
    // 6. Test using updateTask endpoint
    console.log('\nTesting updateTask endpoint...');
    const taskUpdateResult = await updateTask(taskId, { status: 'COMPLETED' });
    console.log('Task update result:', JSON.stringify(taskUpdateResult, null, 2));
    
    // 7. Check the order status after task update
    orderAfter = await getOrderById(orderId);
    console.log('Order after general task update:', JSON.stringify(orderAfter, null, 2));
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
