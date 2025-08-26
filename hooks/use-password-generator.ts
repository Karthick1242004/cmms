import { useState, useCallback } from 'react';
import { generateSecurePassword, generateTempPassword, validatePasswordStrength } from '@/lib/password-utils';

export interface PasswordGeneratorOptions {
  length?: number;
  includeSymbols?: boolean;
  type?: 'secure' | 'temp';
}

export function usePasswordGenerator() {
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
    strength: 'weak' | 'fair' | 'good' | 'strong';
  } | null>(null);

  const generatePassword = useCallback((options: PasswordGeneratorOptions = {}) => {
    const { length = 12, includeSymbols = true, type = 'secure' } = options;
    
    let password: string;
    if (type === 'temp') {
      password = generateTempPassword();
    } else {
      password = generateSecurePassword(length, includeSymbols);
    }
    
    setGeneratedPassword(password);
    
    // Validate the generated password
    const strength = validatePasswordStrength(password);
    setPasswordStrength(strength);
    
    return password;
  }, []);

  const validatePassword = useCallback((password: string) => {
    const strength = validatePasswordStrength(password);
    setPasswordStrength(strength);
    return strength;
  }, []);

  const clearPassword = useCallback(() => {
    setGeneratedPassword('');
    setPasswordStrength(null);
  }, []);

  return {
    generatedPassword,
    passwordStrength,
    generatePassword,
    validatePassword,
    clearPassword,
  };
}
