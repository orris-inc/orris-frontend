/**
 * Settings Hooks
 * Export all settings-related hooks
 */

// Admin settings hooks (require authentication)
export { useSystemSettings } from './useSystemSettings';
export { useOAuthSettings } from './useOAuthSettings';
export { useEmailSettings } from './useEmailSettings';
export { useUSDTSettings } from './useUSDTSettings';
export { useSubscriptionSettings } from './useSubscriptionSettings';
export { useBrandingSettings } from './useBrandingSettings';
export { useSecuritySettings } from './useSecuritySettings';
export { useRegistrationSettings } from './useRegistrationSettings';
export { useLegalSettings } from './useLegalSettings';

// Public settings hooks (no authentication required)
export { usePublicBranding } from './usePublicBranding';
export { usePublicRegistration } from './usePublicRegistration';
export { usePublicLegal } from './usePublicLegal';
export { usePasswordPolicy } from './usePasswordPolicy';
