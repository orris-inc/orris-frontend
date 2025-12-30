/**
 * 节点管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState, useMemo } from 'react';
import { Server, Plus, RefreshCw, Users } from 'lucide-react';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { NodeInstallScriptDialog } from '@/features/nodes/components/NodeInstallScriptDialog';
import { useNodesPage } from '@/features/nodes/hooks/useNodes';
import { useResourceGroups } from '@/features/resource-groups/hooks/useResourceGroups';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import { usePageTitle } from '@/shared/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
  usePageTitle('节点管理');

  // Responsive breakpoint
  const { isMobile } = useBreakpoint();

  const {
    nodes,
    pagination,
    isFetching,
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
    handlePageChange,
    handlePageSizeChange,
    includeUserNodes,
    handleIncludeUserNodesChange,
  } = useNodesPage();

  // Get resource group list for displaying names
  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

  // Prepare nodes list for route outbound selection
  const nodesForOutbound = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.name,
    }));
  }, [nodes]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [installScriptNodeName, setInstallScriptNodeName] = useState<string>('');
  const [copyNodeData, setCopyNodeData] = useState<Partial<CreateNodeRequest> | undefined>(undefined);

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

  const handleCopy = (node: Node) => {
    // Build copy data, exclude unique fields like id, add suffix to name
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

  return (
    <AdminLayout>
      <AdminPageLayout
        title="节点管理"
        description="管理系统中的所有代理节点"
        icon={Server}
      >
        {/* Toolbar - Compact on mobile */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          {/* Left: User nodes toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="flex items-center gap-1 cursor-pointer text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Users className="size-3.5 sm:size-4 text-slate-500" strokeWidth={1.5} />
                <span className="hidden sm:inline">用户节点</span>
                <Switch
                  checked={includeUserNodes}
                  onCheckedChange={handleIncludeUserNodesChange}
                >
                  <SwitchThumb />
                </Switch>
              </label>
            </TooltipTrigger>
            <TooltipContent>显示用户节点</TooltipContent>
          </Tooltip>

          {/* Right: Refresh + Add */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  icon={
                    <RefreshCw
                      className={`size-3.5 sm:size-4 ${isFetching ? 'animate-spin' : ''}`}
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
                setCopyNodeData(undefined);
                setCreateDialogOpen(true);
              }}
            >
              <span className="hidden sm:inline">新增节点</span>
              <span className="sm:hidden text-xs">新增</span>
            </AdminButton>
          </div>
        </div>

        {/* Node list - No AdminCard wrapper on mobile */}
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
            />
          </AdminCard>
        )}
      </AdminPageLayout>

      {/* 新增节点对话框 */}
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

      {/* 编辑节点对话框 */}
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

      {/* 节点详情对话框 */}
      <NodeDetailDialog
        open={detailDialogOpen}
        node={selectedNode}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedNode(null);
        }}
        nodes={nodesForOutbound}
      />

      {/* Token显示对话框 */}
      <TokenDialog
        open={tokenDialogOpen}
        token={generatedToken?.token ?? null}
        title="节点Token"
        onClose={() => {
          setTokenDialogOpen(false);
          setGeneratedToken(null);
        }}
      />

      {/* 安装脚本对话框 */}
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
    </AdminLayout>
  );
};
