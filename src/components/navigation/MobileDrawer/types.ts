/**
 * Mobile Drawer Types
 *
 * Shared types for MobileDrawer subcomponents.
 */

import type { NavigationItem } from '@/types/navigation.types';

export interface MobileDrawerUser {
  displayName?: string;
  email?: string;
  initials?: string;
  avatarUrl?: string;
}

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  user?: MobileDrawerUser | null;
  /** Show switch button (admin/user toggle) */
  showAdminSwitch?: boolean;
  /** Whether currently in admin view - changes switch button text/icon */
  isAdminView?: boolean;
  /** Title shown in header when no user */
  title?: string;
  /** Server version */
  serverVersion?: string;
  /** Client version */
  clientVersion?: string;
  onAdminClick?: () => void;
  onLogout?: () => void;
}

export interface MobileDrawerHeaderProps {
  user?: MobileDrawerUser | null;
  title?: string;
  onClose: () => void;
}

export interface MobileDrawerNavProps {
  items: NavigationItem[];
  isGrouped?: boolean;
  onNavigate: (path: string) => void;
}

export interface MobileDrawerFooterProps {
  showAdminSwitch?: boolean;
  isAdminView?: boolean;
  serverVersion?: string;
  clientVersion?: string;
  onAdminClick?: () => void;
  onLogout?: () => void;
  onClose: () => void;
}
