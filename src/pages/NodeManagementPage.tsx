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
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
  usePageTitle('节点管理');

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

  // 获取资源组列表用于显示名称
  const { resourceGroups } = useResourceGroups({ pageSize: 100 });
  const resourceGroupsMap = useMemo(() => {
    const map: Record<string, typeof resourceGroups[0]> = {};
    resourceGroups.forEach((group) => {
      map[group.sid] = group;
    });
    return map;
  }, [resourceGroups]);

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
    // 构建复制数据，排除 id 等唯一字段，名称添加后缀
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
      // 错误已在 hook 中处理
    }
  };

  const handleUpdateSubmit = async (id: string, data: UpdateNodeRequest) => {
    try {
      await updateNode(id, data);
      setEditDialogOpen(false);
      setSelectedNode(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="节点管理"
        description="管理系统中的所有代理节点"
        icon={Server}
        action={
          <div className="flex items-center gap-4">
            {/* 显示用户节点开关 */}
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <Users className="size-4" strokeWidth={1.5} />
              <span>显示用户节点</span>
              <Switch
                checked={includeUserNodes}
                onCheckedChange={handleIncludeUserNodesChange}
              >
                <SwitchThumb />
              </Switch>
            </label>

            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AdminButton
                    variant="outline"
                    size="md"
                    onClick={handleRefresh}
                    disabled={isFetching}
                    icon={<RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
                  >
                    刷新
                  </AdminButton>
                </TooltipTrigger>
                <TooltipContent>刷新节点列表</TooltipContent>
              </Tooltip>
              <AdminButton
                variant="primary"
                icon={<Plus className="size-4" strokeWidth={1.5} />}
                onClick={() => {
                  setCopyNodeData(undefined);
                  setCreateDialogOpen(true);
                }}
              >
                新增节点
              </AdminButton>
            </div>
          </div>
        }
      >
        {/* 节点列表表格 */}
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
      />

      {/* 节点详情对话框 */}
      <NodeDetailDialog
        open={detailDialogOpen}
        node={selectedNode}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedNode(null);
        }}
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
