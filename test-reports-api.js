// Simple test script to verify the reports API endpoints
const testReportsAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Reports API Endpoints...\n');
  
  // Test overview report
  try {
    console.log('1️⃣ Testing Overview Report...');
    const overviewResponse = await fetch(`${baseUrl}/api/reports?timeRange=month&type=overview`);
    const overviewData = await overviewResponse.json();
    
    if (overviewResponse.ok) {
      console.log('✅ Overview Report - Success');
      console.log('   - Maintenance Costs:', overviewData.data?.overview?.maintenanceCosts || 'N/A');
      console.log('   - Completion Rate:', overviewData.data?.overview?.completionRate || 'N/A');
      console.log('   - Asset Uptime:', overviewData.data?.overview?.assetUptime || 'N/A');
    } else {
      console.log('❌ Overview Report - Failed:', overviewData.message);
    }
  } catch (error) {
    console.log('❌ Overview Report - Error:', error.message);
  }
  
  console.log('');
  
  // Test assets report
  try {
    console.log('2️⃣ Testing Assets Report...');
    const assetsResponse = await fetch(`${baseUrl}/api/reports?timeRange=month&type=assets`);
    const assetsData = await assetsResponse.json();
    
    if (assetsResponse.ok) {
      console.log('✅ Assets Report - Success');
      console.log('   - Performance Data:', assetsData.data?.performance?.length || 0, 'entries');
    } else {
      console.log('❌ Assets Report - Failed:', assetsData.message);
    }
  } catch (error) {
    console.log('❌ Assets Report - Error:', error.message);
  }
  
  console.log('');
  
  // Test maintenance report
  try {
    console.log('3️⃣ Testing Maintenance Report...');
    const maintenanceResponse = await fetch(`${baseUrl}/api/reports?timeRange=month&type=maintenance`);
    const maintenanceData = await maintenanceResponse.json();
    
    if (maintenanceResponse.ok) {
      console.log('✅ Maintenance Report - Success');
      console.log('   - Metrics Data:', maintenanceData.data?.metrics?.length || 0, 'entries');
    } else {
      console.log('❌ Maintenance Report - Failed:', maintenanceData.message);
    }
  } catch (error) {
    console.log('❌ Maintenance Report - Error:', error.message);
  }
  
  console.log('');
  
  // Test inventory report
  try {
    console.log('4️⃣ Testing Inventory Report...');
    const inventoryResponse = await fetch(`${baseUrl}/api/reports?timeRange=month&type=inventory`);
    const inventoryData = await inventoryResponse.json();
    
    if (inventoryResponse.ok) {
      console.log('✅ Inventory Report - Success');
      console.log('   - Distribution Data:', inventoryData.data?.distribution?.length || 0, 'entries');
    } else {
      console.log('❌ Inventory Report - Failed:', inventoryData.message);
    }
  } catch (error) {
    console.log('❌ Inventory Report - Error:', error.message);
  }
  
  console.log('');
  
  // Test stats endpoint
  try {
    console.log('5️⃣ Testing Reports Stats...');
    const statsResponse = await fetch(`${baseUrl}/api/reports/stats?timeRange=month`);
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Reports Stats - Success');
      console.log('   - Overview Stats:', Object.keys(statsData.data?.overview || {}).length, 'metrics');
      console.log('   - Asset Stats:', Object.keys(statsData.data?.assets || {}).length, 'metrics');
      console.log('   - Maintenance Stats:', Object.keys(statsData.data?.maintenance || {}).length, 'metrics');
      console.log('   - Inventory Stats:', Object.keys(statsData.data?.inventory || {}).length, 'metrics');
    } else {
      console.log('❌ Reports Stats - Failed:', statsData.message);
    }
  } catch (error) {
    console.log('❌ Reports Stats - Error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
};

// Run the test
testReportsAPI().catch(console.error);
