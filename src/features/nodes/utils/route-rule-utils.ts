/**
 * Route rule utilities
 * Extracted for Fast Refresh compatibility
 */

import type { OutboundType, CustomOutbound } from '@/api/node';

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
