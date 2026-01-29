/**
 * Mobile Style Constants - iOS Human Interface Guidelines Compliant
 *
 * This file provides unified style constants for mobile components,
 * ensuring consistency across the mobile experience.
 *
 * Reference: Apple iOS Human Interface Guidelines
 * - Touch targets: minimum 44pt
 * - Typography: Dynamic Type scale
 * - Spacing: 8pt grid system
 */

// ============================================================================
// Typography Scale
// ============================================================================

/**
 * Font size constants following iOS typography guidelines.
 * Maps to Tailwind CSS classes for consistency.
 *
 * Usage:
 * - display: Large titles, hero text (text-2xl, 24px)
 * - heading: Section headers, card titles (text-lg, 18px)
 * - body: Primary content text (text-sm, 14px)
 * - label: Secondary text, descriptions (text-xs, 12px)
 * - caption: Tertiary info, timestamps (text-[11px], 11px)
 * - tiny: Badges, tags, minimal text (text-[10px], 10px)
 */
export const MOBILE_TYPOGRAPHY = {
  /** Large titles, hero sections - 24px */
  display: 'text-2xl',
  /** Section headers, card titles - 18px */
  heading: 'text-lg',
  /** Primary content, body text - 14px */
  body: 'text-sm',
  /** Secondary text, descriptions - 12px */
  label: 'text-xs',
  /** Tertiary info, timestamps - 11px */
  caption: 'text-[11px]',
  /** Badges, tags, minimal labels - 10px */
  tiny: 'text-[10px]',
} as const;

// ============================================================================
// Touch Target Standards
// ============================================================================

/**
 * Touch target size constants following iOS HIG.
 * All interactive elements should meet minimum 44px requirement.
 *
 * Usage:
 * - minimum: Required for all interactive elements (44px)
 * - comfortable: Default for buttons (40px)
 * - large: Prominent actions (48px)
 * - compact: Internal button height (36px) - use with larger touch area padding
 */
export const MOBILE_TOUCH_TARGETS = {
  /** Minimum iOS touch target - 44px */
  minimum: 'min-h-[44px] min-w-[44px]',
  /** Comfortable touch target - 40px */
  comfortable: 'h-10 min-w-10',
  /** Large touch target - 48px */
  large: 'h-12 min-w-12',
  /** Compact internal height - 36px (must have padding for 44px hit area) */
  compact: 'h-9',
  /** Standard action button - 44px */
  actionButton: 'h-11 min-h-[44px]',
} as const;

// ============================================================================
// Card Structure Styles
// ============================================================================

/**
 * Card container styles following iOS 26 Liquid Glass design.
 */
export const MOBILE_CARD_STYLES = {
  /** Base card container */
  container: 'bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden',
  /** Card header area */
  header: 'px-4 py-3 min-h-[60px] flex items-center justify-between gap-3',
  /** Card header with touch feedback */
  headerTouchable: 'w-full px-4 py-3 min-h-[60px] flex items-center justify-between gap-3 text-left cursor-pointer motion-safe:active:bg-foreground/5',
  /** Card content section */
  content: 'border-t border-border/30 px-4 py-3',
  /** Card actions section */
  actions: 'border-t border-border/30 px-4 py-3',
  /** Detail row in card */
  detailRow: 'flex items-center gap-3',
  /** Detail row with top alignment (for multi-line content) */
  detailRowTop: 'flex items-start gap-3',
  /** Detail label (uppercase tiny text) */
  detailLabel: 'text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5',
  /** Detail value */
  detailValue: 'text-xs text-foreground',
  /** Detail icon */
  detailIcon: 'size-4 text-muted-foreground shrink-0',
} as const;

// ============================================================================
// List Item Styles
// ============================================================================

/**
 * List item styles following iOS Settings app design.
 */
export const MOBILE_LIST_STYLES = {
  /** List item container */
  item: 'group relative flex w-full items-center gap-3 px-4 py-3 min-h-[52px]',
  /** Interactive list item */
  itemInteractive: 'cursor-pointer transition-colors duration-150 motion-reduce:transition-none active:bg-muted/80 text-left',
  /** List item divider (not on last item) */
  itemDivider: 'border-b border-border/30',
  /** Icon container in list item - 40px square */
  iconContainer: 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted/60',
  /** List section title */
  sectionTitle: 'text-xs text-muted-foreground uppercase tracking-wide font-medium',
} as const;

// ============================================================================
// Search and Filter Styles
// ============================================================================

/**
 * Search input and filter control styles.
 */
export const MOBILE_SEARCH_STYLES = {
  /** Search container */
  container: 'flex items-center gap-2 h-11 min-h-[44px] px-3 bg-foreground/5 rounded-xl border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-colors',
  /** Search input - use text-base (16px) to prevent iOS auto-zoom */
  input: 'flex-1 min-w-0 bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none',
  /** Search icon */
  icon: 'size-4 text-muted-foreground shrink-0',
  /** Clear button */
  clearButton: 'size-8 min-h-[44px] rounded-full flex items-center justify-center hover:bg-foreground/10',
} as const;

// ============================================================================
// Button Styles
// ============================================================================

/**
 * Action button styles for mobile.
 */
export const MOBILE_BUTTON_STYLES = {
  /** Primary action button */
  primary: 'bg-primary text-primary-foreground active:bg-primary/90',
  /** Default/secondary button */
  default: 'bg-muted/80 text-foreground active:bg-muted',
  /** Destructive action button */
  destructive: 'bg-destructive/10 text-destructive active:bg-destructive/20',
  /** Success action button */
  success: 'bg-success/15 text-success active:bg-success/25',
  /** Warning action button */
  warning: 'bg-warning/15 text-warning active:bg-warning/25',
  /** Icon-only button base */
  iconButton: 'size-10 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 border border-border/50 transition-colors',
  /** Filter button */
  filterButton: 'h-11 min-h-[44px] px-3 rounded-xl flex items-center gap-1.5 bg-foreground/5 hover:bg-foreground/10 border border-border/50 text-sm font-medium transition-colors',
} as const;

// ============================================================================
// Protocol Badge Colors (using CSS variables)
// ============================================================================

/**
 * Protocol-specific badge colors using CSS variables.
 * Replaces hardcoded colors like purple-500 and orange-500.
 */
export const PROTOCOL_BADGE_STYLES = {
  shadowsocks: 'bg-info/10 text-info',
  trojan: 'bg-primary/10 text-primary',
  vless: 'bg-success/10 text-success',
  vmess: 'bg-warning/10 text-warning',
  /** Hysteria2 - uses info variant (blue family) */
  hysteria2: 'bg-info/10 text-info',
  /** TUIC - uses warning variant (amber/orange family) */
  tuic: 'bg-warning/10 text-warning',
} as const;

// ============================================================================
// Spacing Constants
// ============================================================================

/**
 * Common spacing values for mobile layouts.
 */
export const MOBILE_SPACING = {
  /** Page horizontal padding */
  pageX: 'px-4',
  /** Card internal padding */
  cardPadding: 'p-4',
  /** Gap between cards in a list */
  listGap: 'space-y-2.5',
  /** Gap between items in a row */
  rowGap: 'gap-2',
  /** Section margin top */
  sectionMargin: 'mt-4',
} as const;

// ============================================================================
// Animation Classes
// ============================================================================

/**
 * Animation classes with motion-reduced fallbacks.
 */
export const MOBILE_ANIMATIONS = {
  /** Active press feedback scale */
  pressScale: 'motion-safe:active:scale-[0.97]',
  /** Chevron rotation on expand */
  chevronRotate: 'transition-transform duration-200 motion-reduce:transition-none',
  /** General transition */
  transition: 'transition-colors duration-150 motion-reduce:transition-none',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type MobileTypographyKey = keyof typeof MOBILE_TYPOGRAPHY;
export type MobileTouchTargetKey = keyof typeof MOBILE_TOUCH_TARGETS;
export type MobileCardStyleKey = keyof typeof MOBILE_CARD_STYLES;
export type ProtocolBadgeStyleKey = keyof typeof PROTOCOL_BADGE_STYLES;
