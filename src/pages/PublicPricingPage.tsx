/**
 * Public Pricing Page
 * Salient-inspired design for visitors
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe, Check, Loader2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';
import type { SubscriptionPlan, BillingCycle } from '@/api/subscription/types';

// Format price
const formatPrice = (price: number, currency: string) => {
  const symbol = currency === 'CNY' ? '¥' : '$';
  const amount = price / 100;
  // Remove decimals if whole number
  return `${symbol}${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
};

interface PricingCardProps {
  plan: SubscriptionPlan;
  featured?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  featured = false,
  onSelect,
}) => {
  const { t } = useTranslation();

  // Billing cycle labels using i18n
  const getBillingCycleLabel = (cycle: BillingCycle): string => {
    const labels: Record<BillingCycle, string> = {
      weekly: t('pricing.perWeek'),
      monthly: t('pricing.perMonth'),
      quarterly: t('pricing.perQuarter'),
      semi_annual: t('pricing.perHalfYear'),
      yearly: t('pricing.perYear'),
      lifetime: t('pricing.lifetime'),
    };
    return labels[cycle];
  };

  // Get primary pricing (first active one)
  const primaryPricing = plan.pricings?.find((p) => p.isActive) || plan.pricings?.[0];

  // Build features list using i18n
  const features: string[] = [];
  if (plan.nodeLimit && plan.nodeLimit > 0) {
    features.push(
      plan.nodeLimit === 1
        ? t('pricing.features.oneNode')
        : t('pricing.features.nodes', { count: plan.nodeLimit })
    );
  }
  if (plan.trialDays > 0) {
    features.push(t('pricing.features.trialDays', { count: plan.trialDays }));
  }
  // Add description as a feature if exists
  if (plan.description) {
    features.unshift(plan.description);
  }

  return (
    <section
      className={cn(
        'flex flex-col rounded-3xl px-6 py-8 sm:px-8',
        featured
          ? 'order-first bg-primary lg:order-none'
          : 'bg-slate-50 dark:bg-slate-900/50'
      )}
    >
      {/* Plan name */}
      <h3
        className={cn(
          'text-lg font-semibold',
          featured ? 'text-white' : 'text-foreground'
        )}
      >
        {plan.name}
      </h3>

      {/* Price */}
      <p className="mt-5 flex items-baseline">
        {primaryPricing ? (
          <>
            <span
              className={cn(
                'text-5xl font-light tracking-tight',
                featured ? 'text-white' : 'text-foreground'
              )}
            >
              {formatPrice(primaryPricing.price, primaryPricing.currency)}
            </span>
            <span
              className={cn(
                'ml-1 text-sm font-medium',
                featured ? 'text-white/70' : 'text-muted-foreground'
              )}
            >
              {getBillingCycleLabel(primaryPricing.billingCycle)}
            </span>
          </>
        ) : (
          <span
            className={cn(
              'text-2xl font-semibold',
              featured ? 'text-white' : 'text-foreground'
            )}
          >
            {t('pricing.contactUs')}
          </span>
        )}
      </p>

      {/* Short description */}
      <p
        className={cn(
          'mt-3 text-sm',
          featured ? 'text-white/80' : 'text-muted-foreground'
        )}
      >
        {featured
          ? t('pricing.features.featuredDesc')
          : plan.description || t('pricing.features.defaultDesc')}
      </p>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan)}
        className={cn(
          'mt-6 inline-flex items-center justify-center rounded-full py-2.5 px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          featured
            ? 'bg-white text-primary hover:bg-white/90 focus-visible:ring-white'
            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 focus-visible:ring-slate-900'
        )}
      >
        {t('pricing.getStarted')}
      </button>

      {/* Features */}
      <ul
        className={cn(
          'mt-8 flex flex-col gap-y-3 text-sm',
          featured ? 'text-white' : 'text-muted-foreground'
        )}
      >
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check
              className={cn(
                'size-5 flex-none mr-3',
                featured ? 'text-white' : 'text-slate-400'
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const PublicPricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { publicPlans, isLoading: plansLoading } = usePublicPlans();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation links for public pages
  const navLinks = [
    { href: '/#features', label: t('landing.nav.features'), isRoute: true },
    { href: '/#how-it-works', label: t('landing.nav.howItWorks'), isRoute: true },
    { href: '/pricing', label: t('landing.nav.pricing'), isRoute: true, active: true },
  ];

  // Redirect authenticated users to dashboard pricing
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard/pricing', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle plan selection
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (isAuthenticated) {
      navigate('/dashboard/pricing');
      return;
    }
    const searchParams = new URLSearchParams({
      plan: plan.id,
      redirect: '/dashboard/pricing',
    });
    navigate(`/login?${searchParams.toString()}`);
  };

  // Find featured plan (middle tier)
  const featuredPlanIndex = Math.floor(publicPlans.length / 2);
  const featuredPlanId = publicPlans[featuredPlanIndex]?.id;

  return (
    <div className="min-h-viewport bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Orris</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm transition-colors',
                    link.active
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('landing.nav.signIn')}
              </Link>
              <Link
                to="/register"
                className={cn(
                  'inline-flex items-center justify-center h-9 px-4 rounded-full',
                  'text-sm font-medium',
                  'bg-foreground text-background',
                  'hover:bg-foreground/90 transition-colors'
                )}
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('landing.nav.signIn')}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors -mr-2"
                aria-label={mobileMenuOpen ? t('landing.nav.closeMenu') : t('landing.nav.openMenu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu - Dropdown style */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="md:hidden py-4 border-t border-border/50"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-3 py-2.5 text-sm transition-colors',
                      link.active
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-border/50 px-3">
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'inline-flex items-center justify-center w-full h-10 rounded-full',
                    'text-sm font-medium',
                    'bg-foreground text-background',
                    'hover:bg-foreground/90 transition-colors'
                  )}
                >
                  {t('landing.nav.getStarted')}
                </Link>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Pricing Section */}
      <section
        id="pricing"
        aria-label="Pricing"
        className="pt-24 pb-20 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:text-center">
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              {t('pricing.publicTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('pricing.publicSubtitle')}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="mt-16">
            {plansLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : publicPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {t('pricing.noPlans')}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  '-mx-4 grid gap-y-10 sm:mx-0 sm:gap-x-8',
                  publicPlans.length === 1 &&
                    'max-w-lg mx-auto lg:max-w-none lg:grid-cols-1',
                  publicPlans.length === 2 &&
                    'max-w-2xl mx-auto lg:max-w-none lg:grid-cols-2',
                  publicPlans.length >= 3 &&
                    'max-w-2xl mx-auto lg:max-w-none lg:grid-cols-3'
                )}
              >
                {publicPlans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    featured={plan.id === featuredPlanId}
                    onSelect={handleSelectPlan}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Orris</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                to="/#features"
                className="hover:text-foreground transition-colors"
              >
                {t('landing.nav.features')}
              </Link>
              <Link
                to="/#how-it-works"
                className="hover:text-foreground transition-colors"
              >
                {t('landing.nav.howItWorks')}
              </Link>
              <Link
                to="/pricing"
                className="hover:text-foreground transition-colors"
              >
                {t('landing.nav.pricing')}
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('landing.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
