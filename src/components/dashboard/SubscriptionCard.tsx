/**
 * 用户订阅卡片
 * 显示用户当前订阅信息，与 DashboardPage 风格统一
 */

import { useEffect, useState } from 'react';
import {
  XCircle,
  CreditCard,
  Link2,
  Copy,
  Check,
  Plus,
  Upload,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { getButtonClass, getBadgeClass } from '@/lib/ui-styles';
import { Skeleton } from '@/components/common/Skeleton';
import { listSubscriptions, generateToken, getTrafficStats } from '@/api/subscription';
import type { Subscription, GenerateTokenResponse, TrafficSummary } from '@/api/subscription/types';
import { cn } from '@/lib/utils';

/**
 * 格式化字节数为可读的流量单位
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
 * 获取本月的起止时间
 */
const getMonthRange = (): { from: string; to: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    from: firstDay.toISOString(),
    to: lastDay.toISOString(),
  };
};

/**
 * 获取订阅状态的显示配置
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
 * 格式化日期显示
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
 * 计算剩余天数
 */
const getDaysRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/**
 * 获取API基础URL
 */
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
};

/**
 * 订阅链接类型
 */
const SUBSCRIPTION_LINK_TYPES = [
  { name: 'Base64', path: '' },
  { name: 'Clash', path: '/clash' },
  { name: 'V2Ray', path: '/v2ray' },
  { name: 'SIP008', path: '/sip008' },
  { name: 'Surge', path: '/surge' },
];

/**
 * 复制按钮组件
 */
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
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

/** 订阅流量数据 */
interface SubscriptionTraffic {
  summary: TrafficSummary;
  limit: number;
}

export const SubscriptionCard = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [generatedTokens, setGeneratedTokens] = useState<Record<number, GenerateTokenResponse>>({});
  const [generatingTokens, setGeneratingTokens] = useState<Record<number, boolean>>({});
  const [trafficData, setTrafficData] = useState<Record<number, SubscriptionTraffic>>({});

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await listSubscriptions({ page: 1, pageSize: 100 });

        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);

          const { from, to } = getMonthRange();
          const activeSubscriptions = result.items.filter((sub: Subscription) => sub.status === 'active');

          const trafficPromises = activeSubscriptions.map(async (sub) => {
            try {
              const traffic = await getTrafficStats(sub.id, { from, to });
              const limits = sub.plan?.limits as { trafficLimit?: number } | undefined;
              return {
                id: sub.id,
                data: {
                  summary: traffic.summary,
                  limit: limits?.trafficLimit || 0,
                },
              };
            } catch {
              return { id: sub.id, data: null };
            }
          });

          const results = await Promise.all(trafficPromises);
          const trafficMap: Record<number, SubscriptionTraffic> = {};
          results.forEach((r) => {
            if (r.data) {
              trafficMap[r.id] = r.data;
            }
          });
          setTrafficData(trafficMap);
        } else {
          setSubscriptions([]);
        }
      } catch (err) {
        console.error('获取订阅信息失败:', err);
        setError('加载订阅信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleGenerateToken = async (subscriptionId: number): Promise<void> => {
    setGeneratingTokens((prev) => ({ ...prev, [subscriptionId]: true }));
    try {
      const token = await generateToken(subscriptionId, {
        name: 'Default token',
        scope: 'full',
      });
      setGeneratedTokens((prev) => ({ ...prev, [subscriptionId]: token }));
    } catch (err) {
      console.error('生成订阅令牌失败:', err);
    } finally {
      setGeneratingTokens((prev) => ({ ...prev, [subscriptionId]: false }));
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-5 rounded-xl bg-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <span className="text-sm text-muted-foreground">我的订阅</span>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  // 无订阅状态
  if (subscriptions.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
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

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const inactiveSubscriptions = subscriptions.filter((sub) => sub.status !== 'active');
  const displaySubscriptions = showAll ? subscriptions : activeSubscriptions;

  return (
    <div className="p-5 rounded-xl bg-card border">
      {/* 标题栏 - 与统计卡片风格一致 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
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

      {/* 订阅列表 */}
      <div className="space-y-3">
        {displaySubscriptions.map((subscription) => {
          const statusConfig = getStatusConfig(subscription.status);
          const isActive = subscription.status === 'active';
          const isExpanded = expandedId === subscription.id;
          const traffic = trafficData[subscription.id];
          const daysRemaining = getDaysRemaining(subscription.endDate);
          const usagePercent = traffic?.limit > 0 ? (traffic.summary.total / traffic.limit) * 100 : 0;

          return (
            <div
              key={subscription.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all',
                isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border/50'
              )}
            >
              {/* 订阅主要信息 */}
              <div className="p-4">
                {/* 第一行：套餐名称 + 状态 */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{subscription.plan?.name || '未知计划'}</h4>
                  <span className={getBadgeClass(statusConfig.variant)}>{statusConfig.label}</span>
                </div>

                {/* 第二行：流量使用（仅活跃订阅） */}
                {isActive && traffic && (
                  <div className="mb-3">
                    {/* 进度条 */}
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

                    {/* 流量数值 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Upload className="size-3" />
                          {formatTraffic(traffic.summary.totalUpload).value} {formatTraffic(traffic.summary.totalUpload).unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="size-3" />
                          {formatTraffic(traffic.summary.totalDownload).value} {formatTraffic(traffic.summary.totalDownload).unit}
                        </span>
                      </div>
                      <span className="font-mono">
                        {formatTraffic(traffic.summary.total).value} {formatTraffic(traffic.summary.total).unit}
                        {traffic.limit > 0 && (
                          <span className="text-muted-foreground/60">
                            {' / '}{formatTraffic(traffic.limit).value} {formatTraffic(traffic.limit).unit}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* 第三行：时间信息 + 展开按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isActive ? (
                      <>
                        <Clock className="size-3" />
                        <span>剩余 {daysRemaining ?? '-'} 天</span>
                        <span className="mx-1">·</span>
                        <Calendar className="size-3" />
                        <span>{formatDate(subscription.endDate)} 到期</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="size-3" />
                        <span>到期日期：{formatDate(subscription.endDate)}</span>
                      </>
                    )}
                  </div>

                  {isActive && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : subscription.id)}
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

              {/* 展开的订阅链接 */}
              {isExpanded && isActive && (
                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="size-4" />
                      <span>订阅链接</span>
                    </div>
                    {!generatedTokens[subscription.id] && (
                      <button
                        onClick={() => handleGenerateToken(subscription.id)}
                        disabled={generatingTokens[subscription.id]}
                        className={getButtonClass('outline', 'sm', 'h-7 text-xs gap-1')}
                      >
                        {generatingTokens[subscription.id] ? (
                          '生成中...'
                        ) : (
                          <>
                            <Plus className="size-3" />
                            生成链接
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {generatingTokens[subscription.id] && (
                    <Skeleton className="h-16 w-full rounded-lg" />
                  )}

                  {generatedTokens[subscription.id]?.token && (
                    <div className="space-y-2">
                      {SUBSCRIPTION_LINK_TYPES.map((type) => {
                        const baseUrl = getApiBaseUrl();
                        const url = `${baseUrl}/sub/${generatedTokens[subscription.id].token}${type.path}`;
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
                  )}

                  {!generatedTokens[subscription.id] && !generatingTokens[subscription.id] && (
                    <p className="text-xs text-muted-foreground py-2">
                      点击"生成链接"创建订阅链接
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 显示更多 */}
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
