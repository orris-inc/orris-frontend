/**
 * Status Configuration Constants
 * Centralized status display configuration for all entities
 */

// Standard badge variants that work with AdminBadge
export type StandardBadgeVariant = 'success' | 'default' | 'warning' | 'danger' | 'info';

// Extended badge variants (includes 'secondary' for use with Badge component)
export type ExtendedBadgeVariant = StandardBadgeVariant | 'secondary';

// Status config using standard variants (for AdminBadge)
export interface StatusConfig {
  label: string;
  variant: StandardBadgeVariant;
}

// Extended status config with all variants (for Badge component)
export interface ExtendedStatusConfig {
  label: string;
  variant: ExtendedBadgeVariant;
}

// ============================================================================
// Enable/Disable Status (ForwardRule, ForwardAgent)
// ============================================================================
export const ENABLED_STATUS_CONFIG: Record<string, StatusConfig> = {
  enabled: { label: '已启用', variant: 'success' },
  disabled: { label: '已禁用', variant: 'default' },
};

// Short labels for compact display
export const ENABLED_STATUS_CONFIG_SHORT: Record<string, StatusConfig> = {
  enabled: { label: '启用', variant: 'success' },
  disabled: { label: '禁用', variant: 'default' },
};

// ============================================================================
// Active/Inactive Status (User, Node, ResourceGroup)
// ============================================================================
export const ACTIVE_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: '激活', variant: 'success' },
  inactive: { label: '未激活', variant: 'default' },
  pending: { label: '待处理', variant: 'warning' },
  suspended: { label: '暂停', variant: 'danger' },
  deleted: { label: '已删除', variant: 'danger' },
  maintenance: { label: '维护中', variant: 'warning' },
};

// ============================================================================
// Subscription Status
// ============================================================================
export const SUBSCRIPTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: '激活', variant: 'success' },
  renewed: { label: '已续费', variant: 'success' },
  pending: { label: '待处理', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  expired: { label: '已过期', variant: 'danger' },
};

// ============================================================================
// User Role Configuration
// ============================================================================
export const ROLE_CONFIG: Record<string, StatusConfig> = {
  user: { label: '用户', variant: 'default' },
  admin: { label: '管理员', variant: 'info' },
};

// ============================================================================
// Subscription Plan Type Configuration
// ============================================================================
export const PLAN_TYPE_CONFIG: Record<string, StatusConfig> = {
  node: { label: '节点订阅', variant: 'info' },
  forward: { label: '端口转发', variant: 'warning' },
  hybrid: { label: '混合订阅', variant: 'info' },
};

// ============================================================================
// Forward Rule Type Configuration
// ============================================================================
export const RULE_TYPE_CONFIG: Record<string, ExtendedStatusConfig> = {
  PortForward: { label: '端口转发', variant: 'default' },
  SOCKS5Proxy: { label: 'SOCKS5 代理', variant: 'info' },
  HTTPProxy: { label: 'HTTP 代理', variant: 'info' },
  TunnelForward: { label: '隧道转发', variant: 'secondary' },
};

// ============================================================================
// Forward Protocol Configuration
// ============================================================================
export const PROTOCOL_CONFIG: Record<string, ExtendedStatusConfig> = {
  tcp: { label: 'TCP', variant: 'default' },
  udp: { label: 'UDP', variant: 'info' },
  'tcp+udp': { label: 'TCP+UDP', variant: 'secondary' },
};

// ============================================================================
// Sync Status Configuration
// ============================================================================
export const SYNC_STATUS_CONFIG: Record<string, StatusConfig> = {
  synced: { label: '已同步', variant: 'success' },
  pending: { label: '同步中', variant: 'warning' },
  failed: { label: '同步失败', variant: 'danger' },
  unknown: { label: '未知', variant: 'default' },
};

// ============================================================================
// Run Status Configuration
// ============================================================================
export const RUN_STATUS_CONFIG: Record<string, StatusConfig> = {
  running: { label: '运行中', variant: 'success' },
  stopped: { label: '已停止', variant: 'default' },
  error: { label: '错误', variant: 'danger' },
  unknown: { label: '未知', variant: 'default' },
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
  fallbackLabel?: string
): StatusConfig {
  return config[status] || { label: fallbackLabel || status, variant: 'default' };
}

/**
 * Get status label
 */
export function getStatusLabel(
  config: Record<string, StatusConfig>,
  status: string,
  fallbackLabel?: string
): string {
  return getStatusConfig(config, status, fallbackLabel).label;
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
