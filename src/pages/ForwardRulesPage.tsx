/**
 * Forward Rules Management Page (Admin)
 * Uses unified refined business style components
 */

import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  RotateCw,
  Activity,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Separator } from '@/components/common/Separator';
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
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
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

  const { forwardAgents } = useForwardAgents();
  const { nodes } = useNodes({ pageSize: 100 });
  const { polledStatusMap, pollingRuleIds, startPolling } = useRuleStatusPolling();
  const { isMobile } = useBreakpoint();

  const ruleStats = useMemo(() => {
    const total = pagination.total;
    const enabled = forwardRules.filter((r) => r.status === 'enabled').length;
    const disabled = forwardRules.filter((r) => r.status === 'disabled').length;
    const syncing = forwardRules.filter((r) => r.syncStatus === 'pending').length;
    const running = forwardRules.filter((r) => r.runStatus === 'running').length;
    return { total, enabled, disabled, syncing, running };
  }, [forwardRules, pagination.total]);

  const statsCards: PageStatsCardProps[] = [
    {
      title: '规则总数',
      value: ruleStats.total,
      icon: <ArrowLeftRight className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '已启用',
      value: ruleStats.enabled,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: ruleStats.enabled > 0,
    },
    {
      title: '已禁用',
      value: ruleStats.disabled,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    ...(ruleStats.syncing > 0
      ? [
          {
            title: '同步中',
            value: ruleStats.syncing,
            icon: <RotateCw className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-warning-muted',
            iconColor: 'text-warning',
          },
        ]
      : []),
    ...(ruleStats.running > 0
      ? [
          {
            title: '运行中',
            value: ruleStats.running,
            icon: <Activity className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-info-muted',
            iconColor: 'text-info',
          },
        ]
      : []),
  ];

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
    const filteredChainAgentIds = rule.chainAgentIds
      ? rule.chainAgentIds.filter((id) => id !== rule.agentId)
      : undefined;

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
      <div className="py-6 sm:py-8">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  实时数据
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                转发规则管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理系统中的所有端口转发规则
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {statsCards.map((stat, index) => (
              <PageStatsCard key={index} {...stat} loading={isFetching} />
            ))}
          </div>
        </header>

        <Separator className="mb-5 sm:mb-6" />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Users className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                  <span className="hidden sm:inline text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    包含用户规则
                  </span>
                  <Switch
                    checked={includeUserRules}
                    onCheckedChange={handleIncludeUserRulesChange}
                  >
                    <SwitchThumb />
                  </Switch>
                </label>
              </TooltipTrigger>
              <TooltipContent>显示用户创建的规则</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  icon={
                    <RefreshCw
                      key={refreshKey}
                      className="size-4 animate-spin-once"
                      strokeWidth={1.5}
                    />
                  }
                >
                  <span className="sr-only">刷新</span>
                </AdminButton>
              </TooltipTrigger>
              <TooltipContent>刷新列表</TooltipContent>
            </Tooltip>

            <AdminButton
              variant="primary"
              size="sm"
              icon={<Plus className="size-4" strokeWidth={2} />}
              onClick={() => {
                setCopyRuleData(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <span className="hidden sm:inline">新增规则</span>
              <span className="sm:hidden">新增</span>
            </AdminButton>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mb-4 sm:mb-5">
          <ForwardRuleFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {/* Forward Rules List */}
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
      </div>

      {/* Create Forward Rule Dialog */}
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

      {/* Edit Forward Rule Dialog */}
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

      {/* Forward Rule Detail Dialog */}
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

      {/* Probe Result Dialog */}
      <ProbeResultDialog
        open={probeDialogOpen}
        onOpenChange={setProbeDialogOpen}
        rule={probingRule}
        probeResult={probeResult}
        isProbing={probingRuleId !== null}
        agents={forwardAgents}
        nodes={nodes}
      />

      {/* Delete Confirm Dialog */}
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

      {/* Reset Traffic Confirm Dialog */}
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
