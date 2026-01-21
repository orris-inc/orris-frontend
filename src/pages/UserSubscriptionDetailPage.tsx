/**
 * User Subscription Detail Page
 * Displays subscription details with tabs for overview, forward rules, and nodes
 * Enhanced with iOS 26 Liquid Glass design, smooth animations, and improved visual hierarchy
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (isLoading) return t('userSubscription.details');
    if (subscription?.plan?.name) return subscription.plan.name;
    return t('userSubscription.details');
  }, [isLoading, subscription?.plan?.name, t]);

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
              "transition-all duration-fast",
              "group"
            )}
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{t('userSubscription.backToHome')}</span>
          </Link>

          {/* Error message - glass card */}
          <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 glass-elevated rounded-2xl">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-5 md:mb-6 ring-1 ring-destructive/20 animate-spring-in">
              <AlertCircle className="size-8 md:size-10 text-destructive" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold mb-2">{t('userSubscription.loadingFailed')}</h2>
            <p className="text-sm md:text-base text-muted-foreground text-center max-w-md mb-5 md:mb-6 px-2">
              {error || t('userSubscription.unableToLoad')}
            </p>
            <Button asChild className="w-full sm:w-auto min-h-11 glass-interactive">
              <Link to="/dashboard">{t('userSubscription.backToHome')}</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-in fade-in duration-300 pb-safe">
        <Tabs
          defaultValue="overview"
          className="space-y-3"
          onValueChange={setActiveTab}
        >
          {/* Compact Header with Back + Title + Tabs inline */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Back + Title */}
            <div className="flex items-center gap-2 mr-auto">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={t('userSubscription.backToHome')}
              >
                <ArrowLeft className="size-4" />
              </Link>
              <h1 className="text-base font-semibold text-foreground">
                {subscription.plan?.name || t('userSubscription.details')}
              </h1>
            </div>

            {/* Tabs inline */}
            <div ref={tabsListRef} className="overflow-x-auto scrollbar-hide">
              <TabsList className="h-8 p-0.5 bg-muted/50">
                <TabsTrigger
                  value="overview"
                  className="gap-1.5 px-3 h-7 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <LayoutDashboard className="size-3.5" />
                  <span>{t('userSubscription.overview')}</span>
                </TabsTrigger>
                {showForwardTabs && (
                  <>
                    <TabsTrigger
                      value="forward-rules"
                      className="gap-1.5 px-3 h-7 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <ArrowRightLeft className="size-3.5" />
                      <span>{t('userSubscription.forward')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="nodes"
                      className="gap-1.5 px-3 h-7 text-xs font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Server className="size-3.5" />
                      <span>{t('userSubscription.nodes')}</span>
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
