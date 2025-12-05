/**
 * 转发规则管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { ArrowLeftRight, Plus, RefreshCw } from 'lucide-react';
import { ForwardRuleListTable } from '@/features/forward-rules/components/ForwardRuleListTable';
import { CreateForwardRuleDialog } from '@/features/forward-rules/components/CreateForwardRuleDialog';
import { EditForwardRuleDialog } from '@/features/forward-rules/components/EditForwardRuleDialog';
import { ForwardRuleDetailDialog } from '@/features/forward-rules/components/ForwardRuleDetailDialog';
import { useForwardRulesPage } from '@/features/forward-rules/hooks/useForwardRules';
import { useForwardAgents } from '@/features/forward-agents/hooks/useForwardAgents';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest } from '@/api/forward';

export const ForwardRulesPage = () => {
  const {
    forwardRules,
    pagination,
    isLoading,
    isFetching,
    refetch,
    agentsMap,
    createForwardRule,
    updateForwardRule,
    deleteForwardRule,
    enableForwardRule,
    disableForwardRule,
    resetTraffic,
    handlePageChange,
    handlePageSizeChange,
  } = useForwardRulesPage();

  // 获取转发节点列表（用于创建规则时选择）
  const { forwardAgents } = useForwardAgents();

  // 获取节点列表（用于选择目标节点）
  const { nodes } = useNodes({ pageSize: 100 });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDelete = async (rule: ForwardRule) => {
    if (window.confirm(`确认删除转发规则 "${rule.name}" 吗？此操作不可恢复。`)) {
      await deleteForwardRule(rule.id);
    }
  };

  const handleEnable = async (rule: ForwardRule) => {
    await enableForwardRule(rule.id);
  };

  const handleDisable = async (rule: ForwardRule) => {
    await disableForwardRule(rule.id);
  };

  const handleResetTraffic = async (rule: ForwardRule) => {
    if (window.confirm(`确认重置规则 "${rule.name}" 的流量统计吗？`)) {
      await resetTraffic(rule.id);
    }
  };

  const handleViewDetail = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setDetailDialogOpen(true);
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    await createForwardRule(data);
    setCreateDialogOpen(false);
  };

  const handleUpdateSubmit = async (id: number | string, data: UpdateForwardRuleRequest) => {
    await updateForwardRule(id, data);
    setEditDialogOpen(false);
    setSelectedRule(null);
  };

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
                  disabled={isFetching}
                  icon={
                    <RefreshCw
                      className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
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
              onClick={() => setCreateDialogOpen(true)}
            >
              新增规则
            </AdminButton>
          </div>
        }
      >
        {/* 转发规则列表表格 */}
        <AdminCard noPadding>
          <ForwardRuleListTable
            rules={forwardRules}
            agentsMap={agentsMap}
            loading={isLoading || isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onResetTraffic={handleResetTraffic}
            onViewDetail={handleViewDetail}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 新增转发规则对话框 */}
      <CreateForwardRuleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        agents={forwardAgents}
        nodes={nodes}
      />

      {/* 编辑转发规则对话框 */}
      <EditForwardRuleDialog
        open={editDialogOpen}
        rule={selectedRule}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRule(null);
        }}
        onSubmit={handleUpdateSubmit}
        nodes={nodes}
      />

      {/* 转发规则详情对话框 */}
      <ForwardRuleDetailDialog
        open={detailDialogOpen}
        rule={selectedRule}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedRule(null);
        }}
      />
    </AdminLayout>
  );
};
