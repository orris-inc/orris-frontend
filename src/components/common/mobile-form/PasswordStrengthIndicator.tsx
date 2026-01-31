/**
 * PasswordStrengthIndicator Component
 * Visual password strength indicator with rule checklist
 * Features: Strength bar, rule checklist with icons
 */

import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { PasswordRule } from './password-strength-utils';
export type { PasswordRule } from './password-strength-utils';

export interface PasswordStrengthIndicatorProps {
  /** Current password value */
  password: string;
  /** Password validation rules */
  rules: PasswordRule[];
  /** Additional className */
  className?: string;
  /** Compact mode - horizontal layout for rules */
  compact?: boolean;
  /** Override for strength valid text (uses translation by default) */
  strengthValidText?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  rules,
  className,
  compact = false,
  strengthValidText,
}) => {
  const { t } = useTranslation();
  const passedRules = rules.filter((rule) => rule.test(password));
  const strengthPercent = (passedRules.length / rules.length) * 100;
  const validText = strengthValidText ?? t('auth.passwordRules.strengthValid');

  if (!password) return null;

  // Compact mode - single line with strength bar and inline status
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-1', className)}>
        {/* Strength bar */}
        <div className="flex gap-1 flex-1 max-w-24">
          {rules.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index < passedRules.length
                  ? strengthPercent === 100
                    ? 'bg-emerald-500'
                    : strengthPercent >= 66
                      ? 'bg-yellow-500'
                      : 'bg-destructive'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
        {/* Status text */}
        <span className={cn(
          'text-xs',
          strengthPercent === 100 ? 'text-emerald-600' : 'text-muted-foreground'
        )}>
          {strengthPercent === 100 ? validText : `${passedRules.length}/${rules.length}`}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2 pt-1', className)}>
      {/* Strength bar */}
      <div className="flex gap-1.5 px-1">
        {rules.map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index < passedRules.length
                ? strengthPercent === 100
                  ? 'bg-emerald-500'
                  : strengthPercent >= 66
                    ? 'bg-yellow-500'
                    : 'bg-destructive'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Rules checklist - horizontal on compact, vertical otherwise */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
        {rules.map((rule) => {
          const passed = rule.test(password);
          return (
            <div
              key={rule.key}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                passed ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'size-4 rounded-full flex items-center justify-center flex-shrink-0',
                  passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
                )}
              >
                {passed ? <Check className="size-2.5" /> : <X className="size-2.5" />}
              </div>
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';
