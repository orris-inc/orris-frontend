/**
 * Sheet Components - Unified Export
 *
 * Architecture: "Page as skeleton, Sheet/Modal as muscle, Overlay as nerve"
 *
 * Components:
 * - Sheet: Base bottom drawer (Vaul-powered)
 * - ActionSheet: iOS-style action menu
 * - ConfirmActionSheet: Confirmation variant for secondary confirmations
 *
 * Types:
 * - BaseSheetProps: All sheets extend this
 * - DeleteSheetProps: For delete confirmation sheets
 * - CreateSheetProps: For creation form sheets
 * - EditSheetProps: For edit form sheets
 * - DetailSheetProps: For read-only detail sheets
 * - ActionSheetProps: For action menus
 * - ConfirmActionSheetProps: For confirmation action sheets
 */

// Base Sheet components
export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from './Sheet';

// ActionSheet components
export { ActionSheet } from './ActionSheet';
export { ConfirmActionSheet } from './ConfirmActionSheet';

// SelectSheet component
export { SelectSheet } from './SelectSheet';

// Types
export type {
  BaseSheetProps,
  DeleteSheetProps,
  CreateSheetProps,
  EditSheetProps,
  DetailSheetProps,
  ActionSheetProps,
  ActionSheetAction,
  ConfirmActionSheetProps,
  SelectSheetProps,
  SelectSheetOption,
  SelectSheetOptionGroup,
} from './types';
