/**
 * Dashboard 主页面 - Editorial Magazine + Art Deco 风格
 * 设计理念：优雅精致、装饰性几何、不对称布局
 */

import { useEffect, useState } from 'react';
import {
  CircleAlert,
  TrendingUp,
  Calendar,
  Zap,
  Download,
  Upload,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { getSubscriptions } from '@/features/subscriptions/api/subscriptions-api';
import type { Subscription } from '@/features/subscriptions/types/subscriptions.types';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const result = await getSubscriptions({ page: 1, page_size: 100 });
        if (result.items && result.items.length > 0) {
          setSubscriptions(result.items);
        }
      } catch (err) {
        console.error('获取订阅信息失败:', err);
      }
    };

    fetchSubscriptions();
  }, []);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="editorial-dashboard">
          <div className="alert-card">
            <CircleAlert className="h-5 w-5" />
            <div>无法加载用户信息</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 计算统计数据
  const activeSubscriptions = subscriptions.filter((sub) => sub.IsActive && !sub.IsExpired);
  const hasActiveSubscription = activeSubscriptions.length > 0;
  const primarySubscription = activeSubscriptions[0];

  // 计算剩余天数
  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = primarySubscription ? getDaysRemaining(primarySubscription.EndDate) : null;

  return (
    <DashboardLayout>
      <div className="editorial-dashboard">
        {/* 装饰性背景 */}
        <div className="dashboard-background">
          <div className="grain-overlay" />
          <div className="geometric-pattern" />
        </div>

        {/* 主标题区 - Editorial 风格 */}
        <header className="dashboard-header fade-in-stagger" style={{ animationDelay: '0s' }}>
          <div className="header-decoration" />
          <h1 className="dashboard-title">
            {user.display_name || user.name || user.email?.split('@')[0] || '用户'}
          </h1>
          <p className="dashboard-subtitle">欢迎回到您的控制中心</p>
          <div className="header-decoration-bottom" />
        </header>

        {/* 邮箱未验证提示 */}
        {!user.email_verified && (
          <div className="warning-banner fade-in-stagger" style={{ animationDelay: '0.1s' }}>
            <div className="warning-icon">
              <CircleAlert className="h-5 w-5" />
            </div>
            <div className="warning-content">
              <p className="warning-title">邮箱未验证</p>
              <p className="warning-description">请查收验证邮件以解锁完整功能</p>
            </div>
          </div>
        )}

        {/* Bento Grid 布局 */}
        <div className="bento-grid">
          {/* 左侧大卡片 - 主要统计 */}
          <div className="bento-item bento-large fade-in-stagger" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon stat-icon-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="stat-label">订阅状态</div>
              </div>
              <div className="stat-value">
                {hasActiveSubscription ? '已激活' : '未激活'}
              </div>
              <div className="stat-description">
                {hasActiveSubscription
                  ? `${activeSubscriptions.length} 个活跃订阅`
                  : '暂无活跃订阅'}
              </div>
              {hasActiveSubscription && (
                <div className="stat-badge badge-success">
                  <Sparkles className="h-4 w-4" />
                  <span>服务正常</span>
                </div>
              )}
            </div>
          </div>

          {/* 右上 - 剩余天数 */}
          <div className="bento-item bento-small fade-in-stagger" style={{ animationDelay: '0.3s' }}>
            <div className="metric-card">
              <div className="metric-icon metric-icon-amber">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="metric-value">
                {daysRemaining !== null ? daysRemaining : '-'}
              </div>
              <div className="metric-label">剩余天数</div>
            </div>
          </div>

          {/* 右中 - 性能指标 */}
          <div className="bento-item bento-small fade-in-stagger" style={{ animationDelay: '0.4s' }}>
            <div className="metric-card">
              <div className="metric-icon metric-icon-emerald">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="metric-value">99.9%</div>
              <div className="metric-label">服务可用率</div>
            </div>
          </div>

          {/* 流量统计卡片 - 中等宽度 */}
          <div className="bento-item bento-medium fade-in-stagger" style={{ animationDelay: '0.5s' }}>
            <div className="traffic-card">
              <div className="traffic-header">
                <h3 className="traffic-title">流量统计</h3>
                <span className="traffic-period">本月</span>
              </div>

              <div className="traffic-stats">
                <div className="traffic-stat">
                  <div className="traffic-stat-icon traffic-icon-upload">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="traffic-stat-value">2.4 GB</div>
                    <div className="traffic-stat-label">上传</div>
                  </div>
                </div>

                <div className="traffic-divider" />

                <div className="traffic-stat">
                  <div className="traffic-stat-icon traffic-icon-download">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="traffic-stat-value">18.7 GB</div>
                    <div className="traffic-stat-label">下载</div>
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="traffic-progress-container">
                <div className="traffic-progress-header">
                  <span className="traffic-progress-label">已使用</span>
                  <span className="traffic-progress-value">21.1 GB / 100 GB</span>
                </div>
                <div className="traffic-progress-bar">
                  <div className="traffic-progress-fill" style={{ width: '21.1%' }} />
                  <div className="traffic-progress-glow" style={{ width: '21.1%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 快捷操作卡片 */}
          <div className="bento-item bento-medium fade-in-stagger" style={{ animationDelay: '0.6s' }}>
            <div className="actions-card">
              <h3 className="actions-title">快捷操作</h3>
              <div className="actions-list">
                <a href="/pricing" className="action-button action-button-primary">
                  <Zap className="h-5 w-5" />
                  <div className="action-content">
                    <div className="action-label">升级订阅</div>
                    <div className="action-description">获取更多流量和功能</div>
                  </div>
                  <ArrowRight className="h-4 w-4 action-arrow" />
                </a>

                <button className="action-button action-button-secondary">
                  <Shield className="h-5 w-5" />
                  <div className="action-content">
                    <div className="action-label">管理订阅</div>
                    <div className="action-description">查看和管理您的订阅</div>
                  </div>
                  <ArrowRight className="h-4 w-4 action-arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 详细订阅信息 - 使用原有组件 */}
        <div className="subscription-section fade-in-stagger" style={{ animationDelay: '0.7s' }}>
          <SubscriptionCard />
        </div>

        {/* 内联样式 */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

          .editorial-dashboard {
            position: relative;
            min-height: 100vh;
            padding: 2rem 0;
            font-family: 'Manrope', sans-serif;
          }

          /* ========== 装饰性背景 ========== */
          .dashboard-background {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            pointer-events: none;
            background: linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 50%, #FAFAF9 100%);
          }

          .grain-overlay {
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.03;
            mix-blend-mode: overlay;
          }

          .geometric-pattern {
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(30deg, transparent 48%, rgba(217, 119, 6, 0.02) 48%, rgba(217, 119, 6, 0.02) 52%, transparent 52%),
              linear-gradient(60deg, transparent 48%, rgba(5, 150, 105, 0.02) 48%, rgba(5, 150, 105, 0.02) 52%, transparent 52%);
            background-size: 80px 140px;
          }

          /* ========== 标题区 ========== */
          .dashboard-header {
            position: relative;
            margin-bottom: 3rem;
            text-align: center;
            padding: 3rem 2rem;
          }

          .header-decoration {
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #D97706, transparent);
            margin: 0 auto 2rem;
            border-radius: 2px;
          }

          .header-decoration-bottom {
            width: 100px;
            height: 1px;
            background: linear-gradient(90deg, transparent, #059669, #D97706, transparent);
            margin: 1.5rem auto 0;
            opacity: 0.3;
          }

          .dashboard-title {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 700;
            color: #1A2332;
            line-height: 1.1;
            margin-bottom: 0.75rem;
            letter-spacing: -0.02em;
          }

          .dashboard-subtitle {
            font-size: 1.125rem;
            color: #64748B;
            font-weight: 500;
            letter-spacing: 0.01em;
          }

          /* ========== 警告横幅 ========== */
          .warning-banner {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            margin-bottom: 2.5rem;
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            border: 1px solid #F59E0B;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
          }

          .warning-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 10px;
            color: #F59E0B;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
          }

          .warning-content {
            flex: 1;
          }

          .warning-title {
            font-size: 1rem;
            font-weight: 600;
            color: #92400E;
            margin-bottom: 0.25rem;
          }

          .warning-description {
            font-size: 0.875rem;
            color: #B45309;
          }

          /* ========== Bento Grid 布局 ========== */
          .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }

          .bento-item {
            position: relative;
          }

          /* 大卡片：占据 6 列，2 行 */
          .bento-large {
            grid-column: span 6;
            grid-row: span 2;
          }

          /* 小卡片：占据 3 列，1 行 */
          .bento-small {
            grid-column: span 3;
          }

          /* 中等卡片：占据 6 列，1 行 */
          .bento-medium {
            grid-column: span 6;
          }

          /* 响应式布局 */
          @media (max-width: 1024px) {
            .bento-large, .bento-medium, .bento-small {
              grid-column: span 12;
              grid-row: span 1;
            }
          }

          @media (max-width: 640px) {
            .bento-grid {
              gap: 1rem;
            }
          }

          /* ========== 统计卡片 ========== */
          .stat-card {
            height: 100%;
            padding: 2.5rem;
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 24px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #D97706, #059669);
            opacity: 0;
            transition: opacity 0.4s ease;
          }

          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
            border-color: #D97706;
          }

          .stat-card:hover::before {
            opacity: 1;
          }

          .stat-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          .stat-icon-primary {
            background: linear-gradient(135deg, #059669 0%, #10B981 100%);
            color: white;
          }

          .stat-label {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #64748B;
          }

          .stat-value {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
            color: #1A2332;
            line-height: 1.1;
            margin-bottom: 0.5rem;
          }

          .stat-description {
            font-size: 1.125rem;
            color: #64748B;
            margin-bottom: 1.5rem;
          }

          .stat-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
          }

          .badge-success {
            background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
            color: #065F46;
            border: 1px solid #059669;
          }

          /* ========== 指标卡片 ========== */
          .metric-card {
            height: 100%;
            padding: 2rem;
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            transition: all 0.3s ease;
          }

          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }

          .metric-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            margin-bottom: 1rem;
          }

          .metric-icon-amber {
            background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
            color: #D97706;
          }

          .metric-icon-emerald {
            background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
            color: #059669;
          }

          .metric-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 2rem;
            font-weight: 700;
            color: #1A2332;
            line-height: 1.2;
            margin-bottom: 0.5rem;
          }

          .metric-label {
            font-size: 0.875rem;
            color: #64748B;
            font-weight: 500;
          }

          /* ========== 流量卡片 ========== */
          .traffic-card {
            height: 100%;
            padding: 2rem;
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
            transition: all 0.3s ease;
          }

          .traffic-card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }

          .traffic-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }

          .traffic-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: #1A2332;
          }

          .traffic-period {
            font-size: 0.875rem;
            color: #64748B;
            padding: 0.375rem 0.875rem;
            background: #F3F4F6;
            border-radius: 8px;
            font-weight: 500;
          }

          .traffic-stats {
            display: flex;
            gap: 2rem;
            margin-bottom: 2rem;
          }

          .traffic-stat {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .traffic-stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          .traffic-icon-upload {
            background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
            color: #2563EB;
          }

          .traffic-icon-download {
            background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
            color: #DB2777;
          }

          .traffic-stat-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.25rem;
            font-weight: 700;
            color: #1A2332;
            line-height: 1.2;
          }

          .traffic-stat-label {
            font-size: 0.875rem;
            color: #64748B;
          }

          .traffic-divider {
            width: 1px;
            background: #E5E7EB;
          }

          .traffic-progress-container {
            margin-top: 1.5rem;
          }

          .traffic-progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .traffic-progress-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748B;
          }

          .traffic-progress-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.875rem;
            font-weight: 600;
            color: #1A2332;
          }

          .traffic-progress-bar {
            position: relative;
            height: 12px;
            background: #F3F4F6;
            border-radius: 8px;
            overflow: hidden;
          }

          .traffic-progress-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, #059669 0%, #10B981 100%);
            border-radius: 8px;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .traffic-progress-glow {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
            border-radius: 8px;
            animation: progress-shine 2s ease-in-out infinite;
          }

          @keyframes progress-shine {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }

          /* ========== 快捷操作卡片 ========== */
          .actions-card {
            height: 100%;
            padding: 2rem;
            background: linear-gradient(135deg, #1A2332 0%, #2C3E50 100%);
            border: 1px solid #374151;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            color: white;
          }

          .actions-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: white;
          }

          .actions-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .action-button {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            cursor: pointer;
            backdrop-filter: blur(10px);
          }

          .action-button:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(217, 119, 6, 0.5);
            transform: translateX(4px);
          }

          .action-button > svg:first-child {
            flex-shrink: 0;
            opacity: 0.9;
          }

          .action-content {
            flex: 1;
            text-align: left;
          }

          .action-label {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .action-description {
            font-size: 0.875rem;
            opacity: 0.7;
          }

          .action-arrow {
            flex-shrink: 0;
            opacity: 0.5;
            transition: transform 0.3s ease, opacity 0.3s ease;
          }

          .action-button:hover .action-arrow {
            transform: translateX(4px);
            opacity: 1;
          }

          .action-button-primary {
            background: linear-gradient(135deg, rgba(217, 119, 6, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%);
            border-color: rgba(217, 119, 6, 0.3);
          }

          .action-button-primary:hover {
            background: linear-gradient(135deg, rgba(217, 119, 6, 0.3) 0%, rgba(217, 119, 6, 0.2) 100%);
            border-color: rgba(217, 119, 6, 0.5);
          }

          /* ========== 订阅区域 ========== */
          .subscription-section {
            margin-top: 2.5rem;
          }

          /* ========== 动画 ========== */
          @keyframes fade-in-stagger {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .fade-in-stagger {
            animation: fade-in-stagger 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
          }

          /* ========== 响应式优化 ========== */
          @media (max-width: 768px) {
            .editorial-dashboard {
              padding: 1rem 0;
            }

            .dashboard-header {
              padding: 2rem 1rem;
              margin-bottom: 2rem;
            }

            .dashboard-title {
              font-size: 2rem;
            }

            .dashboard-subtitle {
              font-size: 1rem;
            }

            .stat-card, .metric-card, .traffic-card, .actions-card {
              padding: 1.5rem;
            }

            .stat-value {
              font-size: 2rem;
            }

            .traffic-stats {
              flex-direction: column;
              gap: 1rem;
            }

            .traffic-divider {
              height: 1px;
              width: 100%;
            }
          }

          /* ========== 暗色模式支持 ========== */
          @media (prefers-color-scheme: dark) {
            .dashboard-background {
              background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
            }

            .dashboard-title {
              color: #F8FAFC;
            }

            .dashboard-subtitle {
              color: #94A3B8;
            }

            .stat-card, .metric-card, .traffic-card {
              background: rgba(255, 255, 255, 0.05);
              border-color: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
            }

            .stat-value, .metric-value, .traffic-stat-value, .traffic-title {
              color: #F8FAFC;
            }

            .stat-description, .metric-label, .traffic-stat-label {
              color: #94A3B8;
            }

            .traffic-period {
              background: rgba(255, 255, 255, 0.1);
              color: #CBD5E1;
            }

            .traffic-progress-bar {
              background: rgba(255, 255, 255, 0.1);
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};
