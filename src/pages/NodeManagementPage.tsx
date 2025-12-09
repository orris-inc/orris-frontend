/**
 * 节点管理页面（管理端）
 * 使用统一的精致商务风格组件
 */

import { useState } from 'react';
import { Server, Plus, RefreshCw } from 'lucide-react';
import { NodeListTable } from '@/features/nodes/components/NodeListTable';
import { EditNodeDialog } from '@/features/nodes/components/EditNodeDialog';
import { CreateNodeDialog } from '@/features/nodes/components/CreateNodeDialog';
import { NodeDetailDialog } from '@/features/nodes/components/NodeDetailDialog';
import { NodeInstallScriptDialog } from '@/features/nodes/components/NodeInstallScriptDialog';
import { useNodesPage } from '@/features/nodes/hooks/useNodes';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { TokenDialog } from '@/components/common/TokenDialog';
import {
  AdminPageLayout,
  AdminButton,
  AdminCard,
} from '@/components/admin';
import type { Node, UpdateNodeRequest, CreateNodeRequest } from '@/api/node';

export const NodeManagementPage = () => {
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
  } = useNodesPage();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [installScriptNodeName, setInstallScriptNodeName] = useState<string>('');

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

  const handleUpdateSubmit = async (id: number | string, data: UpdateNodeRequest) => {
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
              onClick={() => setCreateDialogOpen(true)}
            >
              新增节点
            </AdminButton>
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
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onGenerateToken={handleTokenGenerate}
            onGetInstallScript={handleInstallScript}
            onViewDetail={handleViewDetail}
          />
        </AdminCard>
      </AdminPageLayout>

      {/* 新增节点对话框 */}
      <CreateNodeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
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
