/**
 * SubscriptionNodeOrderList - What one subscription actually delivers, in link order
 *
 * Read-only. This is the whole delivered sequence: every resource group the plan maps to,
 * the system forward rules bound to those groups, and the subscriber's own rules, merged
 * on the shared sort_order sequence with inactive nodes filtered out. Positions are
 * changed elsewhere — per resource group (resource-groups) or per user's own rules.
 *
 * Added: 2026-08-13
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, Loader2, ListOrdered, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { SUBSCRIPTION_STATUS_CONFIG } from '@/shared/constants/status-config';
import { useSubscriptionNodeOrder } from '../hooks/useSubscriptionNodeOrder';
import type { SubscriptionNodeMode, SubscriptionNodeOrderEntry } from '@/api/admin';

const MODES: SubscriptionNodeMode[] = ['all', 'origin', 'forward'];

const MODE_LABEL_KEYS: Record<SubscriptionNodeMode, string> = {
  all: 'subscription.nodeOrder.modeAll',
  origin: 'subscription.nodeOrder.modeOrigin',
  forward: 'subscription.nodeOrder.modeForward',
};

// `id` alone is ambiguous: one node is delivered directly and again behind each rule
const entryKey = (entry: SubscriptionNodeOrderEntry) => `${entry.type}:${entry.id}`;

const EntryRow = ({ entry }: { entry: SubscriptionNodeOrderEntry }) => {
  const { t } = useTranslation();
  const isOrigin = entry.type === 'origin';

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-card ring-1 ring-border/60">
      <span className="shrink-0 w-6 pt-0.5 text-[11px] tabular-nums text-muted-foreground/60">
        {entry.position}
      </span>

      {isOrigin ? (
        <Server className="size-4 shrink-0 mt-0.5 text-primary" />
      ) : (
        <ArrowRightLeft className="size-4 shrink-0 mt-0.5 text-warning" />
      )}

      <div className="flex-1 min-w-0">
        <SmartTruncate text={entry.name} className="text-[13px] font-medium text-foreground" />
        <SmartTruncate
          text={entry.id}
          mono
          className="text-[11px] text-muted-foreground/60"
          font="11px 'SF Mono', ui-monospace, monospace"
          lineHeight={14}
        />
        <div className="text-[11px] text-muted-foreground/60">
          {entry.protocol} · {entry.serverAddress}:{entry.port}
          {/* The node carrying the traffic, which a forwarded entry hides behind the relay */}
          {!isOrigin && <> · {entry.nodeId}</>}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <span
          className={cn(
            'px-2 py-0.5 rounded-lg text-[11px] font-medium ring-1',
            isOrigin
              ? 'ring-primary/30 bg-primary/5 text-primary'
              : 'ring-warning/30 bg-warning/5 text-warning'
          )}
        >
          {isOrigin
            ? t('subscription.nodeOrder.typeOrigin')
            : t('subscription.nodeOrder.typeForward')}
        </span>
        {entry.scope && (
          <span className="text-[11px] text-muted-foreground/60">
            {entry.scope === 'user'
              ? t('subscription.nodeOrder.scopeUser')
              : t('subscription.nodeOrder.scopeSystem')}
          </span>
        )}
      </div>

      <span className="shrink-0 w-10 pt-0.5 text-right text-[11px] tabular-nums text-muted-foreground/40">
        {entry.sortOrder}
      </span>
    </div>
  );
};

export interface SubscriptionNodeOrderListProps {
  /** Subscription SID (sub_xxx), null disables loading */
  subscriptionId: string | null;
  enabled?: boolean;
  className?: string;
}

export const SubscriptionNodeOrderList = ({
  subscriptionId,
  enabled = true,
  className,
}: SubscriptionNodeOrderListProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<SubscriptionNodeMode>('all');
  const { items, status, isLoading, isFetching } = useSubscriptionNodeOrder({
    subscriptionId,
    mode,
    enabled,
  });

  const statusConfig = status ? SUBSCRIPTION_STATUS_CONFIG[status] : undefined;
  // Only active subscriptions deliver nodes, so an empty list needs the status to explain it
  const inactiveNotice = items.length === 0 && status && status !== 'active';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground/60">{t('subscription.nodeOrder.hint')}</p>
        {isFetching && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground/60" />
        )}
      </div>

      <div className="flex items-center gap-1">
        {MODES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-medium ring-1 transition-colors',
              mode === value
                ? 'ring-primary/30 bg-primary/10 text-primary'
                : 'ring-border/60 text-muted-foreground hover:bg-muted/60'
            )}
          >
            {t(MODE_LABEL_KEYS[value])}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <ListOrdered className="size-7 mb-2 text-muted-foreground/60" />
          <p className="text-[13px]">{t('subscription.nodeOrder.empty')}</p>
          {inactiveNotice && (
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              {t('subscription.nodeOrder.inactiveHint', {
                status: statusConfig ? t(statusConfig.labelKey) : status,
              })}
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground/60">
            {t('subscription.nodeOrder.total', { count: items.length })}
          </p>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
            {items.map((entry) => (
              <EntryRow key={entryKey(entry)} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
