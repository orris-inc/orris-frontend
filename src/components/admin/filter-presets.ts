/**
 * Filter Presets
 * Shared filter configurations and option presets for admin pages
 */

import type { FilterConfig, FilterOption } from './SelectFilters';

// ============================================================================
// Preset Filter Configs
// ============================================================================

/** Common status filter options */
export const createStatusFilterConfig = (
  options: FilterOption[],
  width = 'w-[120px]'
): FilterConfig => ({
  key: 'status',
  placeholder: 'common.status.label',
  width,
  options,
});

/** Common role filter options */
export const createRoleFilterConfig = (
  options: FilterOption[] = [
    { value: 'user', label: 'common.role.user' },
    { value: 'admin', label: 'common.role.admin' },
  ],
  width = 'w-[120px]'
): FilterConfig => ({
  key: 'role',
  placeholder: 'filter.role',
  width,
  options,
});

// ============================================================================
// Common Filter Options Presets
// ============================================================================

/** Node status options */
export const NODE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'common.status.active' },
  { value: 'inactive', label: 'common.status.inactive' },
  { value: 'maintenance', label: 'common.status.maintenance' },
];

/** Node protocol options */
export const NODE_PROTOCOL_OPTIONS: FilterOption[] = [
  { value: 'shadowsocks', label: 'Shadowsocks', translate: false },
  { value: 'trojan', label: 'Trojan', translate: false },
  { value: 'vless', label: 'VLESS', translate: false },
  { value: 'vmess', label: 'VMess', translate: false },
  { value: 'hysteria2', label: 'Hysteria2', translate: false },
  { value: 'tuic', label: 'TUIC', translate: false },
];

/** Online status options */
export const ONLINE_STATUS_OPTIONS: FilterOption[] = [
  { value: 'online', label: 'common.status.online' },
  { value: 'offline', label: 'common.status.offline' },
];

/** User status options */
export const USER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'common.status.active' },
  { value: 'inactive', label: 'common.status.inactive' },
  { value: 'pending', label: 'common.status.pending' },
  { value: 'suspended', label: 'common.status.suspended' },
];

/** User role options */
export const USER_ROLE_OPTIONS: FilterOption[] = [
  { value: 'user', label: 'common.role.user' },
  { value: 'admin', label: 'common.role.admin' },
];
