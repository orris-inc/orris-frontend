/**
 * Add Members Dialog
 * Support batch selection of nodes or forward agents to add to resource group
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Server, Cpu, Loader2, Check, Users, ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/Dialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Checkbox } from '@/components/common/Checkbox';
import { Separator } from '@/components/common/Separator';
import { ScrollArea } from '@/components/common/ScrollArea';
import { useNodes } from '@/features/nodes/hooks/useNodes';
import { useForwardAgents } from '@/features/forward-agents/hooks/useForwardAgents';
import { useForwardRules } from '@/features/forward-rules/hooks/useForwardRules';

type MemberType = 'nodes' | 'agents' | 'rules';

interface AddMembersDialogProps {
  open: boolean;
  type: MemberType;
  groupName: string;
  existingMemberIds: string[];
  onClose: () => void;
  onSubmit: (ids: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const AddMembersDialog: React.FC<AddMembersDialogProps> = ({
  open,
  type,
  groupName,
  existingMemberIds,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get node list
  const { nodes, isLoading: isLoadingNodes } = useNodes({
    page: 1,
    pageSize: 200,
    enabled: open && type === 'nodes',
  });

  // Get forward agent list
  const { forwardAgents, isLoading: isLoadingAgents } = useForwardAgents({
    page: 1,
    pageSize: 200,
    enabled: open && type === 'agents',
  });

  // Get forward rule list
  const { forwardRules, isLoading: isLoadingRules } = useForwardRules({
    page: 1,
    pageSize: 200,
    filters: { orderBy: 'sort_order', order: 'asc' },
    enabled: open && type === 'rules',
  });

  const isLoading = type === 'nodes' ? isLoadingNodes : type === 'agents' ? isLoadingAgents : isLoadingRules;

  // Filter out members not yet in current resource group
  const availableItems = useMemo(() => {
    const items = type === 'nodes' ? nodes : type === 'agents' ? forwardAgents : forwardRules;
    const existingSet = new Set(existingMemberIds);

    return items
      .filter((item) => !existingSet.has(item.id))
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [type, nodes, forwardAgents, forwardRules, existingMemberIds, searchQuery]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map((item) => item.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    await onSubmit(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSearchQuery('');
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchQuery('');
    onClose();
  };

  const Icon = type === 'nodes' ? Server : type === 'agents' ? Cpu : ArrowRightLeft;
  const title = t(`resourceGroups.addMembers.title.${type}`);
  const memberLabel = t(`resourceGroups.addMembers.memberTypes.${type}`);
  const emptyText = t(`resourceGroups.addMembers.empty.${type}`);

  // Statistics
  const totalItems = type === 'nodes' ? nodes.length : type === 'agents' ? forwardAgents.length : forwardRules.length;
  const existingCount = existingMemberIds.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {t('resourceGroups.addMembers.description', { groupName, memberType: memberLabel })}
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Users className="size-4 text-info" />
            <div>
              <p className="text-xs text-muted-foreground">{t('resourceGroups.addMembers.stats.total', { memberType: memberLabel })}</p>
              <p className="text-sm font-medium">{totalItems} {t('resourceGroups.unit')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Check className="size-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">{t('resourceGroups.addMembers.stats.associated')}</p>
              <p className="text-sm font-medium">{existingCount} {t('resourceGroups.unit')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
            <Icon className="size-4 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">{t('resourceGroups.addMembers.stats.available')}</p>
              <p className="text-sm font-medium">{availableItems.length} {t('resourceGroups.unit')}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden flex flex-col gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('resourceGroups.addMembers.searchPlaceholder', { memberType: memberLabel })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all and selected count */}
          {availableItems.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === availableItems.length && availableItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size === availableItems.length ? t('common.actions.deselectAll') : t('common.actions.selectAll')}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <Badge variant="secondary">
                  {t('common.selected', { count: selectedIds.size })}
                </Badge>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex-1 min-h-[200px] border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Icon className="size-8 mb-2" />
                <p className="text-sm">{emptyText}</p>
                {searchQuery && (
                  <p className="text-xs mt-1">{t('resourceGroups.addMembers.tryOtherKeywords')}</p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="divide-y">
                  {availableItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const status = 'status' in item ? item.status : '';
                    const isActive = status === 'active' || status === 'enabled';

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10'
                            : 'hover:bg-accent hover:bg-accent/50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(item.id)}
                        />
                        <Icon className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {item.id}
                          </p>
                        </div>
                        <Badge variant={isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                          {isActive ? (type === 'nodes' ? t('common.status.enabled') : t('common.status.enabled')) : (type === 'nodes' ? t('common.status.disabled') : t('common.status.stopped'))}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {t('resourceGroups.addMembers.adding')}
              </>
            ) : (
              <>
                <Check className="size-4 mr-2" />
                {t('resourceGroups.addMembers.confirmAdd', { count: selectedIds.size })}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
