/**
 * Status Configuration Constants
 * Centralized status display configuration for all entities
 *
 * NOTE: All labelKey values are i18n translation keys.
 * Use t(config.labelKey) to get the translated label.
 */

// Standard badge variants that work with AdminBadge
export type StandardBadgeVariant = 'success' | 'default' | 'warning' | 'danger' | 'info';

// Extended badge variants (includes 'secondary' for use with Badge component)
export type ExtendedBadgeVariant = StandardBadgeVariant | 'secondary';

// Status config using standard variants (for AdminBadge)
export interface StatusConfig {
  labelKey: string;
  variant: StandardBadgeVariant;
}

// Extended status config with all variants (for Badge component)
export interface ExtendedStatusConfig {
  labelKey: string;
  variant: ExtendedBadgeVariant;
}

// ============================================================================
// Enable/Disable Status (ForwardRule, ForwardAgent)
// ============================================================================
export const ENABLED_STATUS_CONFIG: Record<string, StatusConfig> = {
  enabled: { labelKey: 'common.status.enabled', variant: 'success' },
  disabled: { labelKey: 'common.status.disabled', variant: 'default' },
};

// Short labels for compact display
export const ENABLED_STATUS_CONFIG_SHORT: Record<string, StatusConfig> = {
  enabled: { labelKey: 'common.status.enabledShort', variant: 'success' },
  disabled: { labelKey: 'common.status.disabledShort', variant: 'default' },
};

// ============================================================================
// Active/Inactive Status (User, Node, ResourceGroup)
// ============================================================================
export const ACTIVE_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { labelKey: 'common.status.enabled', variant: 'success' },
  inactive: { labelKey: 'common.status.disabled', variant: 'default' },
  pending: { labelKey: 'common.status.pending', variant: 'warning' },
  suspended: { labelKey: 'common.status.suspended', variant: 'danger' },
  deleted: { labelKey: 'common.status.deleted', variant: 'danger' },
  maintenance: { labelKey: 'common.status.maintenance', variant: 'warning' },
};

// ============================================================================
// Subscription Status
// Updated: 2025-01-14 - Synced with backend status.go (8 statuses)
// ============================================================================
export const SUBSCRIPTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  inactive: { labelKey: 'common.status.disabled', variant: 'default' },
  pending_payment: { labelKey: 'subscriptionStatus.pendingPayment', variant: 'warning' },
  trialing: { labelKey: 'subscriptionStatus.trialing', variant: 'info' },
  active: { labelKey: 'common.status.enabled', variant: 'success' },
  past_due: { labelKey: 'subscriptionStatus.pastDue', variant: 'warning' },
  suspended: { labelKey: 'common.status.suspended', variant: 'danger' },
  cancelled: { labelKey: 'common.status.cancelled', variant: 'danger' },
  expired: { labelKey: 'common.status.expired', variant: 'danger' },
};

// ============================================================================
// User Role Configuration
// ============================================================================
export const ROLE_CONFIG: Record<string, StatusConfig> = {
  user: { labelKey: 'common.role.user', variant: 'default' },
  admin: { labelKey: 'common.role.admin', variant: 'info' },
};

// ============================================================================
// Subscription Plan Type Configuration
// ============================================================================
export const PLAN_TYPE_CONFIG: Record<string, StatusConfig> = {
  node: { labelKey: 'common.planType.node', variant: 'info' },
  forward: { labelKey: 'common.planType.forward', variant: 'warning' },
  hybrid: { labelKey: 'common.planType.hybrid', variant: 'info' },
};

// ============================================================================
// Forward Rule Type Configuration
// ============================================================================
export const RULE_TYPE_CONFIG: Record<string, ExtendedStatusConfig> = {
  PortForward: { labelKey: 'common.ruleType.portForward', variant: 'default' },
  SOCKS5Proxy: { labelKey: 'common.ruleType.socks5Proxy', variant: 'info' },
  HTTPProxy: { labelKey: 'common.ruleType.httpProxy', variant: 'info' },
  TunnelForward: { labelKey: 'common.ruleType.tunnelForward', variant: 'secondary' },
};

// ============================================================================
// Forward Protocol Configuration
// ============================================================================
export const PROTOCOL_CONFIG: Record<string, ExtendedStatusConfig> = {
  tcp: { labelKey: 'TCP', variant: 'default' },
  udp: { labelKey: 'UDP', variant: 'info' },
  'tcp+udp': { labelKey: 'TCP+UDP', variant: 'secondary' },
};

// ============================================================================
// Sync Status Configuration
// ============================================================================
export const SYNC_STATUS_CONFIG: Record<string, StatusConfig> = {
  synced: { labelKey: 'common.status.synced', variant: 'success' },
  pending: { labelKey: 'common.status.syncing', variant: 'warning' },
  failed: { labelKey: 'common.status.syncFailed', variant: 'danger' },
  unknown: { labelKey: 'common.status.unknown', variant: 'default' },
};

// ============================================================================
// Run Status Configuration
// ============================================================================
export const RUN_STATUS_CONFIG: Record<string, StatusConfig> = {
  running: { labelKey: 'common.status.running', variant: 'success' },
  stopped: { labelKey: 'common.status.stopped', variant: 'default' },
  error: { labelKey: 'common.status.error', variant: 'danger' },
  unknown: { labelKey: 'common.status.unknown', variant: 'default' },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status config with fallback
 */
export function getStatusConfig(
  config: Record<string, StatusConfig>,
  status: string,
  fallbackLabelKey?: string
): StatusConfig {
  return config[status] || { labelKey: fallbackLabelKey || status, variant: 'default' };
}

/**
 * Get status labelKey (i18n translation key)
 */
export function getStatusLabelKey(
  config: Record<string, StatusConfig>,
  status: string,
  fallbackLabelKey?: string
): string {
  return getStatusConfig(config, status, fallbackLabelKey).labelKey;
}

/**
 * Get status variant
 */
export function getStatusVariant(
  config: Record<string, StatusConfig>,
  status: string
): StandardBadgeVariant {
  return getStatusConfig(config, status).variant;
}
