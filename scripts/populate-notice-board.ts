#!/usr/bin/env tsx

/**
 * Script to populate the notice board with sample data
 * Run with: npx tsx scripts/populate-notice-board.ts
 */

import { getAllSampleNotices } from '../data/notice-board-sample';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Function to get auth token (you'll need to login first)
async function getAuthToken(): Promise<string | null> {
  try {
    // Try to get token from localStorage if running in browser
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    
    // For Node.js environment, you might need to login first
    console.log('⚠️  Please ensure you are logged in and have a valid auth token');
    console.log('   You can either:');
    console.log('   1. Run this script in the browser console after logging in');
    console.log('   2. Set AUTH_TOKEN environment variable');
    console.log('   3. Login via API and use the returned token');
    
    return process.env.AUTH_TOKEN || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Function to create a notice via API
async function createNotice(noticeData: any, authToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/notice-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(noticeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create notice "${noticeData.title}":`, response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Created notice: "${noticeData.title}" (ID: ${result.data?.id || 'unknown'})`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating notice "${noticeData.title}":`, error);
    return false;
  }
}

// Function to populate notice board with sample data
async function populateNoticeBoard() {
  console.log('🚀 Starting notice board population...');
  
  // Get auth token
  const authToken = await getAuthToken();
  if (!authToken) {
    console.error('❌ No auth token available. Please login first.');
    return;
  }

  console.log('🔑 Auth token obtained successfully');

  // Get sample notices
  const sampleNotices = getAllSampleNotices();
  console.log(`📝 Found ${sampleNotices.length} sample notices to create`);

  // Create notices one by one
  let successCount = 0;
  let failureCount = 0;

  for (const notice of sampleNotices) {
    console.log(`\n📋 Creating notice: "${notice.title}"`);
    console.log(`   Author: ${notice.createdByName} (${notice.createdByRole})`);
    console.log(`   Department: ${notice.createdByDepartment}`);
    console.log(`   Priority: ${notice.priority}`);
    console.log(`   Target: ${notice.targetAudience}`);
    
    const success = await createNotice(notice, authToken);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Add a small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 Population Summary:');
  console.log(`   ✅ Successfully created: ${successCount} notices`);
  console.log(`   ❌ Failed to create: ${failureCount} notices`);
  console.log(`   📈 Total processed: ${sampleNotices.length} notices`);

  if (successCount > 0) {
    console.log('\n🎉 Notice board population completed successfully!');
    console.log('   You can now view the notices in your notice board application.');
  } else {
    console.log('\n💥 No notices were created. Please check the errors above.');
  }
}

// Function to check if running in browser or Node.js
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Main execution
if (isBrowser()) {
  // Running in browser
  console.log('🌐 Running in browser environment');
  populateNoticeBoard().catch(console.error);
} else {
  // Running in Node.js
  console.log('🖥️  Running in Node.js environment');
  populateNoticeBoard().catch(console.error);
}

// Export for use in other scripts
export { populateNoticeBoard, createNotice, getAuthToken };
