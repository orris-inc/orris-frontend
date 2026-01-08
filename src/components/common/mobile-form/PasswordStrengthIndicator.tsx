/**
 * PasswordStrengthIndicator Component
 * Visual password strength indicator with rule checklist
 * Features: Strength bar, rule checklist with icons
 */

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordRule {
  /** Unique key for the rule */
  key: string;
  /** Display label */
  label: string;
  /** Test function to check if rule passes */
  test: (password: string) => boolean;
}

export interface PasswordStrengthIndicatorProps {
  /** Current password value */
  password: string;
  /** Password validation rules */
  rules: PasswordRule[];
  /** Additional className */
  className?: string;
}

/** Default password rules (8-72 chars, letter, number) */
export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  {
    key: 'length',
    label: '8-72 个字符',
    test: (p: string) => p.length >= 8 && p.length <= 72,
  },
  {
    key: 'letter',
    label: '包含字母',
    test: (p: string) => /[a-zA-Z]/.test(p),
  },
  {
    key: 'number',
    label: '包含数字',
    test: (p: string) => /\d/.test(p),
  },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  rules,
  className,
}) => {
  const passedRules = rules.filter((rule) => rule.test(password));
  const strengthPercent = (passedRules.length / rules.length) * 100;

  if (!password) return null;

  return (
    <div className={cn('space-y-3 pt-1', className)}>
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

      {/* Rules checklist */}
      <div className="grid grid-cols-1 gap-2 px-1">
        {rules.map((rule) => {
          const passed = rule.test(password);
          return (
            <div
              key={rule.key}
              className={cn(
                'flex items-center gap-2 text-sm transition-colors',
                passed ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'size-5 rounded-full flex items-center justify-center flex-shrink-0',
                  passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
                )}
              >
                {passed ? <Check className="size-3" /> : <X className="size-3" />}
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
