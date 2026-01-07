/**
 * User Subscription Detail Page
 * Displays subscription details with tabs for overview, forward rules, and nodes
 * Enhanced with modern UI, smooth animations, and improved visual hierarchy
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, AlertCircle, LayoutDashboard, ArrowRightLeft, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { usePageTitle } from '@/shared/hooks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { Button } from '@/components/common/Button';
import {
  useUserSubscription,
  SubscriptionOverviewTab,
  SubscriptionNodeList,
} from '@/features/user-subscription';
import { SubscriptionForwardRulesSection } from '@/features/subscription-forward-rules';

export const UserSubscriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const subscriptionId = id || '';

  const {
    subscription,
    isLoading,
    error,
    resetLink,
    isResettingLink,
  } = useUserSubscription(subscriptionId);

  // Determine which tabs to show based on plan type
  const planType = subscription?.plan?.planType;
  const showForwardTabs = planType === 'forward' || planType === 'hybrid';

  // Set page title
  const pageTitle = useMemo(() => {
    if (isLoading) return '订阅详情';
    if (subscription?.plan?.name) return subscription.plan.name;
    return '订阅详情';
  }, [isLoading, subscription?.plan?.name]);

  usePageTitle(pageTitle);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Back link skeleton */}
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />

          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>

          {/* Tabs skeleton */}
          <div className="h-10 w-64 bg-muted rounded-lg animate-pulse" />

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !subscription) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Back link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            返回首页
          </Link>

          {/* Error message */}
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-6 ring-1 ring-destructive/20">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">加载失败</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {error || '无法加载订阅信息，请稍后重试。'}
            </p>
            <Button asChild>
              <Link to="/dashboard">返回首页</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Tabs with integrated header */}
        <Tabs defaultValue="overview" className="space-y-4">
          {/* Header + Tabs in one row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
                title="返回首页"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <h1 className="text-lg font-semibold text-foreground">
                {subscription.plan?.name || '订阅详情'}
              </h1>
            </div>
            <TabsList className="h-9 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="overview"
                className={cn(
                  "gap-1.5 px-3 h-7 text-xs transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <LayoutDashboard className="size-3.5" />
                <span className="hidden sm:inline">概览</span>
              </TabsTrigger>
              {showForwardTabs && (
                <>
                  <TabsTrigger
                    value="forward-rules"
                    className={cn(
                      "gap-1.5 px-3 h-7 text-xs transition-all duration-200",
                      "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    )}
                  >
                    <ArrowRightLeft className="size-3.5" />
                    <span className="hidden sm:inline">转发规则</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="nodes"
                    className={cn(
                      "gap-1.5 px-3 h-7 text-xs transition-all duration-200",
                      "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    )}
                  >
                    <Server className="size-3.5" />
                    <span className="hidden sm:inline">可用节点</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <SubscriptionOverviewTab
              subscription={subscription}
              onResetLink={resetLink}
              isResettingLink={isResettingLink}
            />
          </TabsContent>

          {/* Forward Rules Tab */}
          {showForwardTabs && (
            <TabsContent
              value="forward-rules"
              className="animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <SubscriptionForwardRulesSection subscriptionId={subscriptionId} />
            </TabsContent>
          )}

          {/* Nodes Tab */}
          {showForwardTabs && (
            <TabsContent
              value="nodes"
              className="animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <SubscriptionNodeList subscriptionId={subscriptionId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
