/**
 * Landing Page - Orris Introduction
 * Modern, minimalist design with tech aesthetics
 */

import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getButtonClass } from '@/lib/ui-styles';
import { ThemeToggle } from '@/components/common/ThemeToggle';

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
  title: string;
  description: string;
}

interface Step {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const features: Feature[] = [
  {
    icon: Network,
    title: 'All-in-One Dashboard',
    description: 'Nodes, forwarding rules, and subscriptions—all managed from a single interface.',
  },
  {
    icon: GitBranch,
    title: 'Versatile Forwarding',
    description: 'Multiple protocols and flexible link chaining to adapt to any network scenario.',
  },
  {
    icon: Layers,
    title: 'Modular Resource Groups',
    description: 'Decouple resources from plans for fine-grained access control and quota allocation.',
  },
  {
    icon: Users,
    title: 'Scalable Subscriptions',
    description: 'From personal use to team sharing—subscription models that grow with your needs.',
  },
  {
    icon: Zap,
    title: 'Relay-First Design',
    description: 'Purpose-built for transit and sharing, maximizing your premium route investments.',
  },
];

const steps: Step[] = [
  {
    step: '01',
    title: 'Add Your Nodes',
    description: 'Import your premium nodes—supports multiple protocols and deployment options.',
    icon: Server,
  },
  {
    step: '02',
    title: 'Define Forwarding Rules',
    description: 'Set up routing policies and chain links to optimize traffic flow across your network.',
    icon: GitBranch,
  },
  {
    step: '03',
    title: 'Build Subscription Plans',
    description: 'Bundle resource groups into plans with custom quotas and access levels.',
    icon: Layers,
  },
  {
    step: '04',
    title: 'Share & Go Live',
    description: 'Users subscribe via link and connect instantly—zero client-side setup required.',
    icon: Users,
  },
];

// Track animation state outside component to survive StrictMode remounts
const animatedSections = new Set<string>();

export const LandingPage = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(() =>
    animatedSections.has('features')
  );

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
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-card/80 dark:bg-card/60 backdrop-blur-lg border border-border shadow-lg dark:shadow-primary/5">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Orris</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <motion.a
                href="#features"
                className="text-sm text-muted-foreground"
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                Features
              </motion.a>
              <motion.a
                href="#how-it-works"
                className="text-sm text-muted-foreground"
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                How It Works
              </motion.a>
              <motion.a
                href="/pricing"
                className="text-sm text-muted-foreground"
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                Pricing
              </motion.a>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/login"
                className={getButtonClass('ghost', 'sm')}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={getButtonClass('default', 'sm')}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
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
            Designed for Premium Transit Sharing
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-fluid-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            One Platform for
            <br />
            <span className="text-primary">Forwarding & Subscriptions</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Orris unifies node management, traffic forwarding, and subscription delivery in one streamlined platform.
            Configure once, share effortlessly.
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
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className={cn(getButtonClass('outline', 'lg'), 'gap-2 px-8')}
            >
              Learn More
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
              { value: '5+', label: 'Forwarding Modes' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Always-On Service' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
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
              Features
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Built for operators with premium transit, IX peering, and quality routes
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
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
                  borderColor: 'hsl(var(--primary) / 0.5)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  transition: { duration: 0.2 },
                }}
                className="p-6 rounded-2xl bg-card border border-border cursor-pointer"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
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
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              From setup to subscriber access in four straightforward steps
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
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
                    {step.step}
                  </motion.div>

                  <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mt-4 mb-4">
                    <step.icon className="size-8 text-primary" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
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
                Ready to Simplify Your Workflow?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8"
              >
                Join Orris and manage your entire forwarding and subscription stack from one place
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
                  Get Started Free
                  <ArrowRight className="size-4" />
                </motion.a>
                <motion.a
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-white/30 text-white font-medium"
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  Already a Member? Sign In
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
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                Features
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                How It Works
              </motion.a>
              <motion.a
                href="/pricing"
                whileHover={{ color: 'hsl(var(--foreground))' }}
                transition={{ duration: 0.2 }}
              >
                Pricing
              </motion.a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Orris. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
