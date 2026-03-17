/**
 * Landing Page - Orris Introduction
 * Tailwind Marketing UI style with bold gradients, bento grid, glass effects
 */

import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Users,
  ArrowRight,
  GitBranch,
  Globe,
  ChevronRight,
  Menu,
  X,
  Github,
  Fingerprint,
  CreditCard,
  Bell,
  Activity,
  ChevronDown,
  HelpCircle,
  Zap,
  Shield,
  Clock,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useVersionInfo } from '@/hooks';
import { usePublicBranding } from '@/features/settings';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Feature card variants for bento grid
interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  className: string; // Tailwind classes for grid placement
}

// Bento Grid Layout (4-column on lg):
// ┌─────────────┬─────────────┐
// │  passkey    │subscriptions│
// │  (2x2)      ├─────────────┤
// │             │  payments   │
// ├──────┬──────┼──────┬──────┤
// │nodes │forward│realtime│notif│
// └──────┴──────┴──────┴──────┘
const featureConfigs: Feature[] = [
  {
    icon: Fingerprint,
    titleKey: 'landing.features.passkey.title',
    descriptionKey: 'landing.features.passkey.description',
    className: 'md:col-span-1 lg:col-span-2 lg:row-span-2', // Featured large card
  },
  {
    icon: Users,
    titleKey: 'landing.features.subscriptions.title',
    descriptionKey: 'landing.features.subscriptions.description',
    className: 'md:col-span-1 lg:col-span-2',
  },
  {
    icon: CreditCard,
    titleKey: 'landing.features.payments.title',
    descriptionKey: 'landing.features.payments.description',
    className: 'md:col-span-1 lg:col-span-2',
  },
  {
    icon: Server,
    titleKey: 'landing.features.nodes.title',
    descriptionKey: 'landing.features.nodes.description',
    className: 'md:col-span-1 lg:col-span-1',
  },
  {
    icon: GitBranch,
    titleKey: 'landing.features.forwarding.title',
    descriptionKey: 'landing.features.forwarding.description',
    className: 'md:col-span-1 lg:col-span-1',
  },
  {
    icon: Activity,
    titleKey: 'landing.features.realtime.title',
    descriptionKey: 'landing.features.realtime.description',
    className: 'md:col-span-1 lg:col-span-1',
  },
  {
    icon: Bell,
    titleKey: 'landing.features.notifications.title',
    descriptionKey: 'landing.features.notifications.description',
    className: 'md:col-span-1 lg:col-span-1',
  },
];

// Stats configuration
interface StatConfig {
  icon: LucideIcon;
  valueKey: string;
  labelKey: string;
}

const statsConfigs: StatConfig[] = [
  {
    icon: Layers,
    valueKey: 'landing.stats.ruleTypes.value',
    labelKey: 'landing.stats.ruleTypes.label',
  },
  {
    icon: Shield,
    valueKey: 'landing.stats.protocols.value',
    labelKey: 'landing.stats.protocols.label',
  },
  {
    icon: Zap,
    valueKey: 'landing.stats.tokenScopes.value',
    labelKey: 'landing.stats.tokenScopes.label',
  },
  {
    icon: Clock,
    valueKey: 'landing.stats.realtime.value',
    labelKey: 'landing.stats.realtime.label',
  },
];

// FAQ items
const faqConfigs = [
  {
    questionKey: 'landing.faq.q1.question',
    answerKey: 'landing.faq.q1.answer',
  },
  {
    questionKey: 'landing.faq.q2.question',
    answerKey: 'landing.faq.q2.answer',
  },
  {
    questionKey: 'landing.faq.q3.question',
    answerKey: 'landing.faq.q3.answer',
  },
];

// Track animation state outside component to survive StrictMode remounts
const animatedSections = new Set<string>();

// Navigation links for landing page
const navLinkConfigs = [
  { href: '#features', labelKey: 'landing.nav.features' },
  { href: '#faq', labelKey: 'landing.nav.faq' },
  { href: '/pricing', labelKey: 'landing.nav.pricing', isRoute: true },
];

// Feature Card Component for Bento Grid
const FeatureCard = ({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) => {
  const { t } = useTranslation();
  const Icon = feature.icon;
  const isLarge = feature.className.includes('row-span-2');

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.4, delay: index * 0.08, ease: 'easeOut' },
        },
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={cn(
        feature.className,
        'group relative p-6 rounded-2xl bg-card overflow-hidden',
        'ring-1 ring-border hover:ring-primary/50',
        'cursor-pointer active:scale-[0.98]',
        'transition-[box-shadow,ring-color] duration-300',
        'hover:shadow-lg hover:shadow-primary/5',
        isLarge && 'flex flex-col'
      )}
    >
      {/* Gradient border effect on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'bg-gradient-to-br from-primary/10 via-transparent to-accent/10'
        )}
      />

      <div className={cn('relative z-10', isLarge && 'flex-1 flex flex-col')}>
        {/* Icon with gradient background */}
        <div
          className={cn(
            'rounded-xl mb-4',
            isLarge ? 'size-14' : 'size-12',
            'bg-gradient-to-br from-primary/20 to-primary/5',
            'flex items-center justify-center',
            'group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300'
          )}
        >
          <Icon className={cn(isLarge ? 'size-7' : 'size-6', 'text-primary')} />
        </div>

        <h3 className={cn('font-semibold mb-2', isLarge ? 'text-2xl' : 'text-xl')}>
          {t(feature.titleKey)}
        </h3>
        <p className={cn('text-muted-foreground', isLarge && 'text-base')}>
          {t(feature.descriptionKey)}
        </p>
      </div>
    </motion.div>
  );
};

// FAQ Item component
const FAQItem = ({
  questionKey,
  answerKey,
}: {
  questionKey: string;
  answerKey: string;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        'border-b border-border/50 last:border-b-0',
        'transition-colors duration-200',
        isOpen && 'bg-muted/30'
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between py-5 px-4 text-left',
          'hover:text-primary transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
        )}
      >
        <span className="font-medium pr-4">{t(questionKey)}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 px-4 text-muted-foreground">{t(answerKey)}</p>
      </motion.div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ stat, index }: { stat: StatConfig; index: number }) => {
  const { t } = useTranslation();
  const Icon = stat.icon;

  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, delay: index * 0.1 },
        },
      }}
      className={cn(
        'glass-elevated rounded-2xl p-6 text-center',
        'hover:shadow-lg transition-shadow duration-300'
      )}
    >
      <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 mb-4">
        <Icon className="size-6 text-primary" />
      </div>
      <div className="text-fluid-2xl font-bold text-primary mb-1">
        {t(stat.valueKey)}
      </div>
      <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
    </motion.div>
  );
};

export const LandingPage = () => {
  const { t } = useTranslation();
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(() =>
    animatedSections.has('features')
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { serverVersion, clientVersion } = useVersionInfo();
  const { appName, logoUrl, isLoading: isBrandingLoading } = usePublicBranding();

  const handleFeaturesIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting && !animatedSections.has('features')) {
        animatedSections.add('features');
        setFeaturesVisible(true);
      }
    },
    []
  );

  useEffect(() => {
    const element = featuresRef.current;
    if (!element || animatedSections.has('features')) return;

    const observer = new IntersectionObserver(handleFeaturesIntersect, {
      threshold: 0.2,
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleFeaturesIntersect]);

  // Scroll listener for header glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-viewport bg-background">
      {/* Navigation with glass effect */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          isScrolled
            ? 'glass shadow-sm'
            : 'border-b border-border/50 bg-background/80 backdrop-blur-sm'
        )}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              {isBrandingLoading ? (
                <>
                  <div className="size-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                </>
              ) : (
                <>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={appName || 'Logo'}
                      className="h-8 w-auto"
                    />
                  ) : (
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                      <Globe className="size-5 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-lg font-semibold">
                    {appName || 'Orris'}
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinkConfigs.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(link.labelKey)}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                )
              )}
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
                  'bg-gradient-to-r from-primary to-primary/80',
                  'text-primary-foreground',
                  'hover:opacity-90 active:opacity-80 active:scale-[0.98]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  'transition-all duration-200',
                  'shadow-md shadow-primary/20'
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
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-md -mr-2',
                  'hover:bg-accent active:bg-accent/80',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  'transition-colors'
                )}
                aria-label={
                  mobileMenuOpen
                    ? t('landing.nav.closeMenu')
                    : t('landing.nav.openMenu')
                }
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="md:hidden py-4 border-t border-border/50"
            >
              <nav className="flex flex-col gap-1">
                {navLinkConfigs.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t(link.labelKey)}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t(link.labelKey)}
                    </a>
                  )
                )}
              </nav>
              <div className="mt-4 pt-4 border-t border-border/50 px-3">
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'inline-flex items-center justify-center w-full h-12 rounded-full',
                    'text-base font-medium',
                    'bg-gradient-to-r from-primary to-primary/80',
                    'text-primary-foreground',
                    'hover:opacity-90 active:opacity-80 active:scale-[0.98]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    'transition-all duration-200',
                    'shadow-md shadow-primary/20'
                  )}
                >
                  {t('landing.nav.getStarted')}
                </Link>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-3.5rem)] min-h-[calc(100dvh-3.5rem)] flex flex-col justify-center px-4 py-12 sm:py-16 overflow-hidden">
        {/* Hero gradient background */}
        <div className="absolute inset-0 -z-10 hero-gradient" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 hero-grid" />

        {/* Animated glow orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute top-1/4 left-1/4 size-64 sm:size-80 lg:size-96 rounded-full blur-3xl -z-10"
          style={{
            background:
              'radial-gradient(circle, var(--color-primary-alpha-15) 0%, transparent 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          className="absolute bottom-1/3 right-1/4 size-48 sm:size-64 lg:size-80 rounded-full blur-3xl -z-10"
          style={{
            background:
              'radial-gradient(circle, var(--color-accent-alpha-12) 0%, transparent 70%)',
          }}
        />

        <motion.div
          className="max-w-4xl mx-auto text-center w-full"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Main heading with gradient text */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-fluid-2xl sm:text-fluid-3xl lg:text-fluid-4xl font-bold tracking-tight mb-4 sm:mb-6"
          >
            {t('landing.hero.title')}
            <span className="block text-gradient-primary">
              {t('landing.hero.titleHighlight')}
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-fluid-base sm:text-fluid-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-12 px-2"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
          >
            {/* Primary button with gradient */}
            <Link
              to="/register"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full font-medium',
                'h-12 sm:h-11 px-8 w-full sm:w-auto text-base sm:text-sm',
                'bg-gradient-to-r from-primary via-primary to-primary/80',
                'text-primary-foreground',
                'hover:opacity-90 active:opacity-80 active:scale-[0.98]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'transition-all duration-200',
                'shadow-lg shadow-primary/25',
                'glow-primary-sm'
              )}
            >
              {t('landing.hero.getStarted')}
              <ArrowRight className="size-4" />
            </Link>
            {/* Secondary button with glass effect */}
            <a
              href="#features"
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full font-medium',
                'h-12 sm:h-11 px-8 w-full sm:w-auto text-base sm:text-sm',
                'glass-interactive',
                'hover:bg-accent/50 active:scale-[0.98]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'transition-all duration-200'
              )}
            >
              {t('landing.hero.exploreFeatures')}
              <ChevronRight className="size-4" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="py-20 px-4 bg-muted/30 dark:bg-muted/10">
        <motion.div
          ref={featuresRef}
          className="max-w-6xl mx-auto"
          initial="initial"
          animate={featuresVisible ? 'animate' : 'initial'}
          variants={{
            initial: {},
            animate: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              className="text-fluid-2xl font-bold mb-4"
            >
              {t('landing.features.title')}
            </motion.h2>
          </div>

          {/* Bento Grid: 4-column on lg, 2-column on md, 1-column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(200px,auto)] gap-4 lg:gap-5">
            {featureConfigs.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <motion.div
          className="max-w-4xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-fluid-2xl font-bold text-center mb-12"
          >
            {t('landing.stats.title')}
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statsConfigs.map((stat, index) => (
              <StatCard key={index} stat={stat} index={index} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-6">
                <HelpCircle className="size-8 text-primary" />
              </div>
              <h2 className="text-fluid-2xl font-bold">
                {t('landing.faq.title')}
              </h2>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="glass-elevated rounded-3xl overflow-hidden"
            >
              {faqConfigs.map((faq, index) => (
                <FAQItem
                  key={index}
                  questionKey={faq.questionKey}
                  answerKey={faq.answerKey}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative p-12 md:p-16 rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              background:
                'linear-gradient(135deg, oklch(0.2 0.02 260) 0%, var(--color-primary-darker-90) 50%, oklch(0.2 0.02 260) 100%)',
            }}
          >
            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                                 linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '3rem 3rem',
                maskImage:
                  'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 70%)',
              }}
            />

            {/* Animated glow orbs */}
            <motion.div
              className="absolute top-0 right-0 size-64 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 size-48 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />

            <motion.div
              className="relative z-10 text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="text-fluid-xl sm:text-fluid-2xl font-bold mb-4 text-white"
              >
                {t('landing.cta.title')}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="text-white/80 text-fluid-base sm:text-fluid-lg max-w-xl mx-auto mb-8"
              >
                {t('landing.cta.subtitle')}
              </motion.p>
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0"
              >
                <Link
                  to="/register"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-full font-medium',
                    'w-full sm:w-auto h-12 sm:h-11 px-8 text-base sm:text-sm',
                    'bg-white text-primary',
                    'hover:bg-white/90 active:bg-white/80 active:scale-[0.98]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    'transition-all duration-200',
                    'shadow-lg'
                  )}
                >
                  {t('landing.cta.createAccount')}
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="mailto:support@orris.io"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-full font-medium',
                    'w-full sm:w-auto h-12 sm:h-11 px-8 text-base sm:text-sm',
                    'ring-1 ring-white/30 text-white',
                    'hover:bg-white/10 active:bg-white/20 active:scale-[0.98]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                    'transition-all duration-200'
                  )}
                >
                  {t('landing.cta.contactSupport')}
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo + GitHub */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isBrandingLoading ? (
                  <>
                    <div className="size-8 rounded-lg bg-muted animate-pulse" />
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  </>
                ) : (
                  <>
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={appName || 'Logo'}
                        className="h-8 w-auto"
                      />
                    ) : (
                      <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                        <Globe className="size-5 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-lg font-semibold">
                      {appName || 'Orris'}
                    </span>
                  </>
                )}
              </div>
              <a
                href="https://github.com/orris-inc/orris"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="size-5" />
              </a>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <motion.a
                href="#features"
                whileHover={{ color: 'var(--color-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {t('landing.nav.features')}
              </motion.a>
              <motion.a
                href="#faq"
                whileHover={{ color: 'var(--color-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {t('landing.nav.faq')}
              </motion.a>
              <Link
                to="/pricing"
                className="hover:text-foreground transition-colors"
              >
                {t('landing.nav.pricing')}
              </Link>
            </div>

            {/* Copyright + Version */}
            <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
              <span>
                {t('landing.footer.copyright', {
                  year: new Date().getFullYear(),
                })}
              </span>
              {(serverVersion || clientVersion) && (
                <span className="text-muted-foreground/50 text-xs font-mono">
                  {[serverVersion, clientVersion].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
