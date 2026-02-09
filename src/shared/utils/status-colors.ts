// Status color definitions using CSS variables / semantic Tailwind classes
// Used across forward-rules, forward-agents, nodes, etc.

export const STATUS_COLORS = {
  online: {
    text: 'text-success',
    bg: 'bg-success/10',
    dot: 'bg-success',
  },
  offline: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    dot: 'bg-muted-foreground',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
  },
  error: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    dot: 'bg-destructive',
  },
} as const;

// Forward rule flow node colors (entry -> relay -> exit -> target)
export const FLOW_NODE_COLORS = {
  entry: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  relay: {
    text: 'text-relay',
    bg: 'bg-relay/10',
    border: 'border-relay/30',
  },
  exit: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  target: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
} as const;

// Sync status colors for forward rules
export const SYNC_STATUS_COLORS = {
  synced: 'text-success',
  pending: 'text-warning',
  failed: 'text-destructive',
} as const;

// Run status colors for forward rules
export const RUN_STATUS_COLORS = {
  running: 'text-success',
  stopped: 'text-muted-foreground',
  error: 'text-destructive',
  starting: 'text-info',
  unknown: 'text-muted-foreground',
} as const;
