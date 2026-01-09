/**
 * User Subscription Detail Page
 * Displays subscription details with tabs for overview, forward rules, and nodes
 * Enhanced with iOS 26 Liquid Glass design, smooth animations, and improved visual hierarchy
 */

import { useMemo, useRef, useEffect, useState } from 'react';
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
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsListRef.current) {
      const activeElement = tabsListRef.current.querySelector('[data-state="active"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

  // Loading state with skeleton - iOS 26 style with glass effect
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-safe">
          {/* Back link skeleton */}
          <div className="h-11 w-11 bg-muted rounded-xl animate-pulse glass" />

          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-7 md:h-8 w-36 md:w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-24 md:w-32 bg-muted rounded animate-pulse" />
          </div>

          {/* Tabs skeleton - horizontal scrollable on mobile */}
          <div className="h-11 md:h-10 w-full md:w-64 bg-muted rounded-full animate-pulse glass" />

          {/* Content skeleton - responsive */}
          <div className="space-y-3 md:space-y-4">
            <div className="h-40 md:h-48 bg-muted rounded-2xl animate-pulse glass" />
            <div className="h-28 md:h-32 bg-muted rounded-xl animate-pulse glass" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state - iOS 26 style with glass effect
  if (error || !subscription) {
    return (
      <DashboardLayout>
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-safe">
          {/* Back link - touch-friendly size (44px min) */}
          <Link
            to="/dashboard"
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "min-h-11 min-w-11 px-3 rounded-xl",
              "text-sm text-muted-foreground hover:text-foreground",
              "glass-interactive",
              "transition-all duration-[var(--duration-fast)]",
              "group"
            )}
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>

          {/* Error message - glass card */}
          <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 glass-elevated rounded-2xl">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-5 md:mb-6 ring-1 ring-destructive/20 animate-spring-in">
              <AlertCircle className="size-8 md:size-10 text-destructive" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold mb-2">加载失败</h2>
            <p className="text-sm md:text-base text-muted-foreground text-center max-w-md mb-5 md:mb-6 px-2">
              {error || '无法加载订阅信息，请稍后重试。'}
            </p>
            <Button asChild className="w-full sm:w-auto min-h-11 glass-interactive">
              <Link to="/dashboard">返回首页</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-4 animate-in fade-in duration-300 pb-safe">
        {/* Tabs with integrated header - iOS 26 Liquid Glass style */}
        <Tabs
          defaultValue="overview"
          className="space-y-2 sm:space-y-3 md:space-y-4"
          onValueChange={setActiveTab}
        >
          {/* Header + Tabs - responsive layout */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Header row - compact on mobile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button - touch-friendly */}
              <Link
                to="/dashboard"
                className={cn(
                  "inline-flex items-center justify-center",
                  "size-9 sm:size-10 md:size-9 rounded-xl md:rounded-lg",
                  "text-muted-foreground hover:text-foreground",
                  "glass-interactive",
                  "transition-all duration-[var(--duration-fast)]",
                  "group touch-target"
                )}
                title="返回首页"
              >
                <ArrowLeft className="size-4 sm:size-5 md:size-4 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                {subscription.plan?.name || '订阅详情'}
              </h1>
            </div>

            {/* Tabs - horizontal scrollable on mobile with glass effect */}
            <div
              ref={tabsListRef}
              className={cn(
                "overflow-x-auto scrollbar-hide",
                "-mx-4 px-4 md:mx-0 md:px-0" // Full bleed on mobile
              )}
            >
              <TabsList
                className={cn(
                  "h-9 sm:h-10 md:h-9 p-0.5 sm:p-1",
                  "glass-tabbar",
                  "inline-flex w-auto min-w-full md:min-w-0",
                  "transition-all duration-[var(--duration-normal)]"
                )}
              >
                <TabsTrigger
                  value="overview"
                  className={cn(
                    "gap-1 sm:gap-1.5 px-3 sm:px-4 md:px-3 h-8 sm:h-8 md:h-7",
                    "text-xs sm:text-sm md:text-xs font-medium",
                    "rounded-full transition-all duration-[var(--duration-fast)]",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                    "touch-target min-w-[40px]"
                  )}
                >
                  <LayoutDashboard className="size-3.5 sm:size-4 md:size-3.5" />
                  <span>概览</span>
                </TabsTrigger>
                {showForwardTabs && (
                  <>
                    <TabsTrigger
                      value="forward-rules"
                      className={cn(
                        "gap-1 sm:gap-1.5 px-3 sm:px-4 md:px-3 h-8 sm:h-8 md:h-7",
                        "text-xs sm:text-sm md:text-xs font-medium",
                        "rounded-full transition-all duration-[var(--duration-fast)]",
                        "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                        "touch-target min-w-[40px]"
                      )}
                    >
                      <ArrowRightLeft className="size-3.5 sm:size-4 md:size-3.5" />
                      <span>转发</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="nodes"
                      className={cn(
                        "gap-1 sm:gap-1.5 px-3 sm:px-4 md:px-3 h-8 sm:h-8 md:h-7",
                        "text-xs sm:text-sm md:text-xs font-medium",
                        "rounded-full transition-all duration-[var(--duration-fast)]",
                        "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                        "touch-target min-w-[40px]"
                      )}
                    >
                      <Server className="size-3.5 sm:size-4 md:size-3.5" />
                      <span>节点</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="animate-in fade-in slide-in-from-left-2 duration-300 mt-0"
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
              className="animate-in fade-in slide-in-from-left-2 duration-300 mt-0"
            >
              <SubscriptionForwardRulesSection subscriptionId={subscriptionId} />
            </TabsContent>
          )}

          {/* Nodes Tab */}
          {showForwardTabs && (
            <TabsContent
              value="nodes"
              className="animate-in fade-in slide-in-from-left-2 duration-300 mt-0"
            >
              <SubscriptionNodeList subscriptionId={subscriptionId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
