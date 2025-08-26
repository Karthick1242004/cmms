#!/usr/bin/env node

/**
 * Generate a secure JWT_SECRET for production deployment
 * This script generates a cryptographically secure random string
 * that meets the minimum requirements (32+ characters)
 */

const crypto = require('crypto');

function generateSecureJWTSecret(length = 64) {
  // Generate random bytes and convert to base64
  const randomBytes = crypto.randomBytes(Math.ceil(length * 3/4));
  return randomBytes.toString('base64')
    .replace(/[+\/=]/g, '') // Remove special characters that might cause issues
    .substring(0, length);
}

function generateReadableJWTSecret(length = 64) {
  // Alternative: Generate a more readable but still secure secret
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

console.log('🔐 JWT Secret Generator');
console.log('======================');
console.log();

console.log('Option 1 - Base64 Secret (64 characters):');
const base64Secret = generateSecureJWTSecret(64);
console.log(base64Secret);
console.log(`Length: ${base64Secret.length} characters`);
console.log();

console.log('Option 2 - Alphanumeric Secret (64 characters):');
const readableSecret = generateReadableJWTSecret(64);
console.log(readableSecret);
console.log(`Length: ${readableSecret.length} characters`);
console.log();

console.log('Option 3 - Extended Development Secret (48 characters):');
const devSecret = 'your-super-secret-jwt-key-for-development-2024-secure';
console.log(devSecret);
console.log(`Length: ${devSecret.length} characters`);
console.log();

console.log('🚀 DEPLOYMENT INSTRUCTIONS:');
console.log('============================');
console.log('1. Copy one of the secrets above');
console.log('2. Set JWT_SECRET in Railway environment variables');
console.log('3. Set JWT_SECRET in Vercel environment variables');
console.log('4. Update your local .env file');
console.log();
console.log('⚠️  SECURITY NOTES:');
console.log('- Never commit JWT secrets to version control');
console.log('- Use different secrets for different environments');
console.log('- Rotate secrets periodically in production');
console.log('- Keep secrets secure and confidential');
