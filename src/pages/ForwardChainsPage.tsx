/**
 * 转发链管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { Link2, Plus, RefreshCw } from 'lucide-react';
import { useForwardChainsPage } from '@/features/forward-chains/hooks/useForwardChains';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';

export const ForwardChainsPage = () => {
  const {
    forwardChains,
    isLoading,
    refetch,
  } = useForwardChainsPage();

  const handleRefresh = () => {
    refetch();
  };

  const [_createDialogOpen, _setCreateDialogOpen] = useState(false);

  return (
    <AdminLayout>
      <AdminPageLayout
        title="转发链管理"
        description="管理多链路端口转发配置，支持多节点级联转发"
        icon={Link2}
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
              <TooltipContent>刷新转发链列表</TooltipContent>
            </Tooltip>
            <AdminButton
              variant="primary"
              icon={<Plus className="size-4" strokeWidth={1.5} />}
              onClick={() => _setCreateDialogOpen(true)}
            >
              新增链路
            </AdminButton>
          </div>
        }
      >
        {/* 转发链列表表格 */}
        <AdminCard>
          <div className="p-8 text-center text-muted-foreground">
            <p>转发链功能开发中...</p>
            <p className="text-sm mt-2">数据已加载：{forwardChains.length} 条记录</p>
          </div>
          {/* TODO: 待实现 ForwardChainListTable 组件 */}
        </AdminCard>
      </AdminPageLayout>

      {/* TODO: 待实现以下对话框组件 */}
      {/* <CreateForwardChainDialog /> */}
      {/* <ForwardChainDetailDialog /> */}
    </AdminLayout>
  );
};
