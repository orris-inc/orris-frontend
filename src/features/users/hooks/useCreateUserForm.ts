/**
 * Shared form logic for CreateUserDialog and CreateUserSheet
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateUserRequest } from '@/api/user';

interface UseCreateUserFormParams {
  open: boolean;
}

// Password strength rules (8-72 chars, must contain letter and number)
const PASSWORD_RULES = [
  { key: 'length', labelKey: 'admin.users.form.passwordLength', test: (p: string) => p.length >= 8 && p.length <= 72 },
  { key: 'letter', labelKey: 'admin.users.form.containsLetter', test: (p: string) => /[a-zA-Z]/.test(p) },
  { key: 'number', labelKey: 'admin.users.form.containsNumber', test: (p: string) => /\d/.test(p) },
];

export function useCreateUserForm({ open: _open }: UseCreateUserFormParams) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('admin.users.form.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('admin.users.form.emailInvalid');
    return undefined;
  }, [t]);

  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return t('admin.users.form.nameRequired');
    if (value.trim().length < 2 || value.trim().length > 100) return t('admin.users.form.nameLengthError');
    return undefined;
  }, [t]);

  const validatePassword = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return t('admin.users.form.passwordRequired');
    if (trimmed.length < 8) return t('admin.users.form.passwordMinLength');
    if (trimmed.length > 72) return t('admin.users.form.passwordMaxLength');
    if (!/[a-zA-Z]/.test(trimmed)) return t('admin.users.form.passwordNeedsLetter');
    if (!/\d/.test(trimmed)) return t('admin.users.form.passwordNeedsNumber');
    return undefined;
  }, [t]);

  // Field change handlers with inline validation when touched
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  }, [touched.email, validateEmail]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  }, [touched.name, validateName]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  }, [touched.password, validatePassword]);

  // Handle blur events for inline validation
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators: Record<string, (v: string) => string | undefined> = {
      email: validateEmail,
      name: validateName,
      password: validatePassword,
    };
    const values: Record<string, string> = { email, name, password };
    if (validators[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
    }
  }, [email, name, password, validateEmail, validateName, validatePassword]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const newErrors = {
      email: validateEmail(email),
      name: validateName(name),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    setTouched({ email: true, name: true, password: true });
    return !newErrors.email && !newErrors.name && !newErrors.password;
  }, [email, name, password, validateEmail, validateName, validatePassword]);

  // Build submit data
  const buildSubmitData = useCallback((): CreateUserRequest => ({
    email: email.trim(),
    name: name.trim(),
    password: password.trim(),
  }), [email, name, password]);

  // Reset form state
  const reset = useCallback(() => {
    setEmail('');
    setName('');
    setPassword('');
    setShowPassword(false);
    setErrors({});
    setTouched({});
  }, []);

  // Computed values
  const trimmedPassword = password.trim();
  const isFormValid = !!(
    email.trim() &&
    name.trim() &&
    trimmedPassword.length >= 8 &&
    trimmedPassword.length <= 72 &&
    /[a-zA-Z]/.test(trimmedPassword) &&
    /\d/.test(trimmedPassword)
  );

  // Password strength
  const passwordStrength = PASSWORD_RULES.filter((rule) => rule.test(password));
  const strengthPercent = (passwordStrength.length / PASSWORD_RULES.length) * 100;
  const strengthInfo = trimmedPassword
    ? { passed: passwordStrength.length, total: PASSWORD_RULES.length }
    : null;

  return {
    // State
    email,
    name,
    password,
    showPassword,
    errors,
    touched,

    // Setters (for direct Input onChange that passes event)
    setShowPassword,

    // Handlers
    handleEmailChange,
    handleNameChange,
    handlePasswordChange,
    handleBlur,

    // Validation & submission
    validate,
    buildSubmitData,
    isFormValid,

    // Password strength
    passwordRules: PASSWORD_RULES,
    passwordStrength,
    strengthPercent,
    strengthInfo,

    // Reset
    reset,
  };
}
