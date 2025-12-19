/**
 * 用户端转发规则管理页面
 */

import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
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
  } = useUserForwardRulesPage();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // 检查是否达到规则数量上限（ruleLimit=0 表示无限制）
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
      // 错误已在 hook 中处理
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
      // 错误已在 hook 中处理
    }
  };

  const handleCreateSubmit = async (data: CreateForwardRuleRequest) => {
    try {
      await createForwardRule(data);
      setCreateDialogOpen(false);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  const handleEditSubmit = async (id: string, data: UpdateForwardRuleRequest) => {
    try {
      await updateForwardRule(id, data);
      setEditDialogOpen(false);
      setSelectedRule(null);
    } catch {
      // 错误已在 hook 中处理
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">端口转发</h1>
          <p className="text-muted-foreground">管理您的端口转发规则</p>
        </div>

        {/* 配额使用情况卡片 */}
        <UserForwardUsageCard usage={usage} isLoading={isUsageLoading} />

        {/* 达到上限提示 */}
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

        {/* 操作栏 */}
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

        {/* 规则列表 */}
        <UserForwardRuleList
          rules={forwardRules}
          isLoading={isLoading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          onEnabling={isEnabling}
          onDisabling={isDisabling}
          onDeleting={isDeleting}
        />
      </div>

      {/* 创建规则对话框 */}
      <CreateUserForwardRuleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        allowedTypes={usage?.allowedTypes || []}
        isCreating={isCreating}
      />

      {/* 编辑规则对话框 */}
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
