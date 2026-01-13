/**
 * Node Management Page (Admin)
 * High-density data management interface
 */

import { useState, useMemo } from 'react';
import {
  Server,
  Plus,
  RefreshCw,
  Users,
  ArrowUpCircle,
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
  GripVertical,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { CreateNodeSheet } from '@/features/nodes/components/CreateNodeSheet';
import { EditNodeSheet } from '@/features/nodes/components/EditNodeSheet';
import { DeleteNodeSheet } from '@/features/nodes/components/DeleteNodeSheet';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { NodeInstallScriptDialog } from '@/features/nodes/components/NodeInstallScriptDialog';
import { BatchUpdateDialog } from '@/features/nodes/components/BatchUpdateDialog';
import { BroadcastNodeURLDialog } from '@/features/nodes/components/BroadcastNodeURLDialog';
import { MobileNodeManagement } from '@/features/nodes/components/MobileNodeManagement';
import { useNodesPage, useBroadcastNodeAPIURL, useNotifyNodeAPIURL } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import { AdminButton, AdminCard } from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
  usePageTitle('节点Agent');

  const { isMobile } = useBreakpoint();

  const {
    nodes,
    pagination,
    isFetching,
    isBatchUpdating,
    isReordering,
    refetch,
    createNode,
    updateNode,
    deleteNode,
    updateNodeStatus,
    toggleMuteNotification,
    handleGenerateToken,
    generatedToken,
    setGeneratedToken,
    handleGetInstallScript,
    installScriptData,
    setInstallScriptData,
    handleBatchUpdate,
    batchUpdateResult,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    includeUserNodes,
    handleIncludeUserNodesChange,
    handleReorder,
  } = useNodesPage();

  const broadcastURLMutation = useBroadcastNodeAPIURL();
  const notifyURLMutation = useNotifyNodeAPIURL();

  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  const nodesForOutbound = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.name,
    }));
  }, [nodes]);

  const stats = useMemo(() => {
    const total = pagination.total;
    const online = nodes.filter((n) => n.isOnline).length;
    const active = nodes.filter((n) => n.status === 'active').length;
    const inactive = nodes.filter((n) => n.status === 'inactive').length;
    const updatable = nodes.filter((n) => n.hasUpdate && n.isOnline).length;
    return { total, online, active, inactive, updatable };
  }, [nodes, pagination.total]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [installScriptNodeName, setInstallScriptNodeName] = useState<string>('');
  const [copyNodeData, setCopyNodeData] = useState<Partial<CreateNodeRequest> | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [batchUpdateDialogOpen, setBatchUpdateDialogOpen] = useState(false);
  const [broadcastURLDialogOpen, setBroadcastURLDialogOpen] = useState(false);
  const [notifyURLNode, setNotifyURLNode] = useState<Node | null>(null);
  const [dragSortEnabled, setDragSortEnabled] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);

  const handleEdit = (node: Node) => {
    setSelectedNode(node);
    setEditDialogOpen(true);
  };

  const handleDelete = async (node: Node) => {
    if (isMobile) {
      setNodeToDelete(node);
      setDeleteDialogOpen(true);
    } else {
      if (window.confirm(`确认删除节点 "${node.name}" (${node.serverAddress}:${node.agentPort}) 吗？此操作不可恢复。`)) {
        await deleteNode(node.id);
      }
    }
  };

  const handleDeleteConfirm = async (node: Node) => {
    await deleteNode(node.id);
  };

  const handleActivate = async (node: Node) => {
    await updateNodeStatus(node.id, 'active');
  };

  const handleDeactivate = async (node: Node) => {
    await updateNodeStatus(node.id, 'inactive');
  };

  const handleTokenGenerate = async (node: Node) => {
    const token = await handleGenerateToken(node.id);
    if (token) {
      setTokenDialogOpen(true);
    }
  };

  const handleInstallScript = async (node: Node) => {
    setInstallScriptNodeName(node.name);
    const data = await handleGetInstallScript(node.id);
    if (data) {
      setInstallScriptDialogOpen(true);
    }
  };

  const handleViewDetail = (node: Node) => {
    setSelectedNode(node);
    setDetailDialogOpen(true);
  };

  const handleNotifyURL = (node: Node) => {
    setNotifyURLNode(node);
  };

  const handleCopy = (node: Node) => {
    const copyData: Partial<CreateNodeRequest> = {
      name: `${node.name} - 副本`,
      protocol: node.protocol,
      serverAddress: node.serverAddress,
      agentPort: node.agentPort,
      subscriptionPort: node.subscriptionPort,
      encryptionMethod: node.encryptionMethod,
      region: node.region,
      sortOrder: node.sortOrder,
      tags: node.tags,
      plugin: node.plugin,
      pluginOpts: node.pluginOpts,
      transportProtocol: node.transportProtocol,
      host: node.host,
      path: node.path,
      sni: node.sni,
      allowInsecure: node.allowInsecure,
    };
    setCopyNodeData(copyData);
    setCreateDialogOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  const handleCreateSubmit = async (data: CreateNodeRequest) => {
    try {
      await createNode(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleUpdateSubmit = async (id: string, data: UpdateNodeRequest) => {
    await updateNode(id, data);
    // State cleanup is handled by onOpenChange callback
  };

  const handleToggleMute = (node: Node) => {
    toggleMuteNotification(node.id, !node.muteNotification);
  };

  const handleDragEnd = async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;

    // Calculate new sortOrder values for affected nodes
    const updates: { id: string; sortOrder: number }[] = [];

    // Create a copy of nodes array and reorder
    const reorderedNodes = [...nodes];
    const [movedNode] = reorderedNodes.splice(oldIndex, 1);
    reorderedNodes.splice(newIndex, 0, movedNode);

    // Update sortOrder for all affected nodes (use index as sortOrder)
    reorderedNodes.forEach((node, index) => {
      const newSortOrder = index + 1;
      if (node.sortOrder !== newSortOrder) {
        updates.push({ id: node.id, sortOrder: newSortOrder });
      }
    });

    if (updates.length > 0) {
      await handleReorder(updates);
    }
  };

  return (
    <AdminLayout>
      {/* Mobile View */}
      {isMobile ? (
        <div className="py-3">
          <MobileNodeManagement
            nodes={nodes}
            resourceGroupsMap={resourceGroupsMap}
            loading={isFetching || isReordering}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={() => {
              setCopyNodeData(undefined);
              setCreateDialogOpen(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onPageChange={handlePageChange}
            enableDragSort={dragSortEnabled}
            onDragSortChange={setDragSortEnabled}
            onDragEnd={handleDragEnd}
          />
        </div>
      ) : (
        <div className="py-3 space-y-3">
          {/* High-Density Status Bar - All metrics inline */}
          <header className="bg-card rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Title + Primary Stats */}
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-semibold text-foreground">节点Agent</h1>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Server className="size-3" />
                    <span className="font-medium text-foreground">{stats.total}</span>
                    <span className="hidden sm:inline">节点</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="size-3 text-success" />
                    <span className="font-medium text-success">{stats.online}</span>
                    <span className="hidden lg:inline text-muted-foreground">在线</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-info" />
                    <span className="font-medium text-info">{stats.active}</span>
                  </span>
                </div>
              </div>

              {/* Center: Secondary Stats + Filters */}
              <div className="hidden md:flex items-center gap-3 text-xs">
                {stats.inactive > 0 && (
                  <span className="flex items-center gap-1.5">
                    <XCircle className="size-3 text-muted-foreground" />
                    <span className="text-muted-foreground">未激活</span>
                    <span className="font-semibold tabular-nums text-foreground">{stats.inactive}</span>
                  </span>
                )}
                {stats.updatable > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ArrowUpCircle className="size-3 text-warning" />
                    <span className="text-muted-foreground">可更新</span>
                    <span className="font-semibold tabular-nums text-warning">{stats.updatable}</span>
                  </span>
                )}
                <div className="h-3 w-px bg-border" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <Users className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                      <span className="hidden lg:inline text-muted-foreground group-hover:text-foreground transition-colors">
                        用户节点
                      </span>
                      <Switch
                        checked={includeUserNodes}
                        onCheckedChange={handleIncludeUserNodesChange}
                        className="scale-75"
                      >
                        <SwitchThumb />
                      </Switch>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>显示用户创建的节点</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <GripVertical className={`size-3 transition-colors ${dragSortEnabled ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} strokeWidth={1.5} />
                      <span className="hidden lg:inline text-muted-foreground group-hover:text-foreground transition-colors">
                        排序
                      </span>
                      <Switch
                        checked={dragSortEnabled}
                        onCheckedChange={setDragSortEnabled}
                        disabled={isReordering}
                        className="scale-75"
                      >
                        <SwitchThumb />
                      </Switch>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    {dragSortEnabled ? '关闭拖拽排序' : '开启拖拽排序'}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5">
                {stats.online > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setBroadcastURLDialogOpen(true)}
                        className="h-7 px-2 text-xs border-info/30 hover:border-info/50 hover:bg-info/10"
                        icon={<Radio className="size-3.5 text-info" strokeWidth={1.5} />}
                      >
                        <span className="hidden lg:inline text-info">下发</span>
                      </AdminButton>
                    </TooltipTrigger>
                    <TooltipContent>向 {stats.online} 个在线节点下发新API地址</TooltipContent>
                  </Tooltip>
                )}

                {stats.updatable > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchUpdateDialogOpen(true)}
                        className="h-7 px-2 text-xs border-warning/30 hover:border-warning/50 hover:bg-warning-muted"
                        icon={<ArrowUpCircle className="size-3.5 text-warning" strokeWidth={1.5} />}
                      >
                        <span className="hidden lg:inline text-warning">更新</span>
                      </AdminButton>
                    </TooltipTrigger>
                    <TooltipContent>更新 {stats.updatable} 个节点</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="h-7 w-7 p-0"
                      icon={
                        <RefreshCw
                          key={refreshKey}
                          className="size-3.5 animate-spin-once"
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
                  className="h-7 px-2.5 text-xs"
                  icon={<Plus className="size-3.5" strokeWidth={2} />}
                  onClick={() => {
                    setCopyNodeData(undefined);
                    setCreateDialogOpen(true);
                  }}
                >
                  新增节点
                </AdminButton>
              </div>
            </div>
          </header>

          {/* Node List */}
          <AdminCard noPadding>
            <NodeListTable
              nodes={nodes}
              loading={isFetching || isReordering}
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              resourceGroupsMap={resourceGroupsMap}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onGenerateToken={handleTokenGenerate}
              onGetInstallScript={handleInstallScript}
              onViewDetail={handleViewDetail}
              onCopy={handleCopy}
              onNotifyURL={handleNotifyURL}
              onToggleMute={handleToggleMute}
              enableDragSort={dragSortEnabled}
              onDragEnd={handleDragEnd}
            />
          </AdminCard>
        </div>
      )}

      {/* Create Node Dialog/Sheet */}
      {isMobile ? (
        <CreateNodeSheet
          open={createDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setCopyNodeData(undefined);
            }
          }}
          onSubmit={handleCreateSubmit}
          initialData={copyNodeData}
          nodes={nodesForOutbound}
        />
      ) : (
        <CreateNodeDialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setCopyNodeData(undefined);
          }}
          onSubmit={handleCreateSubmit}
          initialData={copyNodeData}
          nodes={nodesForOutbound}
        />
      )}

      {/* Edit Node Dialog/Sheet */}
      {isMobile ? (
        <EditNodeSheet
          open={editDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditDialogOpen(false);
              setSelectedNode(null);
            }
          }}
          entity={selectedNode}
          onSubmit={handleUpdateSubmit}
          nodes={nodesForOutbound}
        />
      ) : (
        <EditNodeDialog
          open={editDialogOpen}
          node={selectedNode}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedNode(null);
          }}
          onSubmit={handleUpdateSubmit}
          nodes={nodesForOutbound}
        />
      )}

      {/* Node Detail Dialog */}
      <NodeDetailDialog
        open={detailDialogOpen}
        node={selectedNode}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedNode(null);
        }}
        nodes={nodesForOutbound}
      />

      {/* Token Dialog */}
      <TokenDialog
        open={tokenDialogOpen}
        token={generatedToken?.token ?? null}
        title="节点Token"
        onClose={() => {
          setTokenDialogOpen(false);
          setGeneratedToken(null);
        }}
      />

      {/* Install Script Dialog */}
      <NodeInstallScriptDialog
        open={installScriptDialogOpen}
        installScriptData={installScriptData}
        nodeName={installScriptNodeName}
        onClose={() => {
          setInstallScriptDialogOpen(false);
          setInstallScriptData(null);
          setInstallScriptNodeName('');
        }}
      />

      {/* Batch Update Dialog */}
      <BatchUpdateDialog
        open={batchUpdateDialogOpen}
        onClose={() => {
          setBatchUpdateDialogOpen(false);
          setBatchUpdateResult(null);
        }}
        nodes={nodes}
        onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
        isUpdating={isBatchUpdating}
        result={batchUpdateResult}
      />

      {/* Broadcast URL Dialog */}
      <BroadcastNodeURLDialog
        open={broadcastURLDialogOpen || notifyURLNode !== null}
        onClose={() => {
          setBroadcastURLDialogOpen(false);
          setNotifyURLNode(null);
        }}
        onBroadcast={(newUrl, reason) => broadcastURLMutation.mutateAsync({ newUrl, reason })}
        isBroadcasting={broadcastURLMutation.isPending}
        onlineCount={stats.online}
        targetNode={notifyURLNode ? {
          id: notifyURLNode.id,
          name: notifyURLNode.name,
          isOnline: notifyURLNode.isOnline,
        } : null}
        onNotifySingle={(nodeId, newUrl, reason) =>
          notifyURLMutation.mutateAsync({ nodeId, data: { newUrl, reason } })
        }
        isNotifying={notifyURLMutation.isPending}
      />

      {/* Delete Node Confirmation Sheet (Mobile only) */}
      <DeleteNodeSheet
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setNodeToDelete(null);
          }
        }}
        entity={nodeToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};
