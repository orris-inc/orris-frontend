/**
 * Create Resource Group Sheet Component
 * Mobile-optimized bottom sheet for creating new resource groups
 *
 * Design: Tailwind Application UI style
 * - Collapsible form sections
 * - Form field labels with hints
 * - Large touch targets (min 44px)
 * - Plan selection with visual cards
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderPlus,
  Layers,
  FileText,
  CreditCard,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  type CreateSheetProps,
} from '@/components/common/sheet';
import { MobileFormInput, MobileSelect, type MobileSelectOption } from '@/components/common/mobile-form';
import { cn } from '@/lib/utils';
import type { CreateResourceGroupRequest } from '@/api/resource/types';
import type { SubscriptionPlan, PlanType } from '@/api/subscription/types';

interface CreateResourceGroupSheetProps extends CreateSheetProps<CreateResourceGroupRequest> {
  /** Available subscription plans for selection */
  plans: SubscriptionPlan[];
}

interface FormErrors {
  name?: string;
  planId?: string;
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
  required?: boolean;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  required,
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
          {required && (
            <span className="text-destructive text-xs">*</span>
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
      <div className="px-4 pb-4 pt-2 border-t border-border">
        {children}
      </div>
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

const FormFieldLabel: React.FC<FormFieldLabelProps> = ({
  label,
  required,
  hint,
}) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {hint && (
      <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
    )}
  </div>
);

/**
 * Plan Selection Card - Visual selection with type badge
 */
interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, selected, onSelect, t }) => {
  const planType = plan.planType;
  const typeColorClass = planType ? PLAN_TYPE_COLORS[planType] : 'bg-muted text-muted-foreground';
  const typeLabelKey = planType ? PLAN_TYPE_LABELS[planType] : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all',
        'min-h-[52px] text-left',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card active:bg-muted/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <CreditCard className="size-4" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium truncate',
              selected ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {plan.name}
          </p>
          {planType && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', typeColorClass)}>
              {t(typeLabelKey)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate leading-tight font-mono">
          {plan.slug}
        </p>
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="size-3 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CreateResourceGroupSheet: React.FC<CreateResourceGroupSheetProps> = ({
  open,
  onOpenChange,
  onSubmit,
  plans,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic', 'plan']));

  // Build plan options for MobileSelect fallback
  const planOptions: MobileSelectOption[] = useMemo(
    () =>
      plans.map((plan) => ({
        value: plan.id.toString(),
        label: `${plan.name} (${plan.slug})`,
      })),
    [plans]
  );

  // Validation functions
  const validateName = useCallback(
    (value: string): string | undefined => {
      if (!value.trim()) return t('resourceGroups.nameRequired');
      if (value.trim().length > 100) return t('resourceGroups.nameTooLong');
      return undefined;
    },
    [t]
  );

  const validatePlanId = useCallback(
    (value: string): string | undefined => {
      if (!value) return t('resourceGroups.selectPlanRequired');
      return undefined;
    },
    [t]
  );

  // Handle blur for inline validation
  const handleBlur = useCallback(
    (field: keyof FormErrors) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const validators = { name: validateName, planId: validatePlanId };
      const values = { name, planId };
      setErrors((prev) => ({ ...prev, [field]: validators[field](values[field]) }));
    },
    [name, planId, validateName, validatePlanId]
  );

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {
      name: validateName(name),
      planId: validatePlanId(planId),
    };
    setErrors(newErrors);
    setTouched({ name: true, planId: true });
    return !newErrors.name && !newErrors.planId;
  }, [name, planId, validateName, validatePlanId]);

  // Reset form
  const resetForm = useCallback(() => {
    setName('');
    setPlanId('');
    setDescription('');
    setErrors({});
    setTouched({});
    setOpenSections(new Set(['basic', 'plan']));
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!loading && !open) {
        resetForm();
        onOpenChange(false);
      }
    },
    [loading, resetForm, onOpenChange]
  );

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        planId,
        description: description.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [validateAll, name, planId, description, onSubmit, resetForm, onOpenChange]);

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

  // Form validity check
  const isFormValid = name.trim() && planId;

  // Selected plan info
  const selectedPlan = plans.find((p) => p.id.toString() === planId);

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && handleOpenChange(o)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FolderPlus className="size-5 text-primary" />
            </div>
            <span>{t('resourceGroups.createTitle')}</span>
          </SheetTitle>
          <SheetDescription>{t('resourceGroups.createDescription')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="py-4 space-y-3">
          {/* Basic Info Section */}
          <FormSection
            title={t('resourceGroups.tabs.basicInfo')}
            icon={Layers}
            isOpen={openSections.has('basic')}
            onToggle={() => toggleSection('basic')}
            required
          >
            <div className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <FormFieldLabel
                  label={t('common.fields.name')}
                  required
                  hint={t('resourceGroups.nameHint')}
                />
                <MobileFormInput
                  id="mobile-rg-name"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder={t('resourceGroups.namePlaceholder')}
                  icon={<Layers className="size-5" />}
                  error={touched.name ? errors.name : undefined}
                  disabled={loading}
                />
              </div>

              {/* Description Field */}
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
                    id="mobile-rg-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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

          {/* Plan Selection Section */}
          <FormSection
            title={t('resourceGroups.associatedPlan')}
            icon={CreditCard}
            isOpen={openSections.has('plan')}
            onToggle={() => toggleSection('plan')}
            required
          >
            <div className="space-y-3">
              {plans.length <= 6 ? (
                // Show cards for small list
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={planId === plan.id.toString()}
                      onSelect={() => {
                        setPlanId(plan.id.toString());
                        if (touched.planId) {
                          setErrors((prev) => ({
                            ...prev,
                            planId: validatePlanId(plan.id.toString()),
                          }));
                        }
                      }}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                // Use select for larger lists
                <MobileSelect
                  value={planId}
                  onChange={(v) => {
                    setPlanId(v);
                    if (touched.planId)
                      setErrors((prev) => ({ ...prev, planId: validatePlanId(v) }));
                  }}
                  options={planOptions}
                  placeholder={t('resourceGroups.selectPlan')}
                  disabled={loading}
                />
              )}
              {touched.planId && errors.planId && (
                <p className="text-sm text-destructive px-1">{errors.planId}</p>
              )}

              {/* Selected plan summary */}
              {selectedPlan && (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {t('resourceGroups.selectedPlanInfo', {
                    name: selectedPlan.name,
                    slug: selectedPlan.slug,
                  })}
                </div>
              )}
            </div>
          </FormSection>
        </SheetBody>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
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
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
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
                  {t('common.loading.creating')}
                </>
              ) : (
                t('resourceGroups.createResourceGroup')
              )}
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
