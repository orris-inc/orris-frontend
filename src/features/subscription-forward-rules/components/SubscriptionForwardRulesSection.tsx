/**
 * Subscription Forward Rules Section Component
 * A self-contained section for managing forward rules within a subscription
 */

import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { canSubscriptionCreateMoreRules } from '@/api/forward';
import type {
  ForwardRule,
  CreateSubscriptionForwardRuleRequest,
  UpdateSubscriptionForwardRuleRequest,
} from '@/api/forward';
import { useSubscriptionForwardRulesSection } from '../hooks/useSubscriptionForwardRules';
import { SubscriptionForwardUsageCard } from './SubscriptionForwardUsageCard';
import { SubscriptionForwardRuleList } from './SubscriptionForwardRuleList';
import { CreateSubscriptionForwardRuleDialog } from './CreateSubscriptionForwardRuleDialog';
import { EditSubscriptionForwardRuleDialog } from './EditSubscriptionForwardRuleDialog';

interface SubscriptionForwardRulesSectionProps {
  subscriptionId: string;
}

export const SubscriptionForwardRulesSection: React.FC<SubscriptionForwardRulesSectionProps> = ({
  subscriptionId,
}) => {
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
  } = useSubscriptionForwardRulesSection(subscriptionId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if no forward types allowed (subscription doesn't support forwarding)
  const hasNoForwardSupport = usage && usage.allowedTypes.length === 0;

  // Check if rule limit is reached (ruleLimit=0 means unlimited)
  const isAtLimit = usage ? !canSubscriptionCreateMoreRules(usage) : false;

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

  const handleCreateSubmit = async (data: CreateSubscriptionForwardRuleRequest) => {
    try {
      await createForwardRule(data);
      setCreateDialogOpen(false);
    } catch {
      // Error already handled in hook
    }
  };

  const handleEditSubmit = async (ruleId: string, data: UpdateSubscriptionForwardRuleRequest) => {
    try {
      await updateForwardRule(ruleId, data);
      setEditDialogOpen(false);
      setSelectedRule(null);
    } catch {
      // Error already handled in hook
    }
  };

  // If subscription doesn't support forwarding, show empty state
  if (hasNoForwardSupport) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">此订阅不支持转发功能</h3>
        <p className="text-muted-foreground text-center max-w-md">
          当前订阅计划不包含端口转发功能。如需使用转发服务，请升级到支持转发的订阅计划。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage quota card */}
      <SubscriptionForwardUsageCard usage={usage} isLoading={isUsageLoading} />

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
          <p className="text-sm text-muted-foreground">共 {pagination.total} 条规则</p>
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
      <SubscriptionForwardRuleList
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

      {/* Create rule dialog */}
      <CreateSubscriptionForwardRuleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        allowedTypes={usage?.allowedTypes || []}
        isCreating={isCreating}
      />

      {/* Edit rule dialog */}
      <EditSubscriptionForwardRuleDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedRule(null);
        }}
        onSubmit={handleEditSubmit}
        rule={selectedRule}
        isUpdating={isUpdating}
      />
    </div>
  );
};
