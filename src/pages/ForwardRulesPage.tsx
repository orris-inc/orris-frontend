/**
 * 转发规则管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { ArrowLeftRight, Plus, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ForwardRuleListTable } from '@/features/forward-rules/components/ForwardRuleListTable';
import { CreateForwardRuleDialog } from '@/features/forward-rules/components/CreateForwardRuleDialog';
import { EditForwardRuleDialog } from '@/features/forward-rules/components/EditForwardRuleDialog';
import { ForwardRuleDetailDialog } from '@/features/forward-rules/components/ForwardRuleDetailDialog';
import { useForwardRulesPage } from '@/features/forward-rules/hooks/useForwardRules';
import { useForwardAgents } from '@/features/forward-agents/hooks/useForwardAgents';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { Button } from '@/components/common/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/Dialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest, RuleProbeResponse, ChainHopLatency } from '@/api/forward';

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
    probeRule,
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
  const [probeDialogOpen, setProbeDialogOpen] = useState(false);
  const [probeResult, setProbeResult] = useState<RuleProbeResponse | null>(null);
  const [probingRuleId, setProbingRuleId] = useState<string | null>(null);
  const [probingRule, setProbingRule] = useState<ForwardRule | null>(null);

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

  const handleProbe = async (rule: ForwardRule) => {
    setProbingRuleId(rule.id);
    setProbingRule(rule);
    setProbeResult(null);
    setProbeDialogOpen(true);
    try {
      const result = await probeRule(rule.id);
      setProbeResult(result);
    } catch {
      // 错误已在 hook 中处理
    } finally {
      setProbingRuleId(null);
    }
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
            nodes={nodes}
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
            probingRuleId={probingRuleId}
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
      <Dialog open={probeDialogOpen} onOpenChange={setProbeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>拨测结果</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {probingRuleId !== null ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="size-8 animate-spin text-blue-500 mb-3" />
                <p className="text-sm text-muted-foreground">正在拨测...</p>
              </div>
            ) : probeResult ? (
              <div className="space-y-4">
                {/* 拨测状态 */}
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  probeResult.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {probeResult.success ? (
                    <CheckCircle2 className="size-6 text-green-500" />
                  ) : (
                    <XCircle className="size-6 text-red-500" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      probeResult.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {probeResult.success ? '拨测成功' : '拨测失败'}
                    </p>
                    {probeResult.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {probeResult.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* 延迟信息 */}
                {probeResult.success && (
                  <div className="space-y-2">
                    {/* entry 类型：隧道延迟 */}
                    {probeResult.ruleType === 'entry' && probeResult.tunnelLatencyMs !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">隧道延迟 (入口→出口)</span>
                        <span className="font-mono">{probeResult.tunnelLatencyMs}ms</span>
                      </div>
                    )}
                    {/* chain/direct_chain 类型：链路每跳延迟 */}
                    {(probeResult.ruleType === 'chain' || probeResult.ruleType === 'direct_chain') &&
                      probeResult.chainLatencies && probeResult.chainLatencies.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">链路延迟</p>
                        {(() => {
                          // 获取 agent 名称
                          const getAgentName = (id: string) => {
                            const agent = forwardAgents.find(a => a.id === id);
                            return agent?.name ?? id.replace('fa_', '');
                          };
                          // 获取目标显示名称
                          const getTargetDisplay = () => {
                            if (!probingRule) return '目标';
                            if (probingRule.targetNodeId) {
                              const node = nodes.find(n => n.id === probingRule.targetNodeId);
                              if (node) {
                                const ip = probingRule.ipVersion === 'ipv4'
                                  ? probingRule.targetNodePublicIpv4
                                  : probingRule.ipVersion === 'ipv6'
                                    ? probingRule.targetNodePublicIpv6
                                    : (probingRule.targetNodeServerAddress ?? probingRule.targetNodePublicIpv4 ?? probingRule.targetNodePublicIpv6);
                                return ip ? `${node.name} (${ip})` : node.name;
                              }
                            }
                            if (probingRule.targetAddress) {
                              return `${probingRule.targetAddress}:${probingRule.targetPort}`;
                            }
                            return '目标';
                          };
                          const targetDisplay = getTargetDisplay();
                          return probeResult.chainLatencies!.map((hop: ChainHopLatency, index: number) => {
                            const fromName = getAgentName(hop.from);
                            const toName = hop.to === 'target' ? targetDisplay : getAgentName(hop.to);
                            return (
                              <div key={index} className={`flex justify-between text-sm py-1 ${!hop.success ? 'text-red-500' : ''}`}>
                                <span className="text-muted-foreground truncate max-w-[180px]" title={`${fromName} → ${toName}`}>
                                  {fromName} → {toName}
                                  {!hop.online && <span className="text-yellow-500 ml-1">(离线)</span>}
                                </span>
                                <span className="font-mono">
                                  {hop.success ? `${hop.latencyMs}ms` : hop.error ?? '失败'}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                    {/* 目标延迟 */}
                    {probeResult.targetLatencyMs !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {probeResult.ruleType === 'entry' ? '目标延迟 (出口→目标)' : '目标延迟'}
                        </span>
                        <span className="font-mono">{probeResult.targetLatencyMs}ms</span>
                      </div>
                    )}
                    {/* 总延迟 */}
                    {probeResult.totalLatencyMs !== undefined && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="font-medium">总延迟</span>
                        <span className="font-mono font-medium">{probeResult.totalLatencyMs}ms</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                拨测失败，请重试
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProbeDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};
