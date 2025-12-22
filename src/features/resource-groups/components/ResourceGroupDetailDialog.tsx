/**
 * Resource Group Detail Dialog
 */

import { useState } from 'react';
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
import { useGroupNodes, useGroupForwardAgents, useGroupMemberManagement } from '../hooks/useResourceGroups';
import { AddMembersDialog } from './AddMembersDialog';
import type { ResourceGroup } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Detail item component
const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  copyable?: string;
}> = ({ icon, label, value, copyable }) => {
  const { showSuccess } = useNotificationStore();

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      showSuccess('已复制到剪贴板');
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
  // Member selection state
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [addNodesDialogOpen, setAddNodesDialogOpen] = useState(false);
  const [addAgentsDialogOpen, setAddAgentsDialogOpen] = useState(false);

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

  // Member management actions
  const {
    addNodes,
    removeNodes,
    addAgents,
    removeAgents,
    isAddingNodes,
    isRemovingNodes,
    isAddingAgents,
    isRemovingAgents,
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

  // Clean up selection state on close
  const handleClose = () => {
    setSelectedNodeIds(new Set());
    setSelectedAgentIds(new Set());
    onClose();
  };

  if (!resourceGroup) {
    return null;
  }

  const plan = plansMap[resourceGroup.planId];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {resourceGroup.name}
              <AdminBadge variant={resourceGroup.status === 'active' ? 'success' : 'default'}>
                {resourceGroup.status === 'active' ? '激活' : '未激活'}
              </AdminBadge>
            </DialogTitle>
            <DialogDescription>
              SID: {resourceGroup.sid}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">基本信息</TabsTrigger>
              <TabsTrigger value="nodes">
                节点 ({nodesPagination.total})
              </TabsTrigger>
              <TabsTrigger value="agents">
                转发代理 ({agentsPagination.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 py-2">
              {/* Identification info */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">标识信息</h4>
                <DetailItem
                  icon={<Hash className="size-4" />}
                  label="SID"
                  value={<code className="text-xs font-mono">{resourceGroup.sid}</code>}
                  copyable={resourceGroup.sid}
                />
              </div>

              <Separator />

              {/* Associated plan */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">关联计划</h4>
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
                    label="计划 ID"
                    value={resourceGroup.planId}
                  />
                )}
              </div>

              {resourceGroup.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">描述</h4>
                    <DetailItem
                      icon={<FileText className="size-4" />}
                      label="资源组描述"
                      value={resourceGroup.description}
                    />
                  </div>
                </>
              )}

              <Separator />

              {/* Time info */}
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">时间信息</h4>
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label="创建时间"
                  value={formatDate(resourceGroup.createdAt)}
                />
                <DetailItem
                  icon={<Clock className="size-4" />}
                  label="更新时间"
                  value={formatDate(resourceGroup.updatedAt)}
                />
              </div>

              {/* Resource statistics */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">资源统计</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Server className="size-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">关联节点</p>
                      <p className="text-sm font-medium">{nodesPagination.total} 个</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Cpu className="size-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">转发代理</p>
                      <p className="text-sm font-medium">{agentsPagination.total} 个</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

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
                        {selectedNodeIds.size > 0 ? `已选择 ${selectedNodeIds.size} 项` : '全选'}
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
                      移除 ({selectedNodeIds.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddNodesDialogOpen(true)}
                  >
                    <Plus className="size-4 mr-1" />
                    添加节点
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
                  <p className="text-sm">暂无关联节点</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setAddNodesDialogOpen(true)}
                  >
                    <Plus className="size-4 mr-1" />
                    添加节点
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
                        {node.status === 'active' ? '激活' : '未激活'}
                      </Badge>
                    </label>
                  ))}
                  {nodesPagination.total > nodes.length && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      显示前 {nodes.length} 个，共 {nodesPagination.total} 个节点
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

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
                        {selectedAgentIds.size > 0 ? `已选择 ${selectedAgentIds.size} 项` : '全选'}
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
                      移除 ({selectedAgentIds.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddAgentsDialogOpen(true)}
                  >
                    <Plus className="size-4 mr-1" />
                    添加转发代理
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
                  <p className="text-sm">暂无关联转发代理</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => setAddAgentsDialogOpen(true)}
                  >
                    <Plus className="size-4 mr-1" />
                    添加转发代理
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
                        {agent.status === 'enabled' ? '启用' : '禁用'}
                      </Badge>
                    </label>
                  ))}
                  {agentsPagination.total > forwardAgents.length && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      显示前 {forwardAgents.length} 个，共 {agentsPagination.total} 个转发代理
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add nodes dialog */}
      <AddMembersDialog
        open={addNodesDialogOpen}
        type="nodes"
        groupName={resourceGroup.name}
        existingMemberIds={nodes.map((n) => n.id)}
        onClose={() => setAddNodesDialogOpen(false)}
        onSubmit={handleAddNodes}
        isSubmitting={isAddingNodes}
      />

      {/* Add forward agents dialog */}
      <AddMembersDialog
        open={addAgentsDialogOpen}
        type="agents"
        groupName={resourceGroup.name}
        existingMemberIds={forwardAgents.map((a) => a.id)}
        onClose={() => setAddAgentsDialogOpen(false)}
        onSubmit={handleAddAgents}
        isSubmitting={isAddingAgents}
      />
    </>
  );
};
