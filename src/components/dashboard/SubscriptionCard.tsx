/**
 * User Subscription Card
 * Displays user's current subscription info, unified style with DashboardPage
 */

import { useState } from 'react';
import {
  XCircle,
  CreditCard,
  Link2,
  Copy,
  Check,
  Upload,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getButtonClass, getBadgeClass } from '@/lib/ui-styles';
import { getSubscription, resetSubscriptionLink } from '@/api/subscription';
import type { DashboardSubscription } from '@/api/user/types';
import { cn } from '@/lib/utils';

interface SubscriptionCardProps {
  subscriptions: DashboardSubscription[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Format bytes to readable traffic units
 */
const formatTraffic = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = (bytes / Math.pow(k, i)).toFixed(1);
  return { value, unit: units[i] };
};

/**
 * Get subscription status display configuration
 */
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return { label: '激活中', variant: 'success' as const };
    case 'expired':
      return { label: '已过期', variant: 'destructive' as const };
    case 'cancelled':
      return { label: '已取消', variant: 'outline' as const };
    case 'pending':
      return { label: '待处理', variant: 'secondary' as const };
    case 'renewed':
      return { label: '已续费', variant: 'success' as const };
    default:
      return { label: status, variant: 'secondary' as const };
  }
};

/**
 * Format date for display
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Calculate remaining days
 */
const getDaysRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * Subscription link types
 */
const SUBSCRIPTION_LINK_TYPES = [
  { name: 'Base64', path: '' },
  { name: 'Clash', path: '/clash' },
  { name: 'V2Ray', path: '/v2ray' },
  { name: 'SIP008', path: '/sip008' },
  { name: 'Surge', path: '/surge' },
];

/**
 * Copy button component
 */
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      title={copied ? '已复制' : '复制'}
    >
      {copied ? (
        <Check className="size-4 text-emerald-500" />
      ) : (
        <Copy className="size-4 text-muted-foreground" />
      )}
    </button>
  );
};

export const SubscriptionCard = ({ subscriptions, isLoading, error }: SubscriptionCardProps) => {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subscribeUrls, setSubscribeUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [resettingLinks, setResettingLinks] = useState<Record<string, boolean>>({});

  // Load subscription URL when expanding
  const handleExpand = async (subscriptionId: string) => {
    if (expandedId === subscriptionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(subscriptionId);

    // Already loaded
    if (subscribeUrls[subscriptionId]) return;

    // Fetch subscription details to get subscribeUrl
    setLoadingUrls((prev) => ({ ...prev, [subscriptionId]: true }));
    try {
      const subscription = await getSubscription(subscriptionId);
      setSubscribeUrls((prev) => ({ ...prev, [subscriptionId]: subscription.subscribeUrl }));
    } catch {
      // Failed to load subscription URL
    } finally {
      setLoadingUrls((prev) => ({ ...prev, [subscriptionId]: false }));
    }
  };

  const handleResetLink = async (subscriptionId: string): Promise<void> => {
    if (!confirm('确定要重置订阅链接吗？重置后旧链接将失效。')) {
      return;
    }
    setResettingLinks((prev) => ({ ...prev, [subscriptionId]: true }));
    try {
      const updated = await resetSubscriptionLink(subscriptionId);
      setSubscribeUrls((prev) => ({ ...prev, [subscriptionId]: updated.subscribeUrl }));
    } catch {
      // Reset link failed
    } finally {
      setResettingLinks((prev) => ({ ...prev, [subscriptionId]: false }));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card border transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <CreditCard className="size-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <div className="space-y-3">
          <div className="h-24 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-card border transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
            <XCircle className="size-5 text-destructive" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  // No subscription state
  if (subscriptions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-card border transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-muted ring-1 ring-border">
            <CreditCard className="size-5 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">您还没有任何订阅</p>
          <a href="/pricing" className={getButtonClass('default', 'sm')}>
            查看订阅计划
          </a>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive);
  const inactiveSubscriptions = subscriptions.filter((sub) => !sub.isActive);
  const displaySubscriptions = showAll ? subscriptions : activeSubscriptions;

  return (
    <div className="p-6 rounded-2xl bg-card border transition-shadow hover:shadow-md">
      {/* Title bar - consistent style with hero cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <CreditCard className="size-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={getBadgeClass('success')}>{activeSubscriptions.length} 激活</span>
          {inactiveSubscriptions.length > 0 && (
            <span className={getBadgeClass('secondary')}>{inactiveSubscriptions.length} 其他</span>
          )}
        </div>
      </div>

      {/* Subscription list */}
      <div className="space-y-3">
        {displaySubscriptions.map((subscription) => {
          const statusConfig = getStatusConfig(subscription.status);
          const isActive = subscription.isActive;
          const isExpanded = expandedId === subscription.id;
          const usage = subscription.usage;
          const limits = subscription.plan?.limits as { trafficLimit?: number } | undefined;
          const trafficLimit = limits?.trafficLimit ?? 0;
          const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);
          const usagePercent = trafficLimit > 0 ? (usage.total / trafficLimit) * 100 : 0;
          const subscribeUrl = subscribeUrls[subscription.id];
          const isLoadingUrl = loadingUrls[subscription.id];

          return (
            <div
              key={subscription.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border/50'
              )}
            >
              {/* Subscription main info */}
              <div className="p-4">
                {/* Row 1: Plan name + status */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{subscription.plan?.name || '未知计划'}</h4>
                  <span className={getBadgeClass(statusConfig.variant)}>{statusConfig.label}</span>
                </div>

                {/* Row 2: Traffic usage (active subscriptions only) */}
                {isActive && (
                  <div className="mb-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            usagePercent > 90
                              ? 'bg-destructive'
                              : usagePercent > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                        {usagePercent.toFixed(0)}%
                      </span>
                    </div>

                    {/* Traffic values */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Upload className="size-3" />
                          {formatTraffic(usage.upload).value} {formatTraffic(usage.upload).unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="size-3" />
                          {formatTraffic(usage.download).value} {formatTraffic(usage.download).unit}
                        </span>
                      </div>
                      <span className="font-mono">
                        {formatTraffic(usage.total).value} {formatTraffic(usage.total).unit}
                        {trafficLimit > 0 && (
                          <span className="text-muted-foreground/60">
                            {' / '}{formatTraffic(trafficLimit).value} {formatTraffic(trafficLimit).unit}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Row 3: Time info + expand button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isActive ? (
                      <>
                        <Clock className="size-3" />
                        <span>剩余 {daysRemaining ?? '-'} 天</span>
                        <span className="mx-1">·</span>
                        <Calendar className="size-3" />
                        <span>{formatDate(subscription.currentPeriodEnd)} 到期</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="size-3" />
                        <span>到期日期：{formatDate(subscription.currentPeriodEnd)}</span>
                      </>
                    )}
                  </div>

                  {isActive && (
                    <button
                      onClick={() => handleExpand(subscription.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {isExpanded ? (
                        <>收起 <ChevronUp className="size-3" /></>
                      ) : (
                        <>订阅链接 <ChevronDown className="size-3" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded subscription links */}
              {isExpanded && isActive && (
                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="size-4" />
                      <span>订阅链接</span>
                    </div>
                    <button
                      onClick={() => handleResetLink(subscription.id)}
                      disabled={resettingLinks[subscription.id] || isLoadingUrl}
                      className={getButtonClass('outline', 'sm', 'h-7 text-xs gap-1')}
                    >
                      <RefreshCw className={cn('size-3', resettingLinks[subscription.id] && 'animate-spin')} />
                      {resettingLinks[subscription.id] ? '重置中...' : '重置链接'}
                    </button>
                  </div>

                  {isLoadingUrl ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin mr-2" />
                      <span className="text-sm">加载中...</span>
                    </div>
                  ) : subscribeUrl ? (
                    <div className="space-y-2">
                      {SUBSCRIPTION_LINK_TYPES.map((type) => {
                        const url = `${subscribeUrl}${type.path}`;
                        return (
                          <div
                            key={type.name}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                          >
                            <span className="text-xs font-medium w-14">{type.name}</span>
                            <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                              {url}
                            </span>
                            <CopyButton text={url} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      无法加载订阅链接
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {inactiveSubscriptions.length > 0 && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:underline"
          >
            {showAll ? '只看激活订阅' : `显示全部 (${subscriptions.length})`}
          </button>
        </div>
      )}
    </div>
  );
};
