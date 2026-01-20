/**
 * Landing Page - Orris Introduction
 * Modern, minimalist design with tech aesthetics
 */

import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Network,
  Server,
  Layers,
  Users,
  Zap,
  ArrowRight,
  GitBranch,
  Shield,
  Globe,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getButtonClass } from '@/lib/ui-styles';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useVersionInfo } from '@/hooks';

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


interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

interface Step {
  stepKey: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

// Feature icons mapping - titles and descriptions are loaded via i18n
const featureConfigs: Feature[] = [
  {
    icon: Network,
    titleKey: 'landing.features.dashboard.title',
    descriptionKey: 'landing.features.dashboard.description',
  },
  {
    icon: GitBranch,
    titleKey: 'landing.features.forwarding.title',
    descriptionKey: 'landing.features.forwarding.description',
  },
  {
    icon: Layers,
    titleKey: 'landing.features.resourceGroups.title',
    descriptionKey: 'landing.features.resourceGroups.description',
  },
  {
    icon: Users,
    titleKey: 'landing.features.subscriptions.title',
    descriptionKey: 'landing.features.subscriptions.description',
  },
  {
    icon: Zap,
    titleKey: 'landing.features.relay.title',
    descriptionKey: 'landing.features.relay.description',
  },
];

// Step icons mapping - content is loaded via i18n
const stepConfigs: Step[] = [
  {
    stepKey: 'landing.howItWorks.step1.number',
    titleKey: 'landing.howItWorks.step1.title',
    descriptionKey: 'landing.howItWorks.step1.description',
    icon: Server,
  },
  {
    stepKey: 'landing.howItWorks.step2.number',
    titleKey: 'landing.howItWorks.step2.title',
    descriptionKey: 'landing.howItWorks.step2.description',
    icon: GitBranch,
  },
  {
    stepKey: 'landing.howItWorks.step3.number',
    titleKey: 'landing.howItWorks.step3.title',
    descriptionKey: 'landing.howItWorks.step3.description',
    icon: Layers,
  },
  {
    stepKey: 'landing.howItWorks.step4.number',
    titleKey: 'landing.howItWorks.step4.title',
    descriptionKey: 'landing.howItWorks.step4.description',
    icon: Users,
  },
];

// Track animation state outside component to survive StrictMode remounts
const animatedSections = new Set<string>();

// Navigation links for landing page - labels are i18n keys
const navLinkConfigs = [
  { href: '#features', labelKey: 'landing.nav.features' },
  { href: '#how-it-works', labelKey: 'landing.nav.howItWorks' },
  { href: '/pricing', labelKey: 'landing.nav.pricing', isRoute: true },
];

export const LandingPage = () => {
  const { t } = useTranslation();
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(() =>
    animatedSections.has('features')
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { serverVersion, clientVersion } = useVersionInfo();

  const handleFeaturesIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry.isIntersecting && !animatedSections.has('features')) {
      animatedSections.add('features');
      setFeaturesVisible(true);
    }
  }, []);

  useEffect(() => {
    const element = featuresRef.current;
    if (!element || animatedSections.has('features')) return;

    const observer = new IntersectionObserver(handleFeaturesIntersect, {
      threshold: 0.2,
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleFeaturesIntersect]);

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
                {navLinkConfigs.map((link) => (
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-1/4 left-1/4 size-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="absolute bottom-1/4 right-1/4 size-96 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <Shield className="size-4" />
            {t('landing.hero.badge')}
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-fluid-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            {t('landing.hero.title')}
            <br />
            <span className="text-primary">{t('landing.hero.titleHighlight')}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className={cn(getButtonClass('default', 'lg'), 'gap-2 px-8')}
            >
              {t('landing.hero.getStartedFree')}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className={cn(getButtonClass('outline', 'lg'), 'gap-2 px-8')}
            >
              {t('landing.hero.learnMore')}
              <ChevronRight className="size-4" />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto"
          >
            {[
              { value: '5+', labelKey: 'landing.hero.stats.forwardingModes' },
              { value: '99.9%', labelKey: 'landing.hero.stats.uptimeSla' },
              { value: '24/7', labelKey: 'landing.hero.stats.alwaysOn' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{t(stat.labelKey)}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
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
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('landing.features.title')}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              {t('landing.features.subtitle')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureConfigs.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  initial: { opacity: 0, scale: 0.9 },
                  animate: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.4, ease: 'easeOut' },
                  },
                }}
                whileHover={{
                  y: -4,
                  borderColor: 'oklch(from var(--color-primary) l c h / 0.5)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  transition: { duration: 0.2 },
                }}
                className="p-6 rounded-2xl bg-card border border-border cursor-pointer"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground">{t(feature.descriptionKey)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {t('landing.howItWorks.title')}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              {t('landing.howItWorks.subtitle')}
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stepConfigs.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Connector line */}
                {index < stepConfigs.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-border"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                    style={{ originX: 0 }}
                  />
                )}

                <motion.div
                  className="relative p-6 rounded-2xl bg-card border border-border text-center"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  {/* Step number */}
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 300, delay: index * 0.15 + 0.2 }}
                  >
                    {t(step.stepKey)}
                  </motion.div>

                  <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mt-4 mb-4">
                    <step.icon className="size-8 text-primary" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(step.descriptionKey)}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative p-12 md:p-16 rounded-3xl bg-primary text-primary-foreground overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 -z-0">
              <motion.div
                className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-3xl"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 size-64 bg-white/5 rounded-full blur-3xl"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>

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
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                {t('landing.cta.title')}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8"
              >
                {t('landing.cta.subtitle')}
              </motion.p>
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <motion.a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white dark:bg-background text-primary font-medium"
                  whileHover={{ opacity: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {t('landing.cta.getStartedFree')}
                  <ArrowRight className="size-4" />
                </motion.a>
                <motion.a
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-white/30 text-white font-medium"
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  {t('landing.cta.alreadyMember')}
                </motion.a>
              </motion.div>
            </motion.div>
          </motion.div>
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
              <motion.a
                href="#features"
                whileHover={{ color: 'var(--color-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {t('landing.nav.features')}
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ color: 'var(--color-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {t('landing.nav.howItWorks')}
              </motion.a>
              <motion.a
                href="/pricing"
                whileHover={{ color: 'var(--color-foreground)' }}
                transition={{ duration: 0.2 }}
              >
                {t('landing.nav.pricing')}
              </motion.a>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</span>
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
