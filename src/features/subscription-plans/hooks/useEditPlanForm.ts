/**
 * Shared form hook for Edit Subscription Plan
 * Extracts form state, handlers, validation, and submit data building
 * Used by both EditPlanDialog and EditPlanSheet
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SubscriptionPlan,
  UpdatePlanRequest,
  PricingOptionInput,
} from '@/api/subscription/types';

// Re-export shared types from create hook for consistency
export type { ForwardRuleTypeOption, PlanLimits } from './useCreatePlanForm';
export {
  BILLING_CYCLE_VALUES,
  FORWARD_RULE_TYPE_VALUES,
  BILLING_CYCLE_KEYS,
  FORWARD_RULE_TYPE_KEYS,
  getDefaultPricing,
} from './useCreatePlanForm';

// Helper function: convert PlanLimits to API format
function planLimitsToApiFormat(limits: import('./useCreatePlanForm').PlanLimits): Record<string, unknown> {
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
function parsePlanLimits(apiLimits: Record<string, unknown> | undefined): import('./useCreatePlanForm').PlanLimits {
  if (!apiLimits) return {};
  return {
    trafficLimit: apiLimits.trafficLimit as number | undefined,
    deviceLimit: apiLimits.deviceLimit as number | undefined,
    speedLimit: apiLimits.speedLimit as number | undefined,
    connectionLimit: apiLimits.connectionLimit as number | undefined,
    ruleLimit: apiLimits.ruleLimit as number | undefined,
    ruleTypes: apiLimits.ruleTypes as import('./useCreatePlanForm').ForwardRuleTypeOption[] | undefined,
    nodeLimit: apiLimits.nodeLimit as number | undefined,
  };
}

// Extend UpdatePlanRequest to support multi-pricing management and plan limits
export interface UpdatePlanFormData extends Omit<UpdatePlanRequest, 'limits'> {
  pricings: PricingOptionInput[];
  planLimits: import('./useCreatePlanForm').PlanLimits;
}

interface UseEditPlanFormParams {
  plan: SubscriptionPlan | null;
}

export function useEditPlanForm({ plan }: UseEditPlanFormParams) {
  const [formData, setFormData] = useState<UpdatePlanFormData>({ pricings: [], planLimits: {} });

  // Update form data when plan changes
  useEffect(() => {
    if (plan) {
      const planLimits = parsePlanLimits(plan.limits);
      setFormData({
        description: plan.description,
        isPublic: plan.isPublic,
        sortOrder: plan.sortOrder,
        pricings: (plan.pricings || []).map((p) => ({
          billingCycle: p.billingCycle,
          price: p.price,
          currency: p.currency,
          isActive: p.isActive,
        })),
        planLimits,
      });
    }
  }, [plan]);

  const handleChange = useCallback((field: keyof UpdatePlanFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLimitChange = useCallback((field: keyof import('./useCreatePlanForm').PlanLimits, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      planLimits: { ...prev.planLimits, [field]: value },
    }));
  }, []);

  const handleRuleTypeToggle = useCallback((type: import('./useCreatePlanForm').ForwardRuleTypeOption) => {
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
    const newPricing: PricingOptionInput = {
      billingCycle: 'monthly',
      price: 0,
      currency: 'CNY',
      isActive: true,
    };
    setFormData((prev) => ({
      ...prev,
      pricings: [...prev.pricings, newPricing],
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

  const buildSubmitData = useCallback((): UpdatePlanRequest => {
    const limits =
      Object.keys(formData.planLimits).length > 0
        ? planLimitsToApiFormat(formData.planLimits)
        : undefined;

    return {
      description: formData.description,
      limits,
      nodeLimit: formData.planLimits.nodeLimit,
      isPublic: formData.isPublic,
      sortOrder: formData.sortOrder,
      pricings: formData.pricings,
    };
  }, [formData]);

  const isFormValid = formData.pricings.length > 0;

  const reset = useCallback(() => {
    setFormData({ pricings: [], planLimits: {} });
  }, []);

  return {
    formData,
    isFormValid,
    handleChange,
    handleLimitChange,
    handleRuleTypeToggle,
    handleAddPricing,
    handleRemovePricing,
    handleUpdatePricing,
    buildSubmitData,
    reset,
  };
}
