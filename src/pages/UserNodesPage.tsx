/**
 * User nodes management page
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { TokenDialog } from '@/components/common/TokenDialog';
import { usePageTitle } from '@/shared/hooks';
import {
  useUserNodesPage,
  useUserNodeUsage,
  useUserNodeInstallScript,
} from '@/features/user-nodes/hooks/useUserNodes';
import { UserNodeList } from '@/features/user-nodes/components/UserNodeList';
import { UserNodeUsageCard } from '@/features/user-nodes/components/UserNodeUsageCard';
import { CreateUserNodeDialog } from '@/features/user-nodes/components/CreateUserNodeDialog';
import { EditUserNodeDialog } from '@/features/user-nodes/components/EditUserNodeDialog';
import { UserNodeDetailDialog } from '@/features/user-nodes/components/UserNodeDetailDialog';
import { UserNodeInstallScriptDialog } from '@/features/user-nodes/components/UserNodeInstallScriptDialog';
import type {
  UserNode,
  CreateUserNodeRequest,
  CreateUserNodeResponse,
  UpdateUserNodeRequest,
  RegenerateUserNodeTokenResponse,
} from '@/api/node';

export const UserNodesPage = () => {
  usePageTitle('我的节点');

  const {
    nodes,
    pagination,
    isLoading,
    selectedNode,
    setSelectedNode,
    createNode,
    updateNode,
    deleteNode,
    regenerateToken,
    isDeleting,
    isRegeneratingToken,
  } = useUserNodesPage();

  // Fetch user node usage/quota
  const {
    nodeCount,
    nodeLimit,
    isLoading: isUsageLoading,
  } = useUserNodeUsage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [installScriptNode, setInstallScriptNode] = useState<UserNode | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Fetch install script for selected node
  const {
    installScript,
    isLoading: isInstallScriptLoading,
  } = useUserNodeInstallScript(installScriptNode?.id ?? null);

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleEditClick = (node: UserNode) => {
    setSelectedNode(node);
    setEditDialogOpen(true);
  };

  const handleViewDetail = (node: UserNode) => {
    setSelectedNode(node);
    setDetailDialogOpen(true);
  };

  const handleInstallScript = (node: UserNode) => {
    setInstallScriptNode(node);
    setInstallScriptDialogOpen(true);
  };

  const handleDeleteClick = async (node: UserNode) => {
    try {
      await deleteNode(node.id);
    } catch {
      // Error handled in hook
    }
  };

  const handleRegenerateToken = async (node: UserNode) => {
    try {
      const response: RegenerateUserNodeTokenResponse = await regenerateToken(node.id);
      setCurrentToken(response.token);
      setTokenDialogOpen(true);
    } catch {
      // Error handled in hook
    }
  };

  const handleCreateSubmit = async (data: CreateUserNodeRequest): Promise<CreateUserNodeResponse> => {
    const response = await createNode(data);
    return response;
  };

  const handleTokenReceived = (response: CreateUserNodeResponse) => {
    setCurrentToken(response.token);
    setTokenDialogOpen(true);
  };

  const handleEditSubmit = async (id: string, data: UpdateUserNodeRequest) => {
    try {
      await updateNode(id, data);
      setEditDialogOpen(false);
      setSelectedNode(null);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">我的节点</h1>
          <p className="text-muted-foreground">管理您的代理节点</p>
        </div>

        {/* Usage card */}
        <UserNodeUsageCard
          nodeCount={nodeCount}
          nodeLimit={nodeLimit}
          isLoading={isLoading || isUsageLoading}
        />

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              共 {pagination.total} 个节点
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            新增节点
          </Button>
        </div>

        {/* Node list */}
        <UserNodeList
          nodes={nodes}
          isLoading={isLoading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onRegenerateToken={handleRegenerateToken}
          onViewDetail={handleViewDetail}
          onInstallScript={handleInstallScript}
          onDeleting={isDeleting}
          onRegeneratingToken={isRegeneratingToken}
        />
      </div>

      {/* Create node dialog */}
      <CreateUserNodeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        onTokenReceived={handleTokenReceived}
      />

      {/* Edit node dialog */}
      <EditUserNodeDialog
        open={editDialogOpen}
        node={selectedNode}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedNode(null);
        }}
        onSubmit={handleEditSubmit}
      />

      {/* Node detail dialog */}
      <UserNodeDetailDialog
        open={detailDialogOpen}
        node={selectedNode}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedNode(null);
        }}
      />

      {/* Token display dialog */}
      <TokenDialog
        open={tokenDialogOpen}
        token={currentToken}
        title="节点 Token"
        onClose={() => {
          setTokenDialogOpen(false);
          setCurrentToken(null);
        }}
      />

      {/* Install script dialog */}
      <UserNodeInstallScriptDialog
        open={installScriptDialogOpen}
        installScriptData={installScript}
        nodeName={installScriptNode?.name}
        isLoading={isInstallScriptLoading}
        onClose={() => {
          setInstallScriptDialogOpen(false);
          setInstallScriptNode(null);
        }}
      />
    </DashboardLayout>
  );
};
