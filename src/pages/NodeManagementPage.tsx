/**
 * Node Management Page (Admin)
 * Tailwind UI Application UI style
 */

import { useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Plus,
  RefreshCw,
  ArrowUpCircle,
  Activity,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { CreateNodeSheet } from '@/features/nodes/components/CreateNodeSheet';
import { EditNodeSheet } from '@/features/nodes/components/EditNodeSheet';
import { DeleteNodeSheet } from '@/features/nodes/components/DeleteNodeSheet';
import { MobileNodeManagement } from '@/features/nodes/components/MobileNodeManagement';
import { useNodesPage, useBroadcastNodeAPIURL, useNotifyNodeAPIURL } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

// Lazy load dialog components
const CreateNodeDialog = lazy(() =>
  import('@/features/nodes/components/CreateNodeDialog').then((m) => ({
    default: m.CreateNodeDialog,
  }))
);
const EditNodeDialog = lazy(() =>
  import('@/features/nodes/components/EditNodeDialog').then((m) => ({
    default: m.EditNodeDialog,
  }))
);
const NodeDetailDialog = lazy(() =>
  import('@/features/nodes/components/NodeDetailDialog').then((m) => ({
    default: m.NodeDetailDialog,
  }))
);
const NodeInstallScriptDialog = lazy(() =>
  import('@/features/nodes/components/NodeInstallScriptDialog').then((m) => ({
    default: m.NodeInstallScriptDialog,
  }))
);
const BatchUpdateDialog = lazy(() =>
  import('@/features/nodes/components/BatchUpdateDialog').then((m) => ({
    default: m.BatchUpdateDialog,
  }))
);
const BroadcastNodeURLDialog = lazy(() =>
  import('@/features/nodes/components/BroadcastNodeURLDialog').then((m) => ({
    default: m.BroadcastNodeURLDialog,
  }))
);
const TokenDialog = lazy(() =>
  import('@/components/common/TokenDialog').then((m) => ({
    default: m.TokenDialog,
  }))
);

export const NodeManagementPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('nav.nodeAgent'));

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

  const { resourceGroups, isLoading: isResourceGroupsLoading } = useResourceGroups({ pageSize: 100 });
  const { plans, isLoading: isPlansLoading } = useSubscriptionPlans({ pageSize: 100 });

  // Filter out forward type plans, only show node/hybrid types
  const filteredResourceGroups = useMemo(() => {
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans]);

  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof filteredResourceGroups[0]> = {};
    filteredResourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [filteredResourceGroups]);

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
      if (window.confirm(t('admin.nodes.confirmDelete', { name: node.name, address: node.serverAddress, port: node.agentPort }))) {
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
      name: `${node.name} - ${t('common.actions.copy')}`,
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
            loading={isFetching || isReordering || isResourceGroupsLoading || isPlansLoading}
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
            onDragEnd={handleDragEnd}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Page Header - Tailwind UI Application UI style */}
          <PageHeader
            title={t('nav.nodeAgent')}
            icon={Server}
            metadata={[
              { icon: Server, text: `${stats.total} ${t('admin.nodes.nodesUnit')}` },
              { icon: Activity, text: `${stats.online} ${t('common.status.online')}` },
              { icon: CheckCircle2, text: `${stats.active} ${t('common.status.active')}` },
            ]}
            action={
              <div className="flex items-center gap-2">
                {/* Batch actions */}
                {stats.online > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setBroadcastURLDialogOpen(true)}>
                    <Radio className="size-4 mr-2" />
                    {t('admin.nodes.broadcast.label')}
                  </Button>
                )}
                {stats.updatable > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setBatchUpdateDialogOpen(true)}>
                    <ArrowUpCircle className="size-4 mr-2" />
                    {t('admin.nodes.update')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="size-9"
                >
                  <RefreshCw
                    key={refreshKey}
                    className="size-4 animate-spin-once"
                  />
                  <span className="sr-only">{t('common.actions.refresh')}</span>
                </Button>
                <Button
                  onClick={() => {
                    setCopyNodeData(undefined);
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-2" />
                  {t('admin.nodes.addNode')}
                </Button>
              </div>
            }
          />

          {/* Filter toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch checked={includeUserNodes} onCheckedChange={handleIncludeUserNodesChange}>
                <SwitchThumb />
              </Switch>
              <span className="text-muted-foreground">{t('admin.nodes.userNodes')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Switch checked={dragSortEnabled} onCheckedChange={setDragSortEnabled} disabled={isReordering}>
                <SwitchThumb />
              </Switch>
              <span className="text-muted-foreground">{t('common.table.sort')}</span>
            </label>
          </div>

          {/* Node List - table has its own border/rounded styling */}
          <NodeListTable
            nodes={nodes}
            loading={isFetching || isReordering || isResourceGroupsLoading || isPlansLoading}
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
        createDialogOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )
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
        editDialogOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )
      )}

      {/* Node Detail Dialog */}
      {detailDialogOpen && (
        <Suspense fallback={null}>
          <NodeDetailDialog
            open={detailDialogOpen}
            node={selectedNode}
            onClose={() => {
              setDetailDialogOpen(false);
              setSelectedNode(null);
            }}
            nodes={nodesForOutbound}
          />
        </Suspense>
      )}

      {/* Token Dialog */}
      {tokenDialogOpen && (
        <Suspense fallback={null}>
          <TokenDialog
            open={tokenDialogOpen}
            token={generatedToken?.token ?? null}
            title={t('admin.nodes.nodeToken')}
            onClose={() => {
              setTokenDialogOpen(false);
              setGeneratedToken(null);
            }}
          />
        </Suspense>
      )}

      {/* Install Script Dialog */}
      {installScriptDialogOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Batch Update Dialog */}
      {batchUpdateDialogOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Broadcast URL Dialog */}
      {(broadcastURLDialogOpen || notifyURLNode !== null) && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

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
