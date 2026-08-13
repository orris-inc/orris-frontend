/**
 * Node Management Page (Admin)
 * Tailwind Application UI style
 * Mobile-first responsive design
 */

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-client';
import {
  Plus,
  RefreshCw,
  ArrowUpCircle,
  Radio,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { StatsPill, PageToolbar, FloatingActionBar } from '@/components/admin';
import { adminContentStyles } from '@/lib/ui-styles';
import { usePageTitle } from '@/shared/hooks';
import { computeSortOrderUpdates } from '@/shared/utils/sort-order-utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { NodeFilters } from '@/features/nodes/components/NodeFilters';
import { CreateNodeSheet } from '@/features/nodes/components/CreateNodeSheet';
import { EditNodeSheet } from '@/features/nodes/components/EditNodeSheet';
import { DeleteNodeSheet } from '@/features/nodes/components/DeleteNodeSheet';
import { MobileNodeManagement } from '@/features/nodes/components/MobileNodeManagement';
import { useNodesPage, useBroadcastNodeAPIURL, useNotifyNodeAPIURL } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { useSubscriptionPlans } from '@/features/subscription-plans/hooks/useSubscriptionPlans';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';
import type { RowSelectionState } from '@/components/admin';

// Lazy load dialog components
const CreateNodeDialog = lazy(() =>
  import('@/features/nodes/components/CreateNodeDialog').then((m) => ({ default: m.CreateNodeDialog }))
);
const EditNodeDialog = lazy(() =>
  import('@/features/nodes/components/EditNodeDialog').then((m) => ({ default: m.EditNodeDialog }))
);
const NodeDetailDialog = lazy(() =>
  import('@/features/nodes/components/NodeDetailDialog').then((m) => ({ default: m.NodeDetailDialog }))
);
const NodeInstallScriptDialog = lazy(() =>
  import('@/features/nodes/components/NodeInstallScriptDialog').then((m) => ({ default: m.NodeInstallScriptDialog }))
);
const NodeInstallScriptSheet = lazy(() =>
  import('@/features/nodes/components/NodeInstallScriptSheet').then((m) => ({ default: m.NodeInstallScriptSheet }))
);
const BatchUpdateDialog = lazy(() =>
  import('@/features/nodes/components/BatchUpdateDialog').then((m) => ({ default: m.BatchUpdateDialog }))
);
const BroadcastNodeURLDialog = lazy(() =>
  import('@/features/nodes/components/BroadcastNodeURLDialog').then((m) => ({ default: m.BroadcastNodeURLDialog }))
);
const TokenDialog = lazy(() =>
  import('@/components/common/TokenDialog').then((m) => ({ default: m.TokenDialog }))
);
const BatchInstallScriptDialog = lazy(() =>
  import('@/shared/components/agent').then((m) => ({ default: m.BatchInstallScriptDialog }))
);

// ============================================================================
// Types
// ============================================================================

type DialogType =
  | 'create'
  | 'edit'
  | 'detail'
  | 'delete'
  | 'token'
  | 'installScript'
  | 'batchInstallScript'
  | 'batchUpdate'
  | 'broadcast'
  | 'notifyURL'
  | null;

// ============================================================================
// Main Component
// ============================================================================

export function NodeManagementPage() {
  const { t } = useTranslation();
  usePageTitle(t('nav.nodeAgent'));
  const queryClient = useQueryClient();

  const { isMobile } = useBreakpoint();

  // Node data and operations
  const {
    nodes,
    pagination,
    isFetching,
    isBatchUpdating,
    isReordering,
    isGettingBatchInstallScript,
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
    handleGetBatchInstallScript,
    batchInstallScriptData,
    setBatchInstallScriptData,
    handleBatchUpdate,
    batchUpdateResult,
    setBatchUpdateResult,
    handlePageChange,
    handlePageSizeChange,
    extendedFilters,
    hasFilters,
    handleExtendedFiltersChange,
    clearFilters,
    includeUserNodes,
    handleIncludeUserNodesChange,
    handleReorder,
  } = useNodesPage();

  const broadcastURLMutation = useBroadcastNodeAPIURL();
  const notifyURLMutation = useNotifyNodeAPIURL();

  const { resourceGroups, isLoading: isResourceGroupsLoading } = useResourceGroups({ pageSize: 100 });
  const { plans, isLoading: isPlansLoading } = useSubscriptionPlans({ pageSize: 100 });

  // Dialog state management
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copyNodeData, setCopyNodeData] = useState<Partial<CreateNodeRequest> | undefined>(undefined);
  const [installScriptNodeName, setInstallScriptNodeName] = useState('');
  const [dragSortEnabled, setDragSortEnabled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Row selection for batch operations
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedNodeIds = useMemo(() => Object.keys(rowSelection).filter((key) => rowSelection[key]), [rowSelection]);
  const selectedCount = selectedNodeIds.length;

  // Filter resource groups for node/hybrid plans only
  const filteredResourceGroups = useMemo(() => {
    if (!plans.length) return resourceGroups;
    const planTypeMap = new Map(plans.map((plan) => [plan.id, plan.planType]));
    return resourceGroups.filter((group) => {
      const planType = planTypeMap.get(group.planId);
      return planType === 'node' || planType === 'hybrid';
    });
  }, [resourceGroups, plans]);

  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, (typeof filteredResourceGroups)[0]> = {};
    filteredResourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [filteredResourceGroups]);

  const nodesForOutbound = useMemo(
    () => nodes.map((node) => ({ id: node.id, name: node.name })),
    [nodes]
  );

  // Calculate stats for conditional action buttons
  const stats = useMemo(() => {
    const online = nodes.filter((n) => n.isOnline).length;
    const offline = nodes.filter((n) => !n.isOnline && n.status !== 'maintenance').length;
    const maintenance = nodes.filter((n) => n.status === 'maintenance').length;
    const updatable = nodes.filter((n) => n.hasUpdate && n.isOnline).length;
    const onlineSubscriptions = nodes.reduce((sum, n) => sum + (n.onlineSubscriptionCount || 0), 0);
    return { total: pagination.total, online, offline, maintenance, updatable, onlineSubscriptions };
  }, [nodes, pagination.total]);

  // Dialog handlers
  const openDialog = useCallback((type: DialogType, node?: Node) => {
    if (node) {
      // Merge with cached detail data to preserve fields (dns, route, etc.)
      // that the list endpoint may omit
      const cachedDetail = queryClient.getQueryData<Node>(queryKeys.nodes.detail(node.id));
      setSelectedNode(cachedDetail ? { ...node, ...cachedDetail } : node);
    } else {
      setSelectedNode(null);
    }
    setActiveDialog(type);
  }, [queryClient]);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setSelectedNode(null);
    setCopyNodeData(undefined);
    setInstallScriptNodeName('');
  }, []);

  // Action handlers
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const handleCreate = useCallback(() => {
    setCopyNodeData(undefined);
    openDialog('create');
  }, [openDialog]);

  const handleEdit = useCallback(
    (node: Node) => openDialog('edit', node),
    [openDialog]
  );

  const handleViewDetail = useCallback(
    (node: Node) => openDialog('detail', node),
    [openDialog]
  );

  const handleDeleteClick = useCallback(
    (node: Node) => {
      if (isMobile) {
        openDialog('delete', node);
      } else if (window.confirm(t('admin.nodes.confirmDelete', { name: node.name, address: node.serverAddress, port: node.agentPort }))) {
        deleteNode(node.id);
      }
    },
    [isMobile, openDialog, deleteNode, t]
  );

  const handleCopy = useCallback(
    (node: Node) => {
      const data: Partial<CreateNodeRequest> = {
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
      setCopyNodeData(data);
      openDialog('create');
    },
    [openDialog, t]
  );

  const handleActivate = useCallback(
    async (node: Node) => {
      await updateNodeStatus(node.id, 'active');
    },
    [updateNodeStatus]
  );

  const handleDeactivate = useCallback(
    async (node: Node) => {
      await updateNodeStatus(node.id, 'inactive');
    },
    [updateNodeStatus]
  );

  const handleToggleMute = useCallback(
    (node: Node) => {
      toggleMuteNotification(node.id, !node.muteNotification);
    },
    [toggleMuteNotification]
  );

  const handleTokenGenerate = useCallback(
    async (node: Node) => {
      const token = await handleGenerateToken(node.id);
      if (token) {
        openDialog('token');
      }
    },
    [handleGenerateToken, openDialog]
  );

  const handleInstallScript = useCallback(
    async (node: Node) => {
      setInstallScriptNodeName(node.name);
      const data = await handleGetInstallScript(node.id);
      if (data) {
        openDialog('installScript');
      }
    },
    [handleGetInstallScript, openDialog]
  );

  const handleBatchInstallScriptClick = useCallback(async () => {
    if (selectedNodeIds.length === 0) return;
    const data = await handleGetBatchInstallScript(selectedNodeIds);
    if (data) {
      openDialog('batchInstallScript');
    }
  }, [selectedNodeIds, handleGetBatchInstallScript, openDialog]);

  const handleNotifyURL = useCallback(
    (node: Node) => openDialog('notifyURL', node),
    [openDialog]
  );

  // Form submission handlers
  const handleCreateSubmit = useCallback(
    async (data: CreateNodeRequest) => {
      await createNode(data);
      closeDialog();
    },
    [createNode, closeDialog]
  );

  const handleUpdateSubmit = useCallback(
    async (id: string, data: UpdateNodeRequest) => {
      await updateNode(id, data);
      closeDialog();
    },
    [updateNode, closeDialog]
  );

  const handleDeleteConfirm = useCallback(
    async (node: Node) => {
      await deleteNode(node.id);
      closeDialog();
    },
    [deleteNode, closeDialog]
  );

  // Drag and drop handler
  const handleDragEnd = useCallback(
    async (_activeId: string, _overId: string, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      const reorderedNodes = [...nodes];
      const [movedNode] = reorderedNodes.splice(oldIndex, 1);
      reorderedNodes.splice(newIndex, 0, movedNode);

      // sortOrder is one sequence shared with forward rules, so reuse the positions these
      // nodes already occupy instead of 1..N, which would push them ahead of every rule.
      const updates = computeSortOrderUpdates(
        reorderedNodes,
        (node) => node.id,
        (node) => node.sortOrder
      );

      if (updates.length > 0) {
        await handleReorder(updates);
      }
    },
    [nodes, handleReorder]
  );

  const isLoading = isFetching || isReordering || isResourceGroupsLoading || isPlansLoading;

  // Mobile layout
  if (isMobile) {
    return (
      <AdminLayout>
        <div className={adminContentStyles.mobile}>
          <MobileNodeManagement
            nodes={nodes}
            resourceGroupsMap={resourceGroupsMap}
            loading={isLoading}
            refreshing={isFetching}
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onRefresh={handleRefresh}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onPageChange={handlePageChange}
            updatableCount={stats.updatable}
            onBatchUpdate={() => openDialog('batchUpdate')}
            isBatchUpdating={isBatchUpdating}
            onDragEnd={handleDragEnd}
            onGetInstallScript={handleInstallScript}
          />
        </div>

        {/* Mobile Sheets */}
        <CreateNodeSheet
          open={activeDialog === 'create'}
          onOpenChange={(open) => !open && closeDialog()}
          onSubmit={handleCreateSubmit}
          initialData={copyNodeData}
          nodes={nodesForOutbound}
        />

        <EditNodeSheet
          open={activeDialog === 'edit'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedNode}
          onSubmit={handleUpdateSubmit}
          nodes={nodesForOutbound}
        />

        <DeleteNodeSheet
          open={activeDialog === 'delete'}
          onOpenChange={(open) => !open && closeDialog()}
          entity={selectedNode}
          onConfirm={handleDeleteConfirm}
        />

        {activeDialog === 'batchUpdate' && (
          <Suspense fallback={null}>
            <BatchUpdateDialog
              open
              onClose={() => {
                closeDialog();
                setBatchUpdateResult(null);
              }}
              nodes={nodes}
              onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
              isUpdating={isBatchUpdating}
              result={batchUpdateResult}
            />
          </Suspense>
        )}

        {activeDialog === 'installScript' && (
          <Suspense fallback={null}>
            <NodeInstallScriptSheet
              open
              installScriptData={installScriptData}
              nodeName={installScriptNodeName}
              onClose={() => {
                closeDialog();
                setInstallScriptData(null);
              }}
            />
          </Suspense>
        )}
      </AdminLayout>
    );
  }

  // Desktop layout
  return (
    <AdminLayout>
      <div className={adminContentStyles.desktop}>
        {/* Stats Overview Strip + Actions (no separate title — breadcrumbs handle it) */}
        <PageToolbar
          actions={<>
            <Button onClick={handleCreate} size="sm" className="h-8 text-[13px]">
              <Plus className="mr-1 size-3.5" />
              {t('admin.nodes.addNode')}
            </Button>
            {stats.online > 0 && (
              <Button variant="outline" size="sm" onClick={() => openDialog('broadcast')} className="h-8 text-[13px] border-border/60">
                <Radio className="mr-1 size-3.5" />
                {t('admin.nodes.broadcast.label')}
              </Button>
            )}
            {stats.updatable > 0 && (
              <Button variant="outline" size="sm" onClick={() => openDialog('batchUpdate')} className="h-8 text-[13px] border-border/60">
                <ArrowUpCircle className="mr-1 size-3.5" />
                {t('admin.nodes.update')}
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground/60 hover:text-foreground" onClick={handleRefresh}>
                  <RefreshCw key={refreshKey} className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.refresh')}</TooltipContent>
            </Tooltip>
          </>}
        >
          <StatsPill>{stats.total} {t('admin.nodes.nodesUnit')}</StatsPill>
          <StatsPill variant="success" dot>{stats.online} {t('common.status.online')}</StatsPill>
          {stats.offline > 0 && (
            <StatsPill variant="muted" dot>{stats.offline} {t('common.status.offline')}</StatsPill>
          )}
          {stats.maintenance > 0 && (
            <StatsPill variant="warning" dot>{stats.maintenance} {t('common.status.maintenance')}</StatsPill>
          )}
          {stats.onlineSubscriptions > 0 && (
            <StatsPill variant="info" icon={<Users className="size-3" />}>{stats.onlineSubscriptions} {t('admin.nodes.detail.onlineSubscriptions')}</StatsPill>
          )}
        </PageToolbar>

        {/* Filter Bar */}
        <NodeFilters
          filters={extendedFilters}
          onFiltersChange={handleExtendedFiltersChange}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          includeUserNodes={includeUserNodes}
          onIncludeUserNodesChange={handleIncludeUserNodesChange}
          dragSortEnabled={dragSortEnabled}
          onDragSortEnabledChange={setDragSortEnabled}
          dragSortDisabled={isReordering}
        />

        {/* Batch Action Bar — Stripe-style floating bottom-center */}
        {selectedCount > 0 && (
          <FloatingActionBar>
            <div className="flex items-center gap-2 text-[13px] pl-1">
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-foreground/10 text-foreground text-xs font-medium tabular-nums">
                {selectedCount}
              </span>
              <span className="text-muted-foreground">{t('admin.nodes.nodesUnit')}</span>
            </div>

            <div className="w-px h-5 bg-border/60" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchInstallScriptClick}
              disabled={isGettingBatchInstallScript}
              className="h-8 px-2.5 gap-1.5 text-[13px] border-border/60"
            >
              <Terminal className="size-3.5" />
              {t('admin.nodes.table.actions.batchInstallScript')}
            </Button>

            <div className="w-px h-5 bg-border/60" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRowSelection({})}
                  className="size-8 text-muted-foreground/70 hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.actions.cancel')}</TooltipContent>
            </Tooltip>
          </FloatingActionBar>
        )}

        {/* Node Table */}
        <NodeListTable
          nodes={nodes}
          loading={isLoading}
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          resourceGroupsMap={resourceGroupsMap}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
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
          enableRowSelection={!dragSortEnabled}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      </div>

      {/* Desktop Dialogs */}
      {activeDialog === 'create' && (
        <Suspense fallback={null}>
          <CreateNodeDialog
            open
            onClose={closeDialog}
            onSubmit={handleCreateSubmit}
            initialData={copyNodeData}
            nodes={nodesForOutbound}
          />
        </Suspense>
      )}

      {activeDialog === 'edit' && (
        <Suspense fallback={null}>
          <EditNodeDialog
            open
            node={selectedNode}
            onClose={closeDialog}
            onSubmit={handleUpdateSubmit}
            nodes={nodesForOutbound}
          />
        </Suspense>
      )}

      {activeDialog === 'detail' && (
        <Suspense fallback={null}>
          <NodeDetailDialog
            open
            node={selectedNode}
            onClose={closeDialog}
            nodes={nodesForOutbound}
          />
        </Suspense>
      )}

      {activeDialog === 'token' && (
        <Suspense fallback={null}>
          <TokenDialog
            open
            token={generatedToken?.token ?? null}
            title={t('admin.nodes.nodeToken')}
            onClose={() => {
              closeDialog();
              setGeneratedToken(null);
            }}
          />
        </Suspense>
      )}

      {activeDialog === 'installScript' && (
        <Suspense fallback={null}>
          <NodeInstallScriptDialog
            open
            installScriptData={installScriptData}
            nodeName={installScriptNodeName}
            onClose={() => {
              closeDialog();
              setInstallScriptData(null);
            }}
          />
        </Suspense>
      )}

      {activeDialog === 'batchInstallScript' && (
        <Suspense fallback={null}>
          <BatchInstallScriptDialog
            open
            data={batchInstallScriptData}
            nodeCount={selectedCount}
            i18nNamespace="admin.nodes.installScript"
            onClose={() => {
              closeDialog();
              setBatchInstallScriptData(null);
              setRowSelection({});
            }}
          />
        </Suspense>
      )}

      {activeDialog === 'batchUpdate' && (
        <Suspense fallback={null}>
          <BatchUpdateDialog
            open
            onClose={() => {
              closeDialog();
              setBatchUpdateResult(null);
            }}
            nodes={nodes}
            onBatchUpdate={(updateAll) => handleBatchUpdate({ updateAll })}
            isUpdating={isBatchUpdating}
            result={batchUpdateResult}
          />
        </Suspense>
      )}

      {(activeDialog === 'broadcast' || activeDialog === 'notifyURL') && (
        <Suspense fallback={null}>
          <BroadcastNodeURLDialog
            open
            onClose={closeDialog}
            onBroadcast={(newUrl, reason) => broadcastURLMutation.mutateAsync({ newUrl, reason })}
            isBroadcasting={broadcastURLMutation.isPending}
            onlineCount={stats.online}
            targetNode={
              activeDialog === 'notifyURL' && selectedNode
                ? { id: selectedNode.id, name: selectedNode.name, isOnline: selectedNode.isOnline }
                : null
            }
            onNotifySingle={(nodeId, newUrl, reason) =>
              notifyURLMutation.mutateAsync({ nodeId, data: { newUrl, reason } })
            }
            isNotifying={notifyURLMutation.isPending}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
}
