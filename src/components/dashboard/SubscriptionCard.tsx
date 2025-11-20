/**
 * 用户订阅卡片
 * 显示用户当前订阅信息
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';

/**
 * 获取订阅状态的显示配置
 */
const getStatusConfig = (subscription: Subscription) => {
  if (subscription.IsExpired) {
    return {
      label: '已过期',
      variant: 'destructive' as const,
      icon: <XCircle className="size-4" />,
    };
  }

  if (!subscription.IsActive) {
    return {
      label: '未激活',
      variant: 'secondary' as const,
      icon: <Info className="size-4" />,
    };
  }

  switch (subscription.Status) {
    case 'active':
      return {
        label: '激活中',
        variant: 'default' as const,
        icon: <CheckCircle className="size-4" />,
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
    default:
      return {
        label: subscription.Status,
        variant: 'secondary' as const,
        icon: <Info className="size-4" />,
      };
  }
};

/**
 * 格式化日期显示
 */
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 格式化价格显示
 */
const formatPrice = (price?: number, currency?: string) => {
  if (price === undefined) return '-';
  const formattedPrice = (price / 100).toFixed(2);
  const currencySymbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency || '';
  return `${currencySymbol}${formattedPrice}`;
};

export const SubscriptionCard = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false); // 是否显示全部订阅

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取用户的所有订阅
        const result = await getSubscriptions({ page: 1, page_size: 100 });

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

  // 加载中状态
  if (loading) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">我的订阅</h3>
          <div className="flex justify-center py-8">
            <Skeleton className="size-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">我的订阅</h3>
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 无订阅状态
  if (subscriptions.length === 0) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">我的订阅</h3>
          <div className="py-6 space-y-4 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted">
              <CreditCard className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground mb-4">您还没有任何订阅</p>
              <Button variant="default" className="w-full" asChild>
                <a href="/pricing">查看订阅计划</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 有订阅数据 - 显示折叠列表
  // 分离激活和非激活的订阅
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.IsActive && !sub.IsExpired
  );
  const inactiveSubscriptions = subscriptions.filter(
    (sub) => !sub.IsActive || sub.IsExpired
  );

  // 决定显示哪些订阅
  const displaySubscriptions = showAll ? subscriptions : activeSubscriptions;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">我的订阅</h3>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
              {activeSubscriptions.length}
            </Badge>
            {inactiveSubscriptions.length > 0 && (
              <Badge variant="secondary">{inactiveSubscriptions.length}</Badge>
            )}
          </div>
        </div>

        {/* 显示激活订阅或全部订阅 */}
        {displaySubscriptions.length === 0 ? (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              {showAll ? '没有订阅' : '没有激活的订阅'}
            </AlertDescription>
          </Alert>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {displaySubscriptions.map((subscription, index) => {
              const statusConfig = getStatusConfig(subscription);
              const isActive = subscription.IsActive && !subscription.IsExpired;

              return (
                <AccordionItem
                  key={subscription.ID}
                  value={`item-${index}`}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    isActive
                      ? 'border-green-500/50 bg-green-50 dark:bg-green-950/30 shadow-sm'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* 折叠头部 - 简要信息 */}
                  <AccordionTrigger className="px-5 hover:no-underline group">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-semibold text-left">
                        {subscription.Plan?.Name || '未知计划'}
                      </span>
                      <div className="flex items-center gap-2">
                        {statusConfig.icon}
                        <span className="text-sm font-medium">
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* 折叠内容 - 详细信息 */}
                  <AccordionContent className="px-5 pb-5">
                    <div className="space-y-3 pt-3">
                      {/* 价格 */}
                      {subscription.Plan?.Price !== undefined && (
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/80">
                          <span className="text-sm text-muted-foreground">价格</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatPrice(subscription.Plan.Price, subscription.Plan.Currency)}
                          </span>
                        </div>
                      )}

                      {/* 自动续费 */}
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/80">
                        <span className="text-sm text-muted-foreground">自动续费</span>
                        <Badge
                          variant={subscription.AutoRenew ? 'default' : 'outline'}
                          className={subscription.AutoRenew ? 'bg-green-600 hover:bg-green-600' : ''}
                        >
                          {subscription.AutoRenew ? '已开启' : '已关闭'}
                        </Badge>
                      </div>

                      {/* 开始日期 */}
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/80">
                        <span className="text-sm text-muted-foreground">开始日期</span>
                        <span className="text-sm font-medium text-foreground">
                          {formatDate(subscription.StartDate)}
                        </span>
                      </div>

                      {/* 到期日期 */}
                      {subscription.EndDate && (
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/80">
                          <span className="text-sm text-muted-foreground">到期日期</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(subscription.EndDate)}
                          </span>
                        </div>
                      )}

                      {/* 当前计费周期 */}
                      {subscription.CurrentPeriodEnd && isActive && (
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/80">
                          <span className="text-sm text-muted-foreground">下次续费</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(subscription.CurrentPeriodEnd)}
                          </span>
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
          <div className="mt-5 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? '只看激活订阅' : `查看全部订阅 (${subscriptions.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
