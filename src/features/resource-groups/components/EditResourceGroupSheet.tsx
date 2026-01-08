/**
 * Edit Resource Group Sheet Component
 * Mobile-optimized bottom sheet for editing resource group information
 */

import { useState, useEffect, useCallback } from 'react';
import { FolderEdit, Layers, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/common/Sheet';
import { Button } from '@/components/common/Button';
import { Separator } from '@/components/common/Separator';
import { TruncatedId } from '@/components/admin';
import { MobileFormInput } from '@/components/common/mobile-form';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan } from '@/api/subscription/types';

interface EditResourceGroupSheetProps {
  open: boolean;
  resourceGroup: ResourceGroup | null;
  plansMap: Record<string, SubscriptionPlan>;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateResourceGroupRequest) => Promise<void>;
}

interface FormErrors {
  name?: string;
}

export const EditResourceGroupSheet: React.FC<EditResourceGroupSheetProps> = ({
  open,
  resourceGroup,
  plansMap,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form when resourceGroup changes
  useEffect(() => {
    if (resourceGroup) {
      setName(resourceGroup.name);
      setDescription(resourceGroup.description || '');
      setErrors({});
      setTouched({});
    }
  }, [resourceGroup]);

  // Validation functions
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return '请输入资源组名称';
    if (value.trim().length > 100) return '名称不能超过 100 个字符';
    return undefined;
  }, []);

  const handleBlur = useCallback((field: 'name') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validators = { name: validateName };
    const values = { name };
    setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
  }, [name, validateName]);

  const validate = useCallback((): boolean => {
    const newErrors = {
      name: validateName(name),
    };
    setErrors(newErrors);
    return !newErrors.name;
  }, [name, validateName]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!resourceGroup || !validate()) return;

    setLoading(true);
    try {
      const submitData: UpdateResourceGroupRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      await onSubmit(resourceGroup.sid, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [resourceGroup, name, description, validate, onSubmit, onClose]);

  // Check for changes
  const hasChanges = resourceGroup && (
    name !== resourceGroup.name ||
    description !== (resourceGroup.description || '')
  );

  if (!resourceGroup) return null;

  const plan = plansMap[resourceGroup.planId];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FolderEdit className="size-5 text-blue-500" />
            </div>
            <span>编辑资源组</span>
          </SheetTitle>
          <SheetDescription>
            修改资源组 {resourceGroup.name} 的信息
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 py-4">
          {/* Read-only Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground px-1">基本信息</h4>
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SID</span>
                <TruncatedId id={resourceGroup.sid} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">关联计划</span>
                <span className="text-sm font-medium">
                  {plan?.name || `计划 #${resourceGroup.planId}`}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">创建时间</span>
                <span className="text-sm">
                  {new Date(resourceGroup.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground px-1">可编辑信息</h4>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-rg-name" className="text-sm font-medium px-1">
                资源组名称 <span className="text-destructive">*</span>
              </label>
              <MobileFormInput
                id="edit-rg-name"
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
                }}
                onBlur={() => handleBlur('name')}
                placeholder="输入资源组名称"
                icon={<Layers className="size-5" />}
                error={touched.name ? errors.name : undefined}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="edit-rg-description" className="text-sm font-medium px-1">
                描述
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 text-muted-foreground">
                  <FileText className="size-5" />
                </div>
                <textarea
                  id="edit-rg-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="输入资源组描述（可选）"
                  rows={3}
                  disabled={loading}
                  className="w-full min-h-[100px] py-3 pl-12 pr-4 text-base rounded-xl border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !hasChanges}
            className="w-full min-h-[52px] text-base"
          >
            {loading ? '保存中...' : '保存修改'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="w-full min-h-[44px]"
          >
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
