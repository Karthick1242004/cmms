#!/usr/bin/env node

/**
 * Test JWT_SECRET validation locally before deployment
 */

function validateJWTSecret(secret) {
  console.log(`Testing: "${secret}"`);
  console.log(`Length: ${secret.length} characters`);
  
  if (!secret) {
    console.log('❌ FAIL: JWT_SECRET is missing');
    return false;
  }
  
  if (secret.length < 32) {
    console.log('❌ FAIL: JWT_SECRET must be at least 32 characters long');
    return false;
  }
  
  console.log('✅ PASS: JWT_SECRET meets minimum requirements');
  return true;
}

console.log('🔐 JWT_SECRET Validation Test');
console.log('=============================');
console.log();

// Test current local secret
console.log('1. Testing current local secret:');
const currentSecret = 'your-super-secret-jwt-key-for-development-only';
validateJWTSecret(currentSecret);
console.log();

// Test new local secret
console.log('2. Testing new local secret:');
const newLocalSecret = 'your-super-secret-jwt-key-for-development-2024-secure';
validateJWTSecret(newLocalSecret);
console.log();

// Test production secret
console.log('3. Testing production secret:');
const productionSecret = 'TBBpEF7dvljMy4FZcsYsB9wj4fhwJ9r55EsnURlLY9BECFspDKIysalPDnLDT46v';
validateJWTSecret(productionSecret);
console.log();

console.log('🚀 RECOMMENDATION:');
console.log('- Update Railway JWT_SECRET to the production secret (64 chars)');
console.log('- Update local .env to the new local secret (53 chars)');
console.log('- Both meet the minimum 32 character requirement');
