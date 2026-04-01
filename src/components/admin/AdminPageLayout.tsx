/**
 * 管理端页面统一布局组件
 * 精致商务风格 - 统一视觉语言
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { SmartTruncate } from '@/components/common/SmartTruncate';

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
      <header className="shrink-0 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <Icon className="size-5 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
            )}
            <div className="min-w-0">
              <SmartTruncate
                text={title}
                className="text-lg font-semibold text-foreground"
                font="18px Inter, system-ui, sans-serif"
              />
              {description && (
                <div className="mt-0.5">
                  <SmartTruncate
                    text={description}
                    className="text-[13px] text-muted-foreground"
                    maxLines={2}
                  />
                </div>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </header>

      {/* Info Alert (Optional) */}
      {info && (
        <div className="relative overflow-hidden rounded-lg border border-info/20 bg-info/5 p-3 flex items-start gap-2 mb-4">
          <div className="size-1.5 rounded-full bg-info mt-1.5 shrink-0" />
          <p className="text-xs text-info flex-1">
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
