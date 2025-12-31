/**
 * 转发规则管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { ArrowLeftRight, Plus, RefreshCw, Users } from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { ForwardRuleListTable } from '@/features/forward-rules/components/ForwardRuleListTable';
import { CreateForwardRuleDialog } from '@/features/forward-rules/components/CreateForwardRuleDialog';
import { EditForwardRuleDialog } from '@/features/forward-rules/components/EditForwardRuleDialog';
import { ForwardRuleDetailDialog } from '@/features/forward-rules/components/ForwardRuleDetailDialog';
import { ForwardRuleFilters } from '@/features/forward-rules/components/ForwardRuleFilters';
import { ProbeResultDialog } from '@/features/forward-rules/components/ProbeResultDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useForwardRulesPage, useRuleStatusPolling } from '@/features/forward-rules/hooks/useForwardRules';
import { useForwardAgents } from '@/features/forward-agents/hooks/useForwardAgents';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest, RuleProbeResponse, ForwardRuleType, ForwardProtocol, IPVersion } from '@/api/forward';

export const ForwardRulesPage = () => {
  usePageTitle('转发规则管理');

  const {
    forwardRules,
    pagination,
    isLoading,
    isFetching,
    refetch,
    agentsMap,
    filters,
    handleFiltersChange,
    createForwardRule,
    updateForwardRule,
    deleteForwardRule,
    enableForwardRule,
    disableForwardRule,
    resetTraffic,
    probeRule,
    handlePageChange,
    handlePageSizeChange,
    includeUserRules,
    handleIncludeUserRulesChange,
  } = useForwardRulesPage();

  // Get forward agent list (for rule creation selection)
  const { forwardAgents } = useForwardAgents();

  // Get node list (for target node selection)
  const { nodes } = useNodes({ pageSize: 100 });

  // Short-term polling after enable/disable operations
  const { polledStatusMap, pollingRuleIds, startPolling } = useRuleStatusPolling();

  // Responsive breakpoint
  const { isMobile } = useBreakpoint();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ForwardRule | null>(null);
  const [probeDialogOpen, setProbeDialogOpen] = useState(false);
  const [probeResult, setProbeResult] = useState<RuleProbeResponse | null>(null);
  const [probingRuleId, setProbingRuleId] = useState<string | null>(null);
  const [probingRule, setProbingRule] = useState<ForwardRule | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<ForwardRule | null>(null);
  const [resetTrafficConfirmOpen, setResetTrafficConfirmOpen] = useState(false);
  const [ruleToResetTraffic, setRuleToResetTrafficRule] = useState<ForwardRule | null>(null);
  const [copyRuleData, setCopyRuleData] = useState<(Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' }) | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleEdit = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDelete = (rule: ForwardRule) => {
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (ruleToDelete) {
      await deleteForwardRule(ruleToDelete.id);
      setDeleteConfirmOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleEnable = async (rule: ForwardRule) => {
    await enableForwardRule(rule.id);
    // Start polling to track sync status after enable
    startPolling(rule.id);
  };

  const handleDisable = async (rule: ForwardRule) => {
    await disableForwardRule(rule.id);
  };

  const handleResetTraffic = (rule: ForwardRule) => {
    setRuleToResetTrafficRule(rule);
    setResetTrafficConfirmOpen(true);
  };

  const handleResetTrafficConfirm = async () => {
    if (ruleToResetTraffic) {
      await resetTraffic(ruleToResetTraffic.id);
      setResetTrafficConfirmOpen(false);
      setRuleToResetTrafficRule(null);
    }
  };

  const handleViewDetail = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setDetailDialogOpen(true);
  };

  const handleProbe = async (rule: ForwardRule) => {
    setProbingRuleId(rule.id);
    setProbingRule(rule);
    setProbeResult(null);
    setProbeDialogOpen(true);
    try {
      const result = await probeRule(rule.id);
      setProbeResult(result);
    } catch {
      // Error already handled in hook
    } finally {
      setProbingRuleId(null);
    }
  };

  const handleCopy = (rule: ForwardRule) => {
    // Filter out entry agent from chainAgentIds (entry agent should not be in chain list)
    const filteredChainAgentIds = rule.chainAgentIds
      ? rule.chainAgentIds.filter((id) => id !== rule.agentId)
      : undefined;

    // Also filter chainPortConfig to match filtered chainAgentIds
    let filteredChainPortConfig: Record<string, number> | undefined;
    if (rule.chainPortConfig && filteredChainAgentIds) {
      filteredChainPortConfig = {};
      for (const id of filteredChainAgentIds) {
        if (rule.chainPortConfig[id] !== undefined) {
          filteredChainPortConfig[id] = rule.chainPortConfig[id];
        }
      }
    }

    const copyData: Partial<CreateForwardRuleRequest> & { targetType?: 'manual' | 'node' } = {
      agentId: rule.agentId,
      ruleType: rule.ruleType as ForwardRuleType,
      exitAgentId: rule.exitAgentId,
      chainAgentIds: filteredChainAgentIds,
      chainPortConfig: filteredChainPortConfig,
      name: `${rule.name} - 副本`,
      listenPort: rule.listenPort,
      targetAddress: rule.targetAddress,
      targetPort: rule.targetPort,
      targetNodeId: rule.targetNodeId,
      bindIp: rule.bindIp,
      trafficMultiplier: rule.trafficMultiplier,
      sortOrder: rule.sortOrder,
      protocol: rule.protocol as ForwardProtocol,
      ipVersion: rule.ipVersion as IPVersion,
      remark: rule.remark,
      targetType: rule.targetNodeId ? 'node' : 'manual',
    };
    setCopyRuleData(copyData);
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    await createForwardRule(data);
    setCreateDialogOpen(false);
    setCopyRuleData(undefined);
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
      >
        {/* Toolbar - Compact on mobile */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {/* Row 1: Actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: User rules toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-1 cursor-pointer text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <Users className="size-3.5 sm:size-4 text-slate-500" strokeWidth={1.5} />
                  <span className="hidden sm:inline">用户规则</span>
                  <Switch
                    checked={includeUserRules}
                    onCheckedChange={handleIncludeUserRulesChange}
                  >
                    <SwitchThumb />
                  </Switch>
                </label>
              </TooltipTrigger>
              <TooltipContent>显示用户规则</TooltipContent>
            </Tooltip>

            {/* Right: Refresh + Add */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    icon={
                      <RefreshCw
                        key={refreshKey}
                        className="size-3.5 sm:size-4 animate-spin-once"
                        strokeWidth={1.5}
                      />
                    }
                  >
                    <span className="sr-only">刷新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>刷新</TooltipContent>
              </Tooltip>

              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus className="size-3.5 sm:size-4" strokeWidth={1.5} />}
                onClick={() => {
                  setCopyRuleData(undefined);
                  setCreateDialogOpen(true);
                }}
              >
                <span className="hidden sm:inline">新增规则</span>
                <span className="sm:hidden text-xs">新增</span>
              </AdminButton>
            </div>
          </div>

          {/* Row 2: Filters */}
          <ForwardRuleFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* 转发规则列表 - 移动端不使用 AdminCard 包装 */}
        {isMobile ? (
          <ForwardRuleListTable
            rules={forwardRules}
            agentsMap={agentsMap}
            nodes={nodes}
            polledStatusMap={polledStatusMap}
            pollingRuleIds={pollingRuleIds}
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
            onProbe={handleProbe}
            onCopy={handleCopy}
            probingRuleId={probingRuleId}
          />
        ) : (
          <AdminCard noPadding>
            <ForwardRuleListTable
              rules={forwardRules}
              agentsMap={agentsMap}
              nodes={nodes}
              polledStatusMap={polledStatusMap}
              pollingRuleIds={pollingRuleIds}
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
              onProbe={handleProbe}
              onCopy={handleCopy}
              probingRuleId={probingRuleId}
            />
          </AdminCard>
        )}
      </AdminPageLayout>

      {/* 新增转发规则对话框 */}
      <CreateForwardRuleDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setCopyRuleData(undefined);
        }}
        onSubmit={handleCreateSubmit}
        agents={forwardAgents}
        nodes={nodes}
        initialData={copyRuleData}
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
        agents={forwardAgents}
      />

      {/* 转发规则详情对话框 */}
      <ForwardRuleDetailDialog
        open={detailDialogOpen}
        rule={selectedRule}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedRule(null);
        }}
        agents={forwardAgents}
        nodes={nodes}
      />

      {/* 拨测结果对话框 */}
      <ProbeResultDialog
        open={probeDialogOpen}
        onOpenChange={setProbeDialogOpen}
        rule={probingRule}
        probeResult={probeResult}
        isProbing={probingRuleId !== null}
        agents={forwardAgents}
        nodes={nodes}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="确认删除"
        description={ruleToDelete ? `确认删除转发规则 "${ruleToDelete.name}" 吗？此操作不可恢复。` : ''}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* 重置流量确认对话框 */}
      <ConfirmDialog
        open={resetTrafficConfirmOpen}
        onOpenChange={setResetTrafficConfirmOpen}
        title="确认重置流量"
        description={ruleToResetTraffic ? `确认重置规则 "${ruleToResetTraffic.name}" 的流量统计吗？` : ''}
        confirmText="重置"
        cancelText="取消"
        onConfirm={handleResetTrafficConfirm}
      />
    </AdminLayout>
  );
};
