/**
 * Shared form logic for EditUserDialog and EditUserSheet
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserResponse, UpdateUserRequest } from '@/api/user';
import type { UserStatus, UserRole } from '../types/users.types';

interface UseEditUserFormParams {
  user: UserResponse | null;
}

export function useEditUserForm({ user }: UseEditUserFormParams) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [role, setRole] = useState<UserRole>('user');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Build status options with translations
  const statusOptions = useMemo(() => [
    { value: 'active' as const, label: t('common.status.enabled') },
    { value: 'inactive' as const, label: t('common.status.disabled') },
    { value: 'pending' as const, label: t('common.status.pending') },
    { value: 'suspended' as const, label: t('common.status.suspended') },
  ], [t]);

  // Build role options with translations
  const roleOptions = useMemo(() => [
    { value: 'user' as const, label: t('common.role.user') },
    { value: 'admin' as const, label: t('common.role.admin') },
  ], [t]);

  // Initialize form when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || '');
      setStatus((user.status as UserStatus) || 'active');
      setRole((user.role as UserRole) || 'user');
      setErrors({});
      setTouched({});
    }
  }, [user]);

  // Validation
  const validateEmail = useCallback((value: string): string | undefined => {
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t('admin.users.validation.emailInvalid');
    }
    return undefined;
  }, [t]);

  const validateName = useCallback((value: string): string | undefined => {
    if (value.trim() && (value.trim().length < 2 || value.trim().length > 100)) {
      return t('admin.users.validation.nameLengthError');
    }
    return undefined;
  }, [t]);

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

  const handleBlur = useCallback((field: 'email' | 'name') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { email: validateEmail, name: validateName };
    const values = { email, name };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [email, name, validateEmail, validateName]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      email: validateEmail(email),
      name: validateName(name),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.name;
  }, [email, name, validateEmail, validateName]);

  // Build submit data (only changed fields)
  const buildSubmitData = useCallback((): { id: string; data: UpdateUserRequest } | null => {
    if (!user) return null;

    const updates: UpdateUserRequest = {};
    if (email !== user.email) updates.email = email;
    if (name !== user.name) updates.name = name;
    if (status !== user.status) updates.status = status as UpdateUserRequest['status'];
    if (role !== user.role) updates.role = role as UpdateUserRequest['role'];

    if (Object.keys(updates).length === 0) return null;
    return { id: user.id, data: updates };
  }, [user, email, name, status, role]);

  // Check for changes
  const hasChanges = !!(user && (
    email !== user.email ||
    name !== user.name ||
    status !== user.status ||
    role !== user.role
  ));

  return {
    // State
    email,
    name,
    status,
    role,
    errors,
    touched,

    // Handlers
    handleEmailChange,
    handleNameChange,
    setStatus,
    setRole,
    handleBlur,

    // Options
    statusOptions,
    roleOptions,

    // Validation & submission
    validate,
    buildSubmitData,
    hasChanges,
  };
}
