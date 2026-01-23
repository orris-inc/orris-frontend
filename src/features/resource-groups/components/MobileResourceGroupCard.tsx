/**
 * MobileResourceGroupCard - Tailwind Application UI style list item
 *
 * Design principles:
 * - Clean stacked list item (used with divide-y parent)
 * - Two-line layout: name + status | plan + member count
 * - Status badge on the right
 * - Tap to open detail sheet
 */

import { useTranslation } from 'react-i18next';
import { CreditCard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mobileListItemStyles } from '@/lib/ui-styles';
import type { ResourceGroup, ResourceGroupStatus } from '@/api/resource/types';
import type { PlanType } from '@/api/subscription/types';

// ============================================================================
// Types
// ============================================================================

export interface MobileResourceGroupCardProps {
  group: ResourceGroup;
  planName?: string;
  planType?: PlanType;
  memberCount?: number;
  onCardPress: (group: ResourceGroup) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<ResourceGroupStatus, { labelKey: string; className: string }> = {
  active: {
    labelKey: 'common.status.enabled',
    className: 'bg-success/10 text-success',
  },
  inactive: {
    labelKey: 'common.status.disabled',
    className: 'bg-muted text-muted-foreground',
  },
};

const PLAN_TYPE_CONFIG: Record<PlanType, { labelKey: string; className: string }> = {
  node: {
    labelKey: 'resourceGroups.planTypes.node',
    className: 'text-primary',
  },
  forward: {
    labelKey: 'resourceGroups.planTypes.forward',
    className: 'text-success',
  },
  hybrid: {
    labelKey: 'resourceGroups.planTypes.hybrid',
    className: 'text-info',
  },
};

// ============================================================================
// Sub Components
// ============================================================================

/**
 * Status badge - compact pill style
 */
const StatusBadge = ({
  status,
  t,
}: {
  status: ResourceGroupStatus;
  t: (key: string) => string;
}) => {
  const config = STATUS_CONFIG[status] || {
    labelKey: 'common.status.unknown',
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {t(config.labelKey)}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MobileResourceGroupCard = ({
  group,
  planName,
  planType,
  memberCount = 0,
  onCardPress,
}: MobileResourceGroupCardProps) => {
  const { t } = useTranslation();

  const planTypeConfig = planType ? PLAN_TYPE_CONFIG[planType] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardPress(group)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardPress(group);
        }
      }}
      className={mobileListItemStyles}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground truncate">
            {group.name}
          </span>
        </div>

        {/* Row 2: Plan + Plan type + Member count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="size-3 shrink-0" />
          <span className={cn('truncate max-w-[120px]', !planName && 'italic')}>
            {planName || t('subscription.noPlan')}
          </span>

          {planTypeConfig && (
            <>
              <span className="text-border">·</span>
              <span className={cn('shrink-0', planTypeConfig.className)}>
                {t(planTypeConfig.labelKey)}
              </span>
            </>
          )}

          <span className="text-border">·</span>
          <span className="flex items-center gap-1 shrink-0">
            <Users className="size-3" />
            <span className="tabular-nums">{memberCount}</span>
          </span>
        </div>
      </div>

      {/* Right side: Status */}
      <StatusBadge status={group.status} t={t} />
    </div>
  );
};

MobileResourceGroupCard.displayName = 'MobileResourceGroupCard';
