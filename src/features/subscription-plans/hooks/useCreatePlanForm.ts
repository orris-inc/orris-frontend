/**
 * Shared form hook for Create/Duplicate Subscription Plan
 * Extracts form state, handlers, validation, and submit data building
 * Used by both CreatePlanDialog and CreatePlanSheet
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CreatePlanRequest,
  PricingOptionInput,
  PlanType,
  SubscriptionPlan,
} from '@/api/subscription/types';

// Locally defined types (not part of the API SDK)
export type ForwardRuleTypeOption = 'direct' | 'entry' | 'chain' | 'direct_chain';

export interface PlanLimits {
  trafficLimit?: number;
  deviceLimit?: number;
  speedLimit?: number;
  connectionLimit?: number;
  ruleLimit?: number;
  ruleTypes?: ForwardRuleTypeOption[];
  nodeLimit?: number;
}

// Helper function: convert PlanLimits to API format
function planLimitsToApiFormat(limits: PlanLimits): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (limits.trafficLimit !== undefined) result['traffic_limit'] = limits.trafficLimit;
  if (limits.deviceLimit !== undefined) result['device_limit'] = limits.deviceLimit;
  if (limits.speedLimit !== undefined) result['speed_limit'] = limits.speedLimit;
  if (limits.connectionLimit !== undefined) result['connection_limit'] = limits.connectionLimit;
  if (limits.ruleLimit !== undefined) result['rule_limit'] = limits.ruleLimit;
  if (limits.ruleTypes !== undefined) result['rule_types'] = limits.ruleTypes;
  if (limits.nodeLimit !== undefined) result['node_limit'] = limits.nodeLimit;
  return result;
}

// Helper function: parse API format limits (axios-case-converter converts response to camelCase)
function parsePlanLimits(apiLimits: Record<string, unknown> | undefined): PlanLimits {
  if (!apiLimits) return {};
  return {
    trafficLimit: apiLimits.trafficLimit as number | undefined,
    deviceLimit: apiLimits.deviceLimit as number | undefined,
    speedLimit: apiLimits.speedLimit as number | undefined,
    connectionLimit: apiLimits.connectionLimit as number | undefined,
    ruleLimit: apiLimits.ruleLimit as number | undefined,
    ruleTypes: apiLimits.ruleTypes as ForwardRuleTypeOption[] | undefined,
    nodeLimit: apiLimits.nodeLimit as number | undefined,
  };
}

// Billing cycle options
export const BILLING_CYCLE_VALUES = ['weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly', 'lifetime'] as const;

// Forward rule type options
export const FORWARD_RULE_TYPE_VALUES: ForwardRuleTypeOption[] = ['direct', 'entry', 'chain', 'direct_chain'];

// Plan type options (hybrid is not yet implemented)
export const PLAN_TYPE_VALUES: PlanType[] = ['node', 'forward'];

// Billing cycle translation key mapping
export const BILLING_CYCLE_KEYS: Record<string, string> = {
  weekly: 'billingCycle.weekly',
  monthly: 'billingCycle.monthly',
  quarterly: 'billingCycle.quarterly',
  semi_annual: 'billingCycle.semiAnnual',
  yearly: 'billingCycle.yearly',
  lifetime: 'billingCycle.lifetime',
};

// Forward rule type translation key mapping
export const FORWARD_RULE_TYPE_KEYS: Record<ForwardRuleTypeOption, string> = {
  direct: 'admin.plans.ruleType.direct',
  entry: 'admin.plans.ruleType.entry',
  chain: 'admin.plans.ruleType.chain',
  direct_chain: 'admin.plans.ruleType.directChain',
};

// Plan type translation key mapping
export const PLAN_TYPE_KEYS: Record<PlanType, string> = {
  node: 'common.planType.node',
  forward: 'common.planType.forward',
  hybrid: 'common.planType.hybrid',
};

// Extend CreatePlanRequest to support plan limits
export interface CreatePlanFormData extends Omit<CreatePlanRequest, 'limits' | 'pricings' | 'nodeLimit'> {
  pricings: PricingOptionInput[];
  planLimits: PlanLimits;
}

// Default pricing option
export const getDefaultPricing = (): PricingOptionInput => ({
  billingCycle: 'monthly',
  price: 0,
  currency: 'CNY',
  isActive: true,
});

// Default form data
const getDefaultFormData = (): CreatePlanFormData => ({
  name: '',
  slug: '',
  planType: 'node',
  description: '',
  isPublic: true,
  sortOrder: 0,
  pricings: [getDefaultPricing()],
  planLimits: {},
});

interface UseCreatePlanFormParams {
  open: boolean;
  initialPlan?: SubscriptionPlan | null;
}

export function useCreatePlanForm({ open, initialPlan }: UseCreatePlanFormParams) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreatePlanFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  // Check if in duplicate mode
  const isDuplicateMode = !!initialPlan;

  // Initialize form data (pre-fill in duplicate mode, or reset to defaults)
  useEffect(() => {
    if (open && initialPlan) {
      const planLimits = parsePlanLimits(initialPlan.limits);
      setFormData({
        name: `${initialPlan.name} (${t('common.actions.copy')})`,
        slug: `${initialPlan.slug}-copy`,
        planType: initialPlan.planType || 'node',
        description: initialPlan.description || '',
        isPublic: initialPlan.isPublic,
        sortOrder: initialPlan.sortOrder || 0,
        pricings:
          initialPlan.pricings && initialPlan.pricings.length > 0
            ? initialPlan.pricings.map((p) => ({
                billingCycle: p.billingCycle,
                price: p.price,
                currency: p.currency,
                isActive: p.isActive,
              }))
            : [getDefaultPricing()],
        planLimits,
      });
    } else if (open && !initialPlan) {
      setFormData(getDefaultFormData());
    }
    setErrors({});
  }, [open, initialPlan, t]);

  const handleChange = useCallback((field: keyof CreatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'slug') {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, []);

  const handleLimitChange = useCallback((field: keyof PlanLimits, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      planLimits: { ...prev.planLimits, [field]: value },
    }));
  }, []);

  const handleRuleTypeToggle = useCallback((type: ForwardRuleTypeOption) => {
    setFormData((prev) => {
      const currentTypes = prev.planLimits.ruleTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      return {
        ...prev,
        planLimits: { ...prev.planLimits, ruleTypes: newTypes },
      };
    });
  }, []);

  const handleAddPricing = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      pricings: [...prev.pricings, getDefaultPricing()],
    }));
  }, []);

  const handleRemovePricing = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.filter((_, i) => i !== index),
    }));
  }, []);

  const handleUpdatePricing = useCallback((index: number, updates: Partial<PricingOptionInput>) => {
    setFormData((prev) => ({
      ...prev,
      pricings: prev.pricings.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: { name?: string; slug?: string } = {};
    if (!formData.name.trim()) newErrors.name = t('admin.plans.form.planName') + ' ' + t('common.validation.required');
    if (!formData.slug.trim()) newErrors.slug = t('admin.plans.form.slug') + ' ' + t('common.validation.required');
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = t('admin.plans.form.slugHint');
    setErrors(newErrors);
    return !newErrors.name && !newErrors.slug;
  }, [formData.name, formData.slug, t]);

  const buildSubmitData = useCallback((): CreatePlanRequest => {
    const limits =
      Object.keys(formData.planLimits).length > 0
        ? planLimitsToApiFormat(formData.planLimits)
        : undefined;

    return {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      planType: formData.planType,
      limits,
      nodeLimit: formData.planLimits.nodeLimit,
      isPublic: formData.isPublic,
      sortOrder: formData.sortOrder,
      pricings: formData.pricings,
    };
  }, [formData]);

  const isFormValid = !!(formData.name.trim() && formData.slug.trim() && formData.pricings.length > 0);

  const reset = useCallback(() => {
    setFormData(getDefaultFormData());
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isDuplicateMode,
    isFormValid,
    handleChange,
    handleLimitChange,
    handleRuleTypeToggle,
    handleAddPricing,
    handleRemovePricing,
    handleUpdatePricing,
    validate,
    buildSubmitData,
    reset,
  };
}
