/**
 * Password Policy Hook
 * Fetches password policy rules and provides a validation function
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getPublicPasswordPolicy,
  type PublicPasswordPolicyResponse,
  type PasswordPolicyRule,
} from '@/api/setting';

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function usePasswordPolicy() {
  const {
    data: policy,
    isLoading,
    error,
  } = useQuery<PublicPasswordPolicyResponse>({
    queryKey: ['public', 'password-policy'],
    queryFn: getPublicPasswordPolicy,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const validatePassword = useCallback(
    (password: string): PasswordValidationResult => {
      const errors: string[] = [];

      if (!policy) {
        return { isValid: true, errors: [] };
      }

      // Check minimum length
      if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters`);
      }

      // Check maximum length
      if (password.length > policy.maxLength) {
        errors.push(`Password must be at most ${policy.maxLength} characters`);
      }

      // Check uppercase requirement
      if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Check lowercase requirement
      if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Check number requirement
      if (policy.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      // Check special character requirement
      if (policy.requireSpecial) {
        const specialChars = policy.specialCharacters || '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const escapedChars = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const specialRegex = new RegExp(`[${escapedChars}]`);
        if (!specialRegex.test(password)) {
          errors.push(`Password must contain at least one special character (${specialChars})`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [policy]
  );

  return {
    policy,
    rules: policy?.rules ?? [] as PasswordPolicyRule[],
    minLength: policy?.minLength ?? 8,
    maxLength: policy?.maxLength ?? 72,
    requireUppercase: policy?.requireUppercase ?? false,
    requireLowercase: policy?.requireLowercase ?? false,
    requireNumber: policy?.requireNumber ?? false,
    requireSpecial: policy?.requireSpecial ?? false,
    specialCharacters: policy?.specialCharacters ?? '!@#$%^&*()_+-=[]{}|;:,.<>?',
    validatePassword,
    isLoading,
    error,
  };
}
