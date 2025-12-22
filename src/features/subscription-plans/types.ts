/**
 * Subscription plan module local type definitions
 */

// Re-export types from API
export type {
  BillingCycle,
  PlanStatus,
  PricingOption,
} from '@/api/subscription/types';

/**
 * Subscription plan filter criteria
 */
export interface SubscriptionPlanFilters {
  status?: 'active' | 'inactive';
  isPublic?: boolean;
  search?: string;
}
