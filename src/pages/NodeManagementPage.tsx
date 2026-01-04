/**
 * Node Management Page (Admin)
 * Uses unified refined business style components
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
} from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Separator } from '@/components/common/Separator';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { NodeInstallScriptDialog } from '@/features/nodes/components/NodeInstallScriptDialog';
import { BatchUpdateDialog } from '@/features/nodes/components/BatchUpdateDialog';
import { BroadcastNodeURLDialog } from '@/features/nodes/components/BroadcastNodeURLDialog';
import { useNodesPage, useBroadcastNodeAPIURL, useNotifyNodeAPIURL } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import {
  AdminButton,
  AdminCard,
  PageStatsCard,
  type PageStatsCardProps,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
  usePageTitle('节点管理');

  const { isMobile } = useBreakpoint();

  const {
    nodes,
    pagination,
    isFetching,
    isBatchUpdating,
    refetch,
    createNode,
    updateNode,
    deleteNode,
    updateNodeStatus,
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

  const nodeStats = useMemo(() => {
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

  const handleEdit = (node: Node) => {
    setSelectedNode(node);
    setEditDialogOpen(true);
  };

  const handleDelete = async (node: Node) => {
    if (window.confirm(`确认删除节点 "${node.name}" (${node.serverAddress}:${node.agentPort}) 吗？此操作不可恢复。`)) {
      await deleteNode(node.id);
    }
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
    try {
      await updateNode(id, data);
      setEditDialogOpen(false);
      setSelectedNode(null);
    } catch {
      // Error already handled in hook
    }
  };

  const statsCards: PageStatsCardProps[] = [
    {
      title: '节点总数',
      value: nodeStats.total,
      icon: <Server className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '在线节点',
      value: nodeStats.online,
      icon: <Activity className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-success-muted',
      iconColor: 'text-success',
      showPulse: nodeStats.online > 0,
    },
    {
      title: '激活节点',
      value: nodeStats.active,
      icon: <CheckCircle2 className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-info-muted',
      iconColor: 'text-info',
    },
    {
      title: '未激活节点',
      value: nodeStats.inactive,
      icon: <XCircle className="size-4" strokeWidth={1.5} />,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    ...(nodeStats.updatable > 0
      ? [
          {
            title: '可更新',
            value: nodeStats.updatable,
            icon: <ArrowUpCircle className="size-4" strokeWidth={1.5} />,
            iconBg: 'bg-warning-muted',
            iconColor: 'text-warning',
          },
        ]
      : []),
  ];

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
                节点管理
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理和监控所有代理节点
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
                    包含用户节点
                  </span>
                  <Switch
                    checked={includeUserNodes}
                    onCheckedChange={handleIncludeUserNodesChange}
                  >
                    <SwitchThumb />
                  </Switch>
                </label>
              </TooltipTrigger>
              <TooltipContent>显示用户创建的节点</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {nodeStats.online > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setBroadcastURLDialogOpen(true)}
                    icon={<Radio className="size-4 text-blue-500" strokeWidth={1.5} />}
                    className="border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <span className="hidden sm:inline text-blue-500">下发地址</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>
                  向 {nodeStats.online} 个在线节点下发新API地址
                </TooltipContent>
              </Tooltip>
            )}

            {nodes.some((n) => n.hasUpdate && n.isOnline) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchUpdateDialogOpen(true)}
                    icon={<ArrowUpCircle className="size-4 text-warning" strokeWidth={1.5} />}
                    className="border-warning/30 hover:border-warning/50 hover:bg-warning-muted"
                  >
                    <span className="hidden sm:inline text-warning">批量更新</span>
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>
                  更新 {nodes.filter((n) => n.hasUpdate && n.isOnline).length} 个节点
                </TooltipContent>
              </Tooltip>
            )}

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
                setCopyNodeData(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <span className="hidden sm:inline">新增节点</span>
              <span className="sm:hidden">新增</span>
            </AdminButton>
          </div>
        </div>

        {/* Node List */}
        {isMobile ? (
          <NodeListTable
            nodes={nodes}
            loading={isFetching}
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
          />
        ) : (
          <AdminCard noPadding>
            <NodeListTable
              nodes={nodes}
              loading={isFetching}
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
            />
          </AdminCard>
        )}
      </div>

      {/* Create Node Dialog */}
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

      {/* Edit Node Dialog */}
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
        onlineCount={nodeStats.online}
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
    </AdminLayout>
  );
};
