/**
 * Resource Group Detail Dialog
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Cpu,
  Loader2,
  Plus,
  Trash2,
  Hash,
  FileText,
  CreditCard,
  Clock,
  Copy,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import { AdminBadge } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { useNotificationStore } from '@/shared/stores/notification-store';
import { useGroupNodes, useGroupForwardAgents, useGroupForwardRules, useGroupMemberManagement } from '../hooks/useResourceGroups';
import { AddMembersDialog } from './AddMembersDialog';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

import { formatDateTime } from '@/shared/utils/date-utils';

// Detail item component
const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: string;
  copySuccessMessage?: string;
}> = ({ icon, label, value, copyable, copySuccessMessage }) => {
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess(copySuccessMessage ?? 'Copied to clipboard');
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</div>
        <div className="text-sm text-slate-900 dark:text-white break-all">{value}</div>
      </div>
      {copyable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

interface ResourceGroupDetailDialogProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  plansMap: Record<string, SubscriptionPlan>;
  onClose: () => void;
}

export const ResourceGroupDetailDialog: React.FC<ResourceGroupDetailDialogProps> = ({
  open,
  resourceGroup,
  plansMap,
  onClose,
}) => {
  const { t } = useTranslation();
  // Member selection state
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set());
  const [addNodesDialogOpen, setAddNodesDialogOpen] = useState(false);
  const [addAgentsDialogOpen, setAddAgentsDialogOpen] = useState(false);
  const [addRulesDialogOpen, setAddRulesDialogOpen] = useState(false);

  // Get member lists
  const { nodes, isLoading: isLoadingNodes, pagination: nodesPagination, refetch: refetchNodes } = useGroupNodes({
    groupId: resourceGroup?.sid ?? null,
    pageSize: 50,
    enabled: open && !!resourceGroup,
  });

  const { forwardAgents, isLoading: isLoadingAgents, pagination: agentsPagination, refetch: refetchAgents } = useGroupForwardAgents({
    groupId: resourceGroup?.sid ?? null,
    pageSize: 50,
    enabled: open && !!resourceGroup,
  });

  const { forwardRules, isLoading: isLoadingRules, pagination: rulesPagination, refetch: refetchRules } = useGroupForwardRules({
    groupId: resourceGroup?.sid ?? null,
    pageSize: 50,
    enabled: open && !!resourceGroup,
  });

  // Member management actions
  const {
    addNodes,
    removeNodes,
    addAgents,
    removeAgents,
    addRules,
    removeRules,
    isAddingNodes,
    isRemovingNodes,
    isAddingAgents,
    isRemovingAgents,
    isAddingRules,
    isRemovingRules,
  } = useGroupMemberManagement(resourceGroup?.sid ?? null);

  // Node selection actions
  const handleToggleNode = (id: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllNodes = () => {
    if (selectedNodeIds.size === nodes.length) {
      setSelectedNodeIds(new Set());
    } else {
      setSelectedNodeIds(new Set(nodes.map((n) => n.id)));
    }
  };

  const handleRemoveSelectedNodes = async () => {
    if (selectedNodeIds.size === 0) return;
    await removeNodes(Array.from(selectedNodeIds));
    setSelectedNodeIds(new Set());
    refetchNodes();
  };

  const handleAddNodes = async (nodeIds: string[]) => {
    await addNodes(nodeIds);
    setAddNodesDialogOpen(false);
    refetchNodes();
  };

  // Forward agent selection actions
  const handleToggleAgent = (id: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllAgents = () => {
    if (selectedAgentIds.size === forwardAgents.length) {
      setSelectedAgentIds(new Set());
    } else {
      setSelectedAgentIds(new Set(forwardAgents.map((a) => a.id)));
    }
  };

  const handleRemoveSelectedAgents = async () => {
    if (selectedAgentIds.size === 0) return;
    await removeAgents(Array.from(selectedAgentIds));
    setSelectedAgentIds(new Set());
    refetchAgents();
  };

  const handleAddAgents = async (agentIds: string[]) => {
    await addAgents(agentIds);
    setAddAgentsDialogOpen(false);
    refetchAgents();
  };

  // Forward rule selection actions
  const handleToggleRule = (id: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllRules = () => {
    if (selectedRuleIds.size === forwardRules.length) {
      setSelectedRuleIds(new Set());
    } else {
      setSelectedRuleIds(new Set(forwardRules.map((r) => r.id)));
    }
  };

  const handleRemoveSelectedRules = async () => {
    if (selectedRuleIds.size === 0) return;
    await removeRules(Array.from(selectedRuleIds));
    setSelectedRuleIds(new Set());
    refetchRules();
  };

  const handleAddRules = async (ruleIds: string[]) => {
    await addRules(ruleIds);
    setAddRulesDialogOpen(false);
    refetchRules();
  };

  // Clean up selection state on close
  const handleClose = () => {
    setSelectedNodeIds(new Set());
    setSelectedAgentIds(new Set());
    setSelectedRuleIds(new Set());
    onClose();
  };

  if (!resourceGroup) {
    return null;
  }

  const plan = plansMap[resourceGroup.planId];
  const planType = plan?.planType;

  // Business logic (2026-01-08):
  // - forward plan: can only bind forward agents
  // - node/hybrid plan: can bind nodes and forward rules
  const canBindNodes = planType !== 'forward';
  const canBindAgents = planType === 'forward';
  const canBindRules = planType !== 'forward';

  // Calculate tab count for grid layout (static mapping for Tailwind CSS)
  const tabCount = 1 + (canBindNodes ? 1 : 0) + (canBindAgents ? 1 : 0) + (canBindRules ? 1 : 0);
  const gridColsClass = tabCount === 2 ? 'grid-cols-2' : tabCount === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {resourceGroup.name}
              <AdminBadge variant={resourceGroup.status === 'active' ? 'success' : 'default'}>
                {resourceGroup.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
              </AdminBadge>
            </DialogTitle>
            <DialogDescription>
              SID: {resourceGroup.sid}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className={`grid w-full ${gridColsClass}`}>
              <TabsTrigger value="info">{t('resourceGroups.tabs.basicInfo')}</TabsTrigger>
              {canBindNodes && (
                <TabsTrigger value="nodes">
                  {t('resourceGroups.tabs.nodes')} ({nodesPagination.total})
                </TabsTrigger>
              )}
              {canBindAgents && (
                <TabsTrigger value="agents">
                  {t('resourceGroups.tabs.forwardAgents')} ({agentsPagination.total})
                </TabsTrigger>
              )}
              {canBindRules && (
                <TabsTrigger value="rules">
                  {t('resourceGroups.tabs.forwardRules')} ({rulesPagination.total})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="space-y-4 py-2">
              {/* Identification info */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">{t('resourceGroups.sections.identificationInfo')}</h4>
                <DetailItem
                  icon={<Hash className="size-4" />}
                  label={t('common.labels.sid')}
                  value={<code className="text-xs font-mono">{resourceGroup.sid}</code>}
                  copyable={resourceGroup.sid}
                  copySuccessMessage={t('common.messages.copySuccess')}
                />
              </div>

              <Separator />

              {/* Associated plan */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">{t('resourceGroups.sections.associatedPlan')}</h4>
                {plan ? (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="size-4 text-slate-500" />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {plan.slug}
                    </code>
                  </div>
                ) : (
                  <DetailItem
                    icon={<CreditCard className="size-4" />}
                    label={t('resourceGroups.labels.planId')}
                    value={resourceGroup.planId}
                  />
                )}
                {/* Resource binding rules hint */}
                {planType && (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                    <Info className="size-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                      {planType === 'forward'
                        ? t('resourceGroups.planHints.forward')
                        : planType === 'hybrid'
                          ? t('resourceGroups.planHints.hybrid')
                          : t('resourceGroups.planHints.node')}
                    </p>
                  </div>
                )}
              </div>

              {resourceGroup.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">{t('common.fields.description')}</h4>
                    <DetailItem
                      icon={<FileText className="size-4" />}
                      label={t('common.fields.description')}
                      value={resourceGroup.description}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Time info */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">{t('resourceGroups.sections.timeInfo')}</h4>
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label={t('common.fields.createdAt')}
                  value={formatDateTime(resourceGroup.createdAt)}
                />
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label={t('common.fields.updatedAt')}
                  value={formatDateTime(resourceGroup.updatedAt)}
                />
              </div>

              {/* Resource statistics */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">{t('resourceGroups.sections.resourceStats')}</h4>
                <div className={`grid gap-3 ${canBindNodes && canBindRules ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {canBindNodes && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Server className="size-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('resourceGroups.labels.associatedNodes')}</p>
                        <p className="text-sm font-medium">{nodesPagination.total} {t('resourceGroups.unit')}</p>
                      </div>
                    </div>
                  )}
                  {canBindAgents && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Cpu className="size-4 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('resourceGroups.labels.forwardAgents')}</p>
                        <p className="text-sm font-medium">{agentsPagination.total} {t('resourceGroups.unit')}</p>
                      </div>
                    </div>
                  )}
                  {canBindRules && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <ArrowRightLeft className="size-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('resourceGroups.labels.forwardRules')}</p>
                        <p className="text-sm font-medium">{rulesPagination.total} {t('resourceGroups.unit')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {canBindNodes && (
              <TabsContent value="nodes" className="mt-4 space-y-3">
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {nodes.length > 0 && (
                      <>
                        <Checkbox
                          checked={selectedNodeIds.size === nodes.length && nodes.length > 0}
                          onCheckedChange={handleToggleAllNodes}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedNodeIds.size > 0 ? t('common.selected', { count: selectedNodeIds.size }) : t('common.actions.selectAll')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedNodeIds.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSelectedNodes}
                        disabled={isRemovingNodes}
                      >
                        {isRemovingNodes ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="size-4 mr-1" />
                        )}
                        {t('resourceGroups.actions.remove')} ({selectedNodeIds.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddNodesDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addNode')}
                    </Button>
                  </div>
                </div>

                {/* Nodes list */}
                {isLoadingNodes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : nodes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Server className="size-8 mb-2" />
                    <p className="text-sm">{t('resourceGroups.empty.noNodes')}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => setAddNodesDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addNode')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {nodes.map((node) => (
                      <label
                        key={node.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedNodeIds.has(node.id)
                            ? 'bg-primary/10'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={selectedNodeIds.has(node.id)}
                          onCheckedChange={() => handleToggleNode(node.id)}
                        />
                        <Server className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{node.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{node.id}</p>
                        </div>
                        <Badge variant={node.status === 'active' ? 'default' : 'secondary'}>
                          {node.status === 'active' ? t('common.status.active') : t('common.status.inactive')}
                        </Badge>
                      </label>
                    ))}
                    {nodesPagination.total > nodes.length && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {t('resourceGroups.pagination.showingOfTotal', { showing: nodes.length, total: nodesPagination.total, type: t('resourceGroups.tabs.nodes') })}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            {canBindAgents && (
              <TabsContent value="agents" className="mt-4 space-y-3">
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {forwardAgents.length > 0 && (
                      <>
                        <Checkbox
                          checked={selectedAgentIds.size === forwardAgents.length && forwardAgents.length > 0}
                          onCheckedChange={handleToggleAllAgents}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedAgentIds.size > 0 ? t('common.selected', { count: selectedAgentIds.size }) : t('common.actions.selectAll')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAgentIds.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSelectedAgents}
                        disabled={isRemovingAgents}
                      >
                        {isRemovingAgents ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="size-4 mr-1" />
                        )}
                        {t('resourceGroups.actions.remove')} ({selectedAgentIds.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddAgentsDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addForwardAgent')}
                    </Button>
                  </div>
                </div>

                {/* Forward agents list */}
                {isLoadingAgents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : forwardAgents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Cpu className="size-8 mb-2" />
                    <p className="text-sm">{t('resourceGroups.empty.noAgents')}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => setAddAgentsDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addForwardAgent')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {forwardAgents.map((agent) => (
                      <label
                        key={agent.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedAgentIds.has(agent.id)
                            ? 'bg-primary/10'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={selectedAgentIds.has(agent.id)}
                          onCheckedChange={() => handleToggleAgent(agent.id)}
                        />
                        <Cpu className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{agent.id}</p>
                        </div>
                        <Badge variant={agent.status === 'enabled' ? 'default' : 'secondary'}>
                          {agent.status === 'enabled' ? t('common.status.enabled') : t('common.status.disabled')}
                        </Badge>
                      </label>
                    ))}
                    {agentsPagination.total > forwardAgents.length && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {t('resourceGroups.pagination.showingOfTotal', { showing: forwardAgents.length, total: agentsPagination.total, type: t('resourceGroups.tabs.forwardAgents') })}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            {canBindRules && (
              <TabsContent value="rules" className="mt-4 space-y-3">
                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {forwardRules.length > 0 && (
                      <>
                        <Checkbox
                          checked={selectedRuleIds.size === forwardRules.length && forwardRules.length > 0}
                          onCheckedChange={handleToggleAllRules}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedRuleIds.size > 0 ? t('common.selected', { count: selectedRuleIds.size }) : t('common.actions.selectAll')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRuleIds.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSelectedRules}
                        disabled={isRemovingRules}
                      >
                        {isRemovingRules ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="size-4 mr-1" />
                        )}
                        {t('resourceGroups.actions.remove')} ({selectedRuleIds.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddRulesDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addForwardRule')}
                    </Button>
                  </div>
                </div>

                {/* Forward rules list */}
                {isLoadingRules ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : forwardRules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="size-8 mb-2" />
                    <p className="text-sm">{t('resourceGroups.empty.noRules')}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => setAddRulesDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t('resourceGroups.actions.addForwardRule')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {forwardRules.map((rule) => (
                      <label
                        key={rule.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedRuleIds.has(rule.id)
                            ? 'bg-primary/10'
                            : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={selectedRuleIds.has(rule.id)}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <ArrowRightLeft className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{rule.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {rule.protocol.toUpperCase()}:{rule.listenPort} · {rule.id}
                          </p>
                        </div>
                        <Badge variant={rule.status === 'enabled' ? 'default' : 'secondary'}>
                          {rule.status === 'enabled' ? t('common.status.enabled') : t('common.status.stopped')}
                        </Badge>
                      </label>
                    ))}
                    {rulesPagination.total > forwardRules.length && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        {t('resourceGroups.pagination.showingOfTotal', { showing: forwardRules.length, total: rulesPagination.total, type: t('resourceGroups.tabs.forwardRules') })}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add nodes dialog */}
      {canBindNodes && (
        <AddMembersDialog
          open={addNodesDialogOpen}
          type="nodes"
          groupName={resourceGroup.name}
          existingMemberIds={nodes.map((n) => n.id)}
          onClose={() => setAddNodesDialogOpen(false)}
          onSubmit={handleAddNodes}
          isSubmitting={isAddingNodes}
        />
      )}

      {/* Add forward agents dialog */}
      {canBindAgents && (
        <AddMembersDialog
          open={addAgentsDialogOpen}
          type="agents"
          groupName={resourceGroup.name}
          existingMemberIds={forwardAgents.map((a) => a.id)}
          onClose={() => setAddAgentsDialogOpen(false)}
          onSubmit={handleAddAgents}
          isSubmitting={isAddingAgents}
        />
      )}

      {/* Add forward rules dialog */}
      {canBindRules && (
        <AddMembersDialog
          open={addRulesDialogOpen}
          type="rules"
          groupName={resourceGroup.name}
          existingMemberIds={forwardRules.map((r) => r.id)}
          onClose={() => setAddRulesDialogOpen(false)}
          onSubmit={handleAddRules}
          isSubmitting={isAddingRules}
        />
      )}
    </>
  );
};
