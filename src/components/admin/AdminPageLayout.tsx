/**
 * 管理端页面统一布局组件
 * 精致商务风格 - 统一视觉语言
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
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
    <div className="@container flex flex-col min-h-0">
      {/* Header Area */}
      <header className="shrink-0 py-4 @sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 @sm:p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0">
                <Icon className="size-5 @sm:size-6 text-primary" strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl @sm:text-2xl @md:text-3xl font-bold text-foreground tracking-tight truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs @sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 @sm:line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </header>

      {/* Info Alert (Optional) */}
      {info && (
        <div className="relative overflow-hidden rounded-lg @sm:rounded-xl border border-info/20 bg-info/5 p-3 @sm:p-4 flex items-start gap-2 @sm:gap-3 mb-4">
          <div className="size-1.5 rounded-full bg-info mt-1.5 shrink-0" />
          <p className="text-xs @sm:text-sm text-info flex-1">
            {info}
          </p>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 pb-6 space-y-4">
        {children}
      </div>
    </div>
  );
};
