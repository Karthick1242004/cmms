/**
 * Password utility functions for secure password generation and handling
 */

/**
 * Generate a secure random password
 * @param length - Password length (default: 12)
 * @param includeSymbols - Include special symbols (default: true)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 12, includeSymbols: boolean = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // Fill the rest with random characters
  const remainingLength = length - password.length;
  for (let i = 0; i < remainingLength; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a user-friendly temporary password
 * Format: Word-Number-Word (e.g., "Blue-42-Sky")
 * @returns User-friendly temporary password
 */
export function generateTempPassword(): string {
  const adjectives = [
    'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Quick', 'Fast', 'Smart', 'Bright', 'Clear',
    'Sharp', 'Swift', 'Bold', 'Calm', 'Cool', 'Warm', 'Fresh', 'Pure', 'Strong', 'Light'
  ];
  
  const nouns = [
    'Sky', 'Star', 'Moon', 'Sun', 'Wave', 'Fire', 'Wind', 'Rock', 'Tree', 'Bird',
    'Lion', 'Bear', 'Wolf', 'Eagle', 'Hawk', 'Tiger', 'Fox', 'Deer', 'Fish', 'Owl'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100) + 10; // 10-109
  
  return `${adjective}-${number}-${noun}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with strength score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 6) {
    feedback.push('Password must be at least 6 characters long');
  } else if (password.length >= 8) {
    score += 25;
  } else {
    score += 15;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add uppercase letters');
  }
  
  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add numbers');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add special characters');
  }
  
  // Length bonus
  if (password.length >= 12) {
    score += 15;
  } else if (password.length >= 10) {
    score += 10;
  }
  
  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }
  
  if (/123|abc|qwerty|password/i.test(password)) {
    score -= 20;
    feedback.push('Avoid common patterns');
  }
  
  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 60) {
    strength = 'good';
  } else if (score >= 40) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }
  
  return {
    isValid: password.length >= 6 && score >= 40,
    score: Math.max(0, Math.min(100, score)),
    feedback,
    strength
  };
}

/**
 * Check if a password is a common/weak password
 * @param password - Password to check
 * @returns true if password is common/weak
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
    'admin', 'admin123', 'test', 'test123', 'user', 'user123',
    'temp123', 'temp', 'welcome', 'welcome123', 'login', 'login123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
}
