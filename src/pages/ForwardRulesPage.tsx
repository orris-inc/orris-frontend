/**
 * 转发规则管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import { useForwardRulesPage } from '@/features/forward-rules/hooks/useForwardRules';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';

export const ForwardRulesPage = () => {
  const {
    forwardRules,
    isLoading,
    refetch,
  } = useForwardRulesPage();

  const handleRefresh = () => {
    refetch();
  };

  const [_createDialogOpen, _setCreateDialogOpen] = useState(false);

  return (
    <AdminLayout>
      <AdminPageLayout
        title="转发规则管理"
        description="管理系统中的所有端口转发规则"
        icon={ArrowLeftRight}
        action={
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="outline"
                  size="md"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  icon={
                    <RefreshCw
                      className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
                      strokeWidth={1.5}
                    />
                  }
                >
                  刷新
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>刷新转发规则列表</TooltipContent>
            </Tooltip>
            <AdminButton
              variant="primary"
              icon={<Plus className="size-4" strokeWidth={1.5} />}
              onClick={() => _setCreateDialogOpen(true)}
            >
              新增规则
            </AdminButton>
          </div>
        }
      >
        {/* 转发规则列表表格 */}
        <AdminCard>
          <div className="p-8 text-center text-muted-foreground">
            <p>转发规则功能开发中...</p>
            <p className="text-sm mt-2">数据已加载：{forwardRules.length} 条记录</p>
          </div>
          {/* TODO: 待实现 ForwardRuleListTable 组件 */}
        </AdminCard>
      </AdminPageLayout>

      {/* TODO: 待实现以下对话框组件 */}
      {/* <CreateForwardRuleDialog /> */}
      {/* <EditForwardRuleDialog /> */}
      {/* <ForwardRuleDetailDialog /> */}
    </AdminLayout>
  );
};
