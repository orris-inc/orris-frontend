/**
 * 用户订阅卡片
 * 显示用户当前订阅信息
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, CreditCard, Link2, Copy, Check, Plus } from 'lucide-react';
import { cardStyles, getButtonClass, getBadgeClass, getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/common/Accordion';
import { listSubscriptions, generateToken } from '@/api/subscription';
import type { Subscription, GenerateTokenResponse } from '@/api/subscription/types';
import { cn } from '@/lib/utils';

/**
 * 获取订阅状态的显示配置
 */
const getStatusConfig = (subscription: Subscription) => {
  switch (subscription.status) {
    case 'active':
      return {
        label: '激活中',
        variant: 'default' as const,
        icon: <CheckCircle className="size-4" />,
      };
    case 'expired':
      return {
        label: '已过期',
        variant: 'destructive' as const,
        icon: <XCircle className="size-4" />,
      };
    case 'cancelled':
      return {
        label: '已取消',
        variant: 'outline' as const,
        icon: <AlertTriangle className="size-4" />,
      };
    case 'pending':
      return {
        label: '待处理',
        variant: 'secondary' as const,
        icon: <Info className="size-4" />,
      };
    case 'renewed':
      return {
        label: '已续费',
        variant: 'default' as const,
        icon: <CheckCircle className="size-4" />,
      };
    default:
      return {
        label: subscription.status,
        variant: 'secondary' as const,
        icon: <Info className="size-4" />,
      };
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
const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={getButtonClass('ghost', 'sm', 'h-8 gap-2')}
    >
      {copied ? (
        <>
          <Check className="size-3" />
          已复制
        </>
      ) : (
        <>
          <Copy className="size-3" />
          复制{label}
        </>
      )}
    </button>
  );
};

export const SubscriptionCard = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false); // 是否显示全部订阅
  const [generatedTokens, setGeneratedTokens] = useState<Record<number, GenerateTokenResponse>>({}); // 存储每个订阅生成的token
  const [generatingTokens, setGeneratingTokens] = useState<Record<number, boolean>>({}); // 存储token生成状态

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取用户的所有订阅
        const result = await listSubscriptions({ page: 1, pageSize: 100 });

        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);
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

  // 生成订阅token
  const handleGenerateToken = async (subscriptionId: number): Promise<void> => {
    setGeneratingTokens((prev) => ({ ...prev, [subscriptionId]: true }));

    try {
      // 使用用户端API生成订阅令牌
      const token = await generateToken(subscriptionId, {
        name: 'Default token',
        scope: 'full',
      });
      console.log('生成的token数据:', token);
      setGeneratedTokens((prev) => ({ ...prev, [subscriptionId]: token }));
    } catch (err) {
      console.error('生成订阅令牌失败:', err);
      alert('生成订阅链接失败，请稍后重试');
    } finally {
      setGeneratingTokens((prev) => ({ ...prev, [subscriptionId]: false }));
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div className={cardStyles}>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-6">我的订阅</h3>
          <div className="flex justify-center py-12">
            <Skeleton className="size-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={cardStyles}>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-6">我的订阅</h3>
          <div className={getAlertClass('destructive', 'border-none bg-destructive/10')}>
            <XCircle className="size-4" />
            <div className={alertDescriptionStyles}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // 无订阅状态
  if (subscriptions.length === 0) {
    return (
      <div className={cardStyles}>
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-6">我的订阅</h3>
          <div className="py-12 space-y-6 text-center">
            <div className="inline-flex items-center justify-center size-20 rounded-full bg-muted/50">
              <CreditCard className="size-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground mb-6">您还没有任何订阅</p>
              <a href="/pricing" className={getButtonClass('default', 'lg', 'rounded-xl')}>
                查看订阅计划
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 有订阅数据 - 显示折叠列表
  // 分离激活和非激活的订阅
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active"
  );
  const inactiveSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "active"
  );

  // 决定显示哪些订阅
  const displaySubscriptions = showAll ? subscriptions : activeSubscriptions;

  return (
    <div className={cardStyles}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">我的订阅</h3>
          <div className="flex items-center gap-2">
            <span className={getBadgeClass('success', 'px-3 py-1')}>
              {activeSubscriptions.length}
            </span>
            {inactiveSubscriptions.length > 0 && (
              <span className={getBadgeClass('secondary', 'px-3 py-1')}>{inactiveSubscriptions.length}</span>
            )}
          </div>
        </div>

        {/* 显示激活订阅或全部订阅 */}
        {displaySubscriptions.length === 0 ? (
          <div className={getAlertClass('default', 'border-none bg-muted/50')}>
            <Info className="size-4" />
            <div className={alertDescriptionStyles}>
              {showAll ? '没有订阅' : '没有激活的订阅'}
            </div>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="space-y-4"
          >
            {displaySubscriptions.map((subscription, index) => {
              const statusConfig = getStatusConfig(subscription);
              const isActive = subscription.status === "active";

              return (
                <AccordionItem
                  key={subscription.id}
                  value={`item-${index}`}
                  className={cn(
                    'border-0 rounded-2xl overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10'
                      : 'bg-muted/30'
                  )}
                >
                  {/* 折叠头部 - 简要信息 */}
                  <AccordionTrigger className="px-6 py-5 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-semibold text-lg text-left">
                        {subscription.plan?.name || '未知计划'}
                      </span>
                      <span className={getBadgeClass(isActive ? 'success' : 'secondary', 'ml-2 px-3 py-1')}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </AccordionTrigger>

                  {/* 折叠内容 - 详细信息 */}
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4 pt-4">
                      {/* 自动续费 */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background/50">
                        <span className="text-muted-foreground">自动续费</span>
                        <span className={getBadgeClass(subscription.autoRenew ? 'success' : 'outline', 'px-3 py-1')}>
                          {subscription.autoRenew ? '已开启' : '已关闭'}
                        </span>
                      </div>

                      {/* 开始日期 */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background/50">
                        <span className="text-muted-foreground">开始日期</span>
                        <span className="font-medium">{formatDate(subscription.startDate)}</span>
                      </div>

                      {/* 到期日期 */}
                      {subscription.endDate && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background/50">
                          <span className="text-muted-foreground">到期日期</span>
                          <span className="font-medium">{formatDate(subscription.endDate)}</span>
                        </div>
                      )}

                      {/* 当前计费周期 */}
                      {subscription.endDate && isActive && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-background/50">
                          <span className="text-muted-foreground">下次续费</span>
                          <span className="font-medium">{formatDate(subscription.endDate)}</span>
                        </div>
                      )}

                      {/* 订阅链接 */}
                      {isActive && (
                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Link2 className="size-4" />
                              <span className="font-medium">订阅链接</span>
                            </div>
                            {!generatedTokens[subscription.id] && (
                              <button
                                onClick={() => handleGenerateToken(subscription.id)}
                                disabled={generatingTokens[subscription.id]}
                                className={getButtonClass('outline', 'sm', 'gap-2')}
                              >
                                {generatingTokens[subscription.id] ? (
                                  <>生成中...</>
                                ) : (
                                  <>
                                    <Plus className="size-3" />
                                    生成订阅链接
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {generatingTokens[subscription.id] ? (
                            <div className="py-4 px-4 rounded-xl bg-background/50">
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ) : generatedTokens[subscription.id] ? (
                            <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <span className="font-medium text-sm block">
                                    {generatedTokens[subscription.id].prefix}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Token ID: {generatedTokens[subscription.id].tokenId}
                                  </span>
                                </div>
                                {generatedTokens[subscription.id].expiresAt && (
                                  <span className="text-xs text-muted-foreground">
                                    到期: {formatDate(generatedTokens[subscription.id].expiresAt)}
                                  </span>
                                )}
                              </div>

                              {generatedTokens[subscription.id].token ? (
                                <div className="space-y-2">
                                  {SUBSCRIPTION_LINK_TYPES.map((type) => {
                                    const baseUrl = getApiBaseUrl();
                                    const url = `${baseUrl}/sub/${generatedTokens[subscription.id].token}${type.path}`;
                                    return (
                                      <div
                                        key={type.name}
                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs text-muted-foreground mb-1">
                                            {type.name}
                                          </div>
                                          <div className="text-xs font-mono truncate">
                                            {url}
                                          </div>
                                        </div>
                                        <CopyButton text={url} label={type.name} />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className={getAlertClass('default', 'border-none bg-amber-50/50 dark:bg-amber-950/20')}>
                                  <Info className="size-4 text-amber-600" />
                                  <div className={cn(alertDescriptionStyles, 'text-xs text-amber-800 dark:text-amber-200')}>
                                    token字段为空，请检查后端API实现
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={getAlertClass('default', 'border-none bg-muted/50')}>
                              <Info className="size-4" />
                              <div className={cn(alertDescriptionStyles, 'text-sm')}>
                                点击"生成订阅链接"按钮创建您的订阅链接
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* 切换显示全部/仅激活 */}
        {inactiveSubscriptions.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className={getButtonClass('ghost', 'sm', 'text-primary')}
            >
              {showAll ? '只看激活订阅' : `查看全部订阅 (${subscriptions.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
