const { AccountService } = await import('./src/services/account.service.js');

console.log('🧪 Testing Account Creation Directly...');

const accountService = new AccountService();

try {
  const testAccount = {
    shopName: "Direct Test Shop",
    location: "Test Location",
    region: "Central",
    assignedTo: "507f1f77bcf86cd799439011",
    createdBy: "507f1f77bcf86cd799439011"
  };

  console.log('📝 Creating account with data:', testAccount);
  
  const result = await accountService.createAccount(testAccount);
  
  console.log('✅ Account created successfully!');
  console.log('📊 Result type:', typeof result);
  console.log('📦 Result keys:', Object.keys(result));
  console.log('🏪 Shop name:', result.shopName);
  console.log('📍 Location:', result.location);
  console.log('🆔 ID:', result._id);
  console.log('📅 Created at:', result.createdAt);
  
  console.log('\n🔍 Full result JSON:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0); 