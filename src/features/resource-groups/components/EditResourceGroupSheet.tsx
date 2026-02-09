/**
 * Edit Resource Group Sheet Component
 * Mobile-optimized bottom sheet for editing resource group information
 *
 * Design: Tailwind Application UI style
 * - Collapsible form sections
 * - Read-only info section with description lists
 * - Form field labels with hints
 * - Large touch targets (min 44px)
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderEdit,
  Layers,
  FileText,
  Info,
  Hash,
  CreditCard,
  Calendar,
  ChevronDown,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { formatDate } from '@/shared/utils/date-utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type EditSheetProps,
} from '@/components/common/sheet';
import { MobileFormInput } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import { useEditResourceGroupForm } from '../hooks/useEditResourceGroupForm';
import type { ResourceGroup, UpdateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan, PlanType } from '@/api/subscription/types';

interface EditResourceGroupSheetProps extends EditSheetProps<ResourceGroup, UpdateResourceGroupRequest> {
  plansMap: Record<string, SubscriptionPlan>;
}

// ============================================================================
// Constants
// ============================================================================

const PLAN_TYPE_COLORS: Record<PlanType, string> = {
  node: 'bg-primary/10 text-primary',
  forward: 'bg-success/10 text-success',
  hybrid: 'bg-info/10 text-info',
};

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  node: 'resourceGroups.planTypes.node',
  forward: 'resourceGroups.planTypes.forward',
  hybrid: 'resourceGroups.planTypes.hybrid',
};

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Collapsible Form Section - Tailwind Application UI style
 */
interface FormSectionProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string | null;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
  children,
}) => (
  <div className="overflow-hidden rounded-lg bg-card border border-border">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-muted/50 transition-colors min-h-[52px]"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'size-8 rounded-lg flex items-center justify-center transition-colors',
            isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
              {badge}
            </span>
          )}
        </div>
      </div>
      <ChevronDown
        className={cn(
          'size-4 text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      )}
    >
      <div className="px-4 pb-4 pt-2 border-t border-border">{children}</div>
    </div>
  </div>
);

/**
 * Form Field Label - compact style with hint
 */
interface FormFieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
}

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({ label, required, hint }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {hint && <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>}
  </div>
);

/**
 * Read-only Info Row - compact inline style with optional copy
 */
const InfoRow = ({
  icon,
  label,
  value,
  mono = false,
  copyable = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px]">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-sm text-foreground min-w-0">
        <span className={cn('truncate', mono && 'font-mono text-xs')}>{value}</span>
        {copyable && typeof value === 'string' && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 -mr-1 rounded hover:bg-muted transition-colors touch-target"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground/50" />
            )}
          </button>
        )}
      </dd>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const EditResourceGroupSheet: React.FC<EditResourceGroupSheetProps> = ({
  open,
  onOpenChange,
  entity: resourceGroup,
  plansMap,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['info', 'edit']));
  const form = useEditResourceGroupForm({ resourceGroup });

  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!loading) {
        onOpenChange(o);
      }
    },
    [loading, onOpenChange]
  );

  const handleSubmit = useCallback(async () => {
    if (!form.validate()) return;
    const result = form.buildSubmitData();
    if (!result) return;

    setLoading(true);
    try {
      await onSubmit(result.sid, result.data);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onOpenChange]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (!resourceGroup) return null;

  const plan = plansMap[resourceGroup.planId];
  const planType = plan?.planType;
  const typeColorClass = planType
    ? PLAN_TYPE_COLORS[planType]
    : 'bg-muted text-muted-foreground';
  const typeLabelKey = planType ? PLAN_TYPE_LABELS[planType] : '';

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-info/10 flex items-center justify-center">
              <FolderEdit className="size-5 text-info" />
            </div>
            <span>{t('resourceGroups.editTitle')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('resourceGroups.editSheet.description', { name: resourceGroup.name })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Read-only Info Section */}
          <FormSection
            title={t('common.sections.basicInfo')}
            icon={Info}
            isOpen={openSections.has('info')}
            onToggle={() => toggleSection('info')}
          >
            <div className="overflow-hidden rounded-lg bg-muted/30 border border-border/50">
              <dl className="divide-y divide-border/50">
                <InfoRow
                  icon={<Hash className="size-3.5" />}
                  label={t('common.labels.sid')}
                  value={resourceGroup.sid}
                  mono
                  copyable
                />
                <div className="px-3 py-2.5 min-h-[44px]">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <CreditCard className="size-3.5 text-muted-foreground/60" />
                    {t('resourceGroups.editSheet.associatedPlan')}
                  </dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {plan?.name || t('resourceGroups.planPrefix', { id: resourceGroup.planId })}
                    </span>
                    {plan?.slug && (
                      <span className="font-mono text-xs text-muted-foreground">{plan.slug}</span>
                    )}
                    {planType && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeColorClass)}>
                        {t(typeLabelKey)}
                      </span>
                    )}
                  </dd>
                </div>
                <InfoRow
                  icon={<Calendar className="size-3.5" />}
                  label={t('common.fields.createdAt')}
                  value={formatDate(resourceGroup.createdAt)}
                />
              </dl>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              {t('resourceGroups.editSheet.readOnlyHint')}
            </p>
          </FormSection>

          {/* Editable Fields Section */}
          <FormSection
            title={t('common.sections.editableInfo')}
            icon={Layers}
            isOpen={openSections.has('edit')}
            onToggle={() => toggleSection('edit')}
          >
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <FormFieldLabel
                  label={t('common.fields.name')}
                  required
                  hint={t('resourceGroups.nameHint')}
                />
                <MobileFormInput
                  id="edit-rg-name"
                  value={form.name}
                  onChange={form.handleNameChange}
                  onBlur={() => form.handleBlur('name')}
                  placeholder={t('resourceGroups.namePlaceholder')}
                  icon={<Layers className="size-5" />}
                  error={form.touched.name ? form.errors.name : undefined}
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <FormFieldLabel
                  label={t('common.fields.description')}
                  hint={t('resourceGroups.descriptionHint')}
                />
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <textarea
                    id="edit-rg-description"
                    value={form.description}
                    onChange={(e) => form.handleDescriptionChange(e.target.value)}
                    placeholder={t('resourceGroups.descriptionPlaceholder')}
                    rows={3}
                    disabled={loading}
                    className={cn(
                      'w-full min-h-[88px] py-3 pl-12 pr-4 text-base rounded-lg',
                      'border bg-background',
                      'placeholder:text-muted-foreground/60',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed resize-none'
                    )}
                  />
                </div>
              </div>
            </div>
          </FormSection>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !form.hasChanges}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'h-11 rounded-lg',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'active:opacity-80 transition-opacity',
                'disabled:opacity-50'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('common.loading.saving')}
                </>
              ) : (
                t('resourceGroups.saveChanges')
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className={cn(
                'flex-1 flex items-center justify-center',
                'h-11 rounded-lg',
                'border border-border bg-background text-foreground',
                'text-sm font-medium',
                'active:opacity-80 transition-opacity',
                'disabled:opacity-50'
              )}
            >
              {t('common.actions.cancel')}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
