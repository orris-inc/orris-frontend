/**
 * 管理端页面统一布局组件
 * 精致商务风格 - 统一视觉语言
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageLayoutProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  info?: string;
  children: ReactNode;
}

/**
 * 管理端页面标准布局
 * 提供统一的标题区、信息提示区和内容区
 */
export const AdminPageLayout = ({
  title,
  description,
  icon: Icon,
  action,
  info,
  children,
}: AdminPageLayoutProps) => {
  return (
    <div className="space-y-8 py-8">
      {/* 标题区 - 统一样式 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <Icon className="size-6 text-slate-700 dark:text-slate-300" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* 信息提示区（可选） */}
      {info && (
        <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/30 p-4 flex items-start gap-3">
          <div className="size-1.5 rounded-full bg-blue-500 mt-1.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200 flex-1">
            {info}
          </p>
        </div>
      )}

      {/* 内容区 */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
