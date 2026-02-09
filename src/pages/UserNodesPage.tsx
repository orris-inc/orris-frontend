/**
 * User nodes management page
 * Modern Bento Grid layout with node stats and management
 */

import { lazy, Suspense, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  AlertCircle,
  Zap,
  Server,
  Wifi,
  WifiOff,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Link } from 'react-router';

import type {
  UserNode,
  CreateUserNodeRequest,
  CreateUserNodeResponse,
  UpdateUserNodeRequest,
  RegenerateUserNodeTokenResponse,
} from '@/api/node';
import { Button } from '@/components/common/Button';
import { Progress } from '@/components/common/Progress';
import { TokenDialog } from '@/components/common/TokenDialog';
import { useUserForwardUsage } from '@/features/user-forward-rules/hooks/useUserForwardRules';
import { UserNodeList } from '@/features/user-nodes/components/UserNodeList';
import {
  useUserNodesPage,
  useUserNodeUsage,
  useUserNodeInstallScript,
  useUserBatchInstallScript,
} from '@/features/user-nodes/hooks/useUserNodes';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { cn } from '@/lib/utils';
import { cardStyles } from '@/lib/ui-styles';
import { usePageTitle } from '@/shared/hooks';
import {
  BentoStatCard,
  SectionHeader,
  EmptyState,
  QuickActionLink,
} from '@/components/common/bento';

const CreateUserNodeDialog = lazy(() =>
  import('@/features/user-nodes/components/CreateUserNodeDialog').then((m) => ({
    default: m.CreateUserNodeDialog,
  }))
);

const EditUserNodeDialog = lazy(() =>
  import('@/features/user-nodes/components/EditUserNodeDialog').then((m) => ({
    default: m.EditUserNodeDialog,
  }))
);

const UserNodeDetailDialog = lazy(() =>
  import('@/features/user-nodes/components/UserNodeDetailDialog').then((m) => ({
    default: m.UserNodeDetailDialog,
  }))
);

const UserNodeInstallScriptDialog = lazy(() =>
  import('@/features/user-nodes/components/UserNodeInstallScriptDialog').then((m) => ({
    default: m.UserNodeInstallScriptDialog,
  }))
);

const BatchInstallScriptDialog = lazy(() =>
  import('@/shared/components/agent').then((m) => ({ default: m.BatchInstallScriptDialog }))
);

export const UserNodesPage = () => {
  const { t } = useTranslation();
  usePageTitle(t('userNodes.title'));

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

  const {
    nodeCount,
    nodeLimit,
    isLoading: isUsageLoading,
  } = useUserNodeUsage();

  const { usage: forwardUsage, isLoading: isForwardUsageLoading } = useUserForwardUsage();

  const hasNoSubscription = forwardUsage && forwardUsage.allowedTypes.length === 0;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [installScriptDialogOpen, setInstallScriptDialogOpen] = useState(false);
  const [installScriptNode, setInstallScriptNode] = useState<UserNode | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [batchInstallDialogOpen, setBatchInstallDialogOpen] = useState(false);

  const {
    getBatchInstallScript,
    isLoading: isBatchInstallLoading,
    data: batchInstallData,
    reset: resetBatchInstall,
  } = useUserBatchInstallScript();

  const {
    installScript,
    isLoading: isInstallScriptLoading,
  } = useUserNodeInstallScript(installScriptNode?.id ?? null);

  const nodeStats = useMemo(() => {
    const onlineCount = nodes.filter((n) => n.isOnline).length;
    const offlineCount = nodes.filter((n) => !n.isOnline).length;
    const isUnlimited = !nodeLimit || nodeLimit === 0;
    const usagePercent = isUnlimited ? 0 : Math.min((nodeCount / nodeLimit) * 100, 100);
    const isNearLimit = !isUnlimited && usagePercent >= 80;
    const isAtLimit = !isUnlimited && nodeCount >= nodeLimit;

    return {
      total: pagination.total,
      online: onlineCount,
      offline: offlineCount,
      isUnlimited,
      usagePercent,
      isNearLimit,
      isAtLimit,
    };
  }, [nodes, nodeCount, nodeLimit, pagination.total]);

  const isPageLoading = isLoading || isUsageLoading || isForwardUsageLoading;

  const heroStatusMessage = useMemo(() => {
    if (isPageLoading || hasNoSubscription) return undefined;
    return nodeStats.total > 0
      ? t('userNodes.stats.summary', { total: nodeStats.total, online: nodeStats.online })
      : t('userNodes.stats.noNodes');
  }, [isPageLoading, hasNoSubscription, nodeStats.total, nodeStats.online, t]);

  const handleCreateClick = () => setCreateDialogOpen(true);

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

  const handleBatchInstallScript = async () => {
    const nodeIds = nodes.map((n) => n.id);
    if (nodeIds.length === 0) return;
    const data = await getBatchInstallScript(nodeIds);
    if (data) {
      setBatchInstallDialogOpen(true);
    }
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
    <DashboardLayout
      pageTitle={t('userNodes.title')}
      pageDescription={
        <div className="space-y-1">
          <div>{t('userNodes.subtitle')}</div>
          {heroStatusMessage && <div>{heroStatusMessage}</div>}
        </div>
      }
      pageActions={
        <div className="flex items-center gap-2">
          {nodeStats.total > 1 && (
            <Button
              onClick={handleBatchInstallScript}
              size="sm"
              variant="outline"
              className="gap-1.5 touch-target h-9 px-3"
              disabled={isBatchInstallLoading}
            >
              <Terminal className="size-4" />
              <span className="hidden sm:inline">{t('userNodes.installScript.batchTitle')}</span>
            </Button>
          )}
          <Button
            onClick={handleCreateClick}
            size="sm"
            className="gap-1.5 touch-target h-9 px-3"
            disabled={nodeStats.isAtLimit}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t('userNodes.addNode')}</span>
            <span className="sm:hidden">{t('common.actions.create')}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-safe">

        {/* No subscription prompt */}
        {hasNoSubscription && (
          <EmptyState
            icon={AlertCircle}
            title={t('userNodes.noSubscription.title')}
            description={t('userNodes.noSubscription.description')}
            variant="warning"
            action={
              <Button asChild className="touch-target">
                <Link to="/dashboard/pricing" className="gap-2">
                  <Zap className="size-4" />
                  {t('userNodes.noSubscription.viewPlans')}
                </Link>
              </Button>
            }
          />
        )}

        {/* Show normal content when subscription exists */}
        {!hasNoSubscription && (
          <>
            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Node Quota Card - Custom with Progress bar */}
              <div className={cn('col-span-2 p-4 sm:p-5 transition-shadow hover:shadow-md', cardStyles)}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg ring-1',
                      nodeStats.isAtLimit
                        ? 'bg-destructive/10 ring-destructive/20'
                        : nodeStats.isNearLimit
                          ? 'bg-warning/10 ring-warning/20'
                          : 'bg-primary/10 ring-primary/20'
                    )}
                  >
                    <Server
                      className={cn(
                        'size-4 sm:size-5',
                        nodeStats.isAtLimit
                          ? 'text-destructive'
                          : nodeStats.isNearLimit
                            ? 'text-warning'
                            : 'text-primary'
                      )}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('userNodes.stats.quota')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={cn(
                      'text-2xl sm:text-3xl font-bold tabular-nums text-foreground',
                      nodeStats.isAtLimit && 'text-destructive',
                      nodeStats.isNearLimit && !nodeStats.isAtLimit && 'text-warning'
                    )}
                  >
                    {nodeCount}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    / {nodeStats.isUnlimited ? '∞' : nodeLimit}
                  </span>
                </div>
                {!nodeStats.isUnlimited && (
                  <Progress
                    value={nodeStats.usagePercent}
                    className={cn(
                      'h-2',
                      nodeStats.isAtLimit
                        ? '[&>div]:bg-destructive'
                        : nodeStats.isNearLimit
                          ? '[&>div]:bg-warning'
                          : ''
                    )}
                  />
                )}
              </div>

              {/* Online Nodes */}
              <BentoStatCard
                icon={Wifi}
                label={t('common.status.online')}
                value={isPageLoading ? '-' : nodeStats.online}
                unit={t('userNodes.stats.nodes')}
                variant="success"
              />

              {/* Offline Nodes */}
              <BentoStatCard
                icon={WifiOff}
                label={t('common.status.offline')}
                value={isPageLoading ? '-' : nodeStats.offline}
                unit={t('userNodes.stats.nodes')}
                variant="muted"
              />
            </section>

            {/* Nodes Section */}
            <section>
              <SectionHeader
                icon={Server}
                title={t('userNodes.myNodes')}
                count={!isPageLoading ? nodeStats.total : undefined}
              />

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
            </section>

            {/* Quick Actions */}
            {!isPageLoading && nodeStats.total > 0 && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickActionLink
                  to="/dashboard/forward-agents"
                  icon={Server}
                  title={t('userNodes.quickActions.viewAgents')}
                  description={t('userNodes.quickActions.viewAgentsDesc')}
                  variant="primary"
                />
                <QuickActionLink
                  to="/dashboard/pricing"
                  icon={Sparkles}
                  title={t('userNodes.quickActions.upgradePlan')}
                  description={t('userNodes.quickActions.upgradePlanDesc')}
                  variant="success"
                />
              </section>
            )}
          </>
        )}
      </div>

      {/* Create node dialog */}
      {createDialogOpen && (
        <Suspense fallback={null}>
          <CreateUserNodeDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSubmit={handleCreateSubmit}
            onTokenReceived={handleTokenReceived}
          />
        </Suspense>
      )}

      {/* Edit node dialog */}
      {editDialogOpen && (
        <Suspense fallback={null}>
          <EditUserNodeDialog
            open={editDialogOpen}
            node={selectedNode}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedNode(null);
            }}
            onSubmit={handleEditSubmit}
          />
        </Suspense>
      )}

      {/* Node detail dialog */}
      {detailDialogOpen && (
        <Suspense fallback={null}>
          <UserNodeDetailDialog
            open={detailDialogOpen}
            node={selectedNode}
            onClose={() => {
              setDetailDialogOpen(false);
              setSelectedNode(null);
            }}
          />
        </Suspense>
      )}

      {/* Token display dialog */}
      <TokenDialog
        open={tokenDialogOpen}
        token={currentToken}
        title={t('userNodes.tokenTitle')}
        onClose={() => {
          setTokenDialogOpen(false);
          setCurrentToken(null);
        }}
      />

      {/* Install script dialog */}
      {installScriptDialogOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Batch install script dialog */}
      {batchInstallDialogOpen && (
        <Suspense fallback={null}>
          <BatchInstallScriptDialog
            open={batchInstallDialogOpen}
            data={batchInstallData}
            nodeCount={nodeStats.total}
            i18nNamespace="userNodes.installScript"
            onClose={() => {
              setBatchInstallDialogOpen(false);
              resetBatchInstall();
            }}
          />
        </Suspense>
      )}
    </DashboardLayout>
  );
};
