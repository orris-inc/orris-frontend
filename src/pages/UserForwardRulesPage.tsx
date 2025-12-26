/**
 * User Forward Rules Management Page
 */

import { useState } from 'react';
import { Plus, AlertCircle, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/common/Button';
import { usePageTitle } from '@/shared/hooks';
import {
  useUserForwardRulesPage,
  UserForwardUsageCard,
  UserForwardRuleList,
  CreateUserForwardRuleDialog,
  EditUserForwardRuleDialog,
} from '@/features/user-forward-rules';
import type { ForwardRule, CreateForwardRuleRequest, UpdateForwardRuleRequest } from '@/api/forward';
import { canCreateMoreRules } from '@/api/forward';

export const UserForwardRulesPage = () => {
  usePageTitle('端口转发');

  const {
    forwardRules,
    pagination,
    isLoading,
    usage,
    isUsageLoading,
    agentsMap,
    selectedRule,
    setSelectedRule,
    createForwardRule,
    updateForwardRule,
    deleteForwardRule,
    enableForwardRule,
    disableForwardRule,
    isCreating,
    isUpdating,
    isDeleting,
    isEnabling,
    isDisabling,
    handlePageChange,
    handlePageSizeChange,
  } = useUserForwardRulesPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if user has no subscription (no allowed types)
  const hasNoSubscription = usage && usage.allowedTypes.length === 0;

  // Check if rule limit is reached (ruleLimit=0 means unlimited)
  const isAtLimit = usage ? !canCreateMoreRules(usage) : false;

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleEditClick = (rule: ForwardRule) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (rule: ForwardRule) => {
    try {
      await deleteForwardRule(rule.id);
    } catch {
      // Error already handled in hook
    }
  };

  const handleToggleStatus = async (rule: ForwardRule) => {
    try {
      if (rule.status === 'enabled') {
        await disableForwardRule(rule.id);
      } else {
        await enableForwardRule(rule.id);
      }
    } catch {
      // Error already handled in hook
    }
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    try {
      await createForwardRule(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleEditSubmit = async (id: string, data: UpdateForwardRuleRequest) => {
    try {
      await updateForwardRule(id, data);
      setEditDialogOpen(false);
      setSelectedRule(null);
    } catch {
      // Error already handled in hook
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">端口转发</h1>
          <p className="text-muted-foreground">管理您的端口转发规则</p>
        </div>

        {/* No subscription prompt */}
        {hasNoSubscription && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 rounded-full bg-amber-500/10 mb-6">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">暂无可用的转发服务</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              您当前没有包含端口转发功能的订阅计划。购买订阅后即可使用端口转发服务。
            </p>
            <Button asChild>
              <Link to="/pricing" className="gap-2">
                <Zap className="h-4 w-4" />
                查看订阅计划
              </Link>
            </Button>
          </div>
        )}

        {/* Show normal content when subscription exists */}
        {!hasNoSubscription && (
          <>
            {/* Usage quota card */}
            <UserForwardUsageCard usage={usage} isLoading={isUsageLoading} />

            {/* Rule limit reached warning */}
            {isAtLimit && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">已达到规则数量上限</p>
                  <p className="text-sm text-muted-foreground">
                    您已创建了 {usage?.ruleCount} 条规则，达到了订阅计划的上限。如需创建更多规则，请升级您的订阅计划。
                  </p>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  共 {pagination.total} 条规则
                </p>
              </div>
              <Button
                onClick={handleCreateClick}
                disabled={isAtLimit || isUsageLoading}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                新增规则
              </Button>
            </div>

            {/* Rule list */}
            <UserForwardRuleList
              rules={forwardRules}
              agentsMap={agentsMap}
              isLoading={isLoading}
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
              onEnabling={isEnabling}
              onDisabling={isDisabling}
              onDeleting={isDeleting}
            />
          </>
        )}
      </div>

      {/* Create rule dialog */}
      <CreateUserForwardRuleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        allowedTypes={usage?.allowedTypes || []}
        isCreating={isCreating}
      />

      {/* Edit rule dialog */}
      <EditUserForwardRuleDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRule(null);
        }}
        onSubmit={handleEditSubmit}
        rule={selectedRule}
        isUpdating={isUpdating}
      />
    </DashboardLayout>
  );
};
