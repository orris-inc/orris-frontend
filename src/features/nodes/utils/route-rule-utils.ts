/**
 * Route rule utilities
 * Extracted for Fast Refresh compatibility
 */

import type { OutboundType, CustomOutbound, RouteConfig } from '@/api/node';

/** Simple node info for outbound selection */
export interface OutboundNodeOption {
  id: string;
  name: string;
}

export const PRESET_OUTBOUND_OPTIONS: { value: OutboundType; labelKey: string }[] = [
  { value: 'proxy', labelKey: 'admin.nodes.route.outbound.proxy' },
  { value: 'direct', labelKey: 'admin.nodes.route.outbound.direct' },
  { value: 'block', labelKey: 'admin.nodes.route.outbound.block' },
];

/** Check if outbound value is a node reference */
export const isNodeOutbound = (outbound: OutboundType): boolean => {
  return outbound.startsWith('node_');
};

/** Check if outbound value is a custom outbound reference */
export const isCustomOutbound = (outbound: OutboundType): boolean => {
  return outbound.startsWith('custom_');
};

/** Get display label for outbound value */
export const getOutboundLabel = (
  outbound: OutboundType,
  nodes?: OutboundNodeOption[],
  t?: (key: string, options?: Record<string, unknown>) => string,
  customOutbounds?: CustomOutbound[]
): string => {
  if (isCustomOutbound(outbound)) {
    const entry = customOutbounds?.find((c) => c.tag === outbound);
    const displayTag = outbound.replace(/^custom_/, '');
    if (t) {
      return t('admin.nodes.route.outbound.custom', { tag: entry ? displayTag : displayTag });
    }
    return `Custom: ${displayTag}`;
  }
  if (!isNodeOutbound(outbound)) {
    const preset = PRESET_OUTBOUND_OPTIONS.find((o) => o.value === outbound);
    if (preset && t) {
      return t(preset.labelKey);
    }
    const fallback: Record<string, string> = { proxy: 'Proxy', direct: 'Direct', block: 'Block' };
    return fallback[outbound] || outbound;
  }
  const node = nodes?.find((n) => n.id === outbound);
  if (node && t) {
    return t('admin.nodes.route.outbound.node', { name: node.name });
  }
  return node ? `Node: ${node.name}` : outbound;
};

/**
 * Validate RouteConfig before submission.
 * Returns an error message key if invalid, or null if valid.
 */
export const validateRouteConfig = (
  route: RouteConfig | undefined
): string | null => {
  if (!route) return null;

  if (route.customOutbounds) {
    for (const co of route.customOutbounds) {
      if (!co.tag || !co.tag.trim()) {
        return 'admin.nodes.route.validation.customOutboundTagRequired';
      }
      if (!co.server || !co.server.trim()) {
        return 'admin.nodes.route.validation.customOutboundServerRequired';
      }
      if (!co.serverPort || co.serverPort < 1 || co.serverPort > 65535) {
        return 'admin.nodes.route.validation.customOutboundPortInvalid';
      }
    }
  }

  if (route.ruleSetEntries) {
    for (const rs of route.ruleSetEntries) {
      if (!rs.tag || !rs.tag.trim()) {
        return 'admin.nodes.route.validation.ruleSetTagRequired';
      }
      if (!rs.url || !rs.url.trim()) {
        return 'admin.nodes.route.validation.ruleSetUrlRequired';
      }
    }
  }

  return null;
};
