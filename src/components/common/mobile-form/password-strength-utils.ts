/**
 * Password strength utilities
 * Extracted for Fast Refresh compatibility
 */

import { useTranslation } from 'react-i18next';

export interface PasswordRule {
  /** Unique key for the rule */
  key: string;
  /** Display label */
  label: string;
  /** Test function to check if rule passes */
  test: (password: string) => boolean;
}

/** Create default password rules with translations */
export const getDefaultPasswordRules = (
  t: (key: string) => string
): PasswordRule[] => [
  {
    key: 'length',
    label: t('auth.passwordRules.length'),
    test: (p: string) => p.length >= 8 && p.length <= 72,
  },
  {
    key: 'letter',
    label: t('auth.passwordRules.letter'),
    test: (p: string) => /[a-zA-Z]/.test(p),
  },
  {
    key: 'number',
    label: t('auth.passwordRules.number'),
    test: (p: string) => /\d/.test(p),
  },
];

/** Hook for getting default password rules with translations */
export const useDefaultPasswordRules = (): PasswordRule[] => {
  const { t } = useTranslation();
  return getDefaultPasswordRules(t);
};
