/**
 * MobileFAB - Floating Action Button for mobile admin pages
 *
 * Features:
 * - Fixed position at bottom right
 * - Safe area inset support for iOS
 * - Primary color with shadow
 * - Touch feedback animation
 * - Customizable icon
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileFABProps {
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
  /** aria-label for accessibility */
  label?: string;
}

export const MobileFAB = ({
  onClick,
  icon,
  className,
  label,
}: MobileFABProps) => {
  const { t } = useTranslation();
  const ariaLabel = label ?? t('common.actions.create');
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'fixed right-4 bottom-6',
        'size-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg shadow-primary/25',
        'flex items-center justify-center',
        'active:scale-[0.98] transition-transform motion-reduce:transition-none',
        'z-40',
        className
      )}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      {icon ?? <Plus className="size-6" />}
    </button>
  );
};

MobileFAB.displayName = 'MobileFAB';
