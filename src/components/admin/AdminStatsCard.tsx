/**
 * 管理端统计卡片组件
 * 精致商务风格 - 数据展示卡片
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

/**
 * 统计数据卡片
 * 用于展示关键指标
 */
export const AdminStatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBg,
  iconColor,
  accentColor,
}: AdminStatsCardProps) => {
  const changeStyles = {
    increase: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    decrease: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400',
    neutral: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 dark:text-slate-400',
  };

  const ChangeIcon = changeType === 'increase' ? TrendingUp : changeType === 'decrease' ? TrendingDown : Activity;

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50">
      {/* 顶部装饰线 */}
      <div className={`absolute top-0 left-6 right-6 h-0.5 ${accentColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-5">
        {/* 图标容器 */}
        <div className={`${iconBg} p-3.5 rounded-xl shadow-sm`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>

        {/* 变化指标 */}
        {change && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${changeStyles[changeType]}`}>
            <ChangeIcon className="size-3.5" />
            <span>{change}</span>
          </div>
        )}
      </div>

      {/* 数值和标题 */}
      <div className="space-y-1">
        <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </div>
      </div>
    </div>
  );
};
