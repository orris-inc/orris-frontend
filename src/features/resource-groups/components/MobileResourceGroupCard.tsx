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
import { SmartTruncate } from '@/components/common/SmartTruncate';
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

const PLAN_TYPE_CONFIG: Record<PlanType, { labelKey: string; shortLabel: string; className: string }> = {
  node: {
    labelKey: 'resourceGroups.planTypes.node',
    shortLabel: 'N',
    className: 'bg-primary/10 text-primary',
  },
  forward: {
    labelKey: 'resourceGroups.planTypes.forward',
    shortLabel: 'F',
    className: 'bg-success/10 text-success',
  },
  hybrid: {
    labelKey: 'resourceGroups.planTypes.hybrid',
    shortLabel: 'H',
    className: 'bg-info/10 text-info',
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
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
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
      {/* Left: Identity + metadata */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Plan type badge + Name */}
        <div className="flex items-center gap-2 mb-1">
          {planTypeConfig && (
            <span
              className={cn(
                'inline-flex items-center justify-center',
                'size-5 rounded text-[10px] font-bold shrink-0',
                planTypeConfig.className
              )}
            >
              {planTypeConfig.shortLabel}
            </span>
          )}
          <SmartTruncate text={group.name} className="text-[13px] font-medium text-foreground" />
        </div>

        {/* Row 2: Plan name */}
        <div className="text-xs text-muted-foreground">
          <span className={cn('truncate', !planName && 'italic')}>
            {planName || t('subscription.noPlan')}
          </span>
        </div>
      </div>

      {/* Right: Status */}
      <StatusBadge status={group.status} t={t} />
    </div>
  );
};

MobileResourceGroupCard.displayName = 'MobileResourceGroupCard';
