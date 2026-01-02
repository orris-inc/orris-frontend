/**
 * Landing Page - Orris Introduction
 * Modern, minimalist design with tech aesthetics
 */

import { Link } from 'react-router';
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
    title: '统一管理',
    description: '节点、转发规则与订阅一站式管理，告别多平台切换的烦恼',
  },
  {
    icon: GitBranch,
    title: '多种转发模式',
    description: '支持多种转发协议与链路组合，灵活应对不同场景需求',
  },
  {
    icon: Layers,
    title: '资源组解耦',
    description: '资源组与订阅计划独立设计，实现更精细化的权限与配额管理',
  },
  {
    icon: Users,
    title: '灵活订阅模型',
    description: '用户与订阅模型灵活配置，满足不同规模的拼车需求',
  },
  {
    icon: Zap,
    title: '中转场景优化',
    description: '专为拼车与中转场景设计，充分利用专线与高质量线路资源',
  },
];

const steps: Step[] = [
  {
    step: '01',
    title: '配置节点',
    description: '添加您的专线节点，支持多种协议与部署方式',
    icon: Server,
  },
  {
    step: '02',
    title: '设置转发规则',
    description: '创建转发规则，定义流量的路由策略与链路组合',
    icon: GitBranch,
  },
  {
    step: '03',
    title: '创建订阅计划',
    description: '配置资源组与订阅计划，设定配额与权限',
    icon: Layers,
  },
  {
    step: '04',
    title: '用户订阅使用',
    description: '用户通过订阅链接即可使用服务，无需额外配置',
    icon: Users,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
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
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                功能特性
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                工作流程
              </a>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                定价
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/login"
                className={cn(getButtonClass('ghost', 'sm'), 'hidden sm:inline-flex')}
              >
                登录
              </Link>
              <Link
                to="/register"
                className={getButtonClass('default', 'sm')}
              >
                开始使用
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 size-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 size-96 bg-accent/10 dark:bg-accent/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Shield className="size-4" />
            专为专线拼车场景设计
          </div>

          {/* Main heading */}
          <h1 className="text-fluid-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            统一管理您的
            <br />
            <span className="text-primary">转发与订阅服务</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Orris 集转发、节点、订阅、资源组管理于一体，
            让管理员轻松配置，用户一键订阅使用
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className={cn(getButtonClass('default', 'lg'), 'gap-2 px-8')}
            >
              免费开始
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className={cn(getButtonClass('outline', 'lg'), 'gap-2 px-8')}
            >
              了解更多
              <ChevronRight className="size-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5+</div>
              <div className="text-sm text-muted-foreground mt-1">转发模式</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">服务可用性</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">稳定运行</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              功能特性
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              为拥有专线/IX/高质量线路的用户提供一站式管理方案
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              工作流程
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              简单四步，即可完成从配置到用户使用的全流程
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-border" />
                )}

                <div className="relative p-6 rounded-2xl bg-card border border-border text-center">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {step.step}
                  </div>

                  <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mt-4 mb-4">
                    <step.icon className="size-8 text-primary" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-3xl bg-primary text-primary-foreground overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-0">
              <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 size-64 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                准备好开始了吗？
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
                立即注册 Orris，体验一站式转发与订阅管理服务
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white dark:bg-background text-primary font-medium hover:bg-white/90 dark:hover:bg-background/90 transition-colors"
                >
                  免费注册
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  已有账号？登录
                </Link>
              </div>
            </div>
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
              <a href="#features" className="hover:text-foreground transition-colors">
                功能特性
              </a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                工作流程
              </a>
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                定价
              </Link>
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
