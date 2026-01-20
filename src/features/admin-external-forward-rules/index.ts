/**
 * Admin External Forward Rules Feature Module
 * Exports hooks, components, and types for admin external forward rule management
 */

// Hooks
export {
  useAdminExternalForwardRules,
  useAdminExternalForwardRulesPage,
  type AdminExternalForwardRuleFilters,
} from './hooks/useAdminExternalForwardRules';

// Components - List views
export { AdminExternalForwardRuleList } from './components/AdminExternalForwardRuleList';
export { AdminExternalForwardRuleMobileList } from './components/AdminExternalForwardRuleMobileList';
export { MobileAdminExternalForwardRulesView } from './components/MobileAdminExternalForwardRulesView';

// Components - Responsive modals (auto-switch between Dialog/Sheet)
export {
  AdminCreateExternalForwardRuleModal,
  AdminEditExternalForwardRuleModal,
} from './components/AdminExternalForwardRuleModal';

// Components - Shared form
export { AdminExternalForwardRuleForm } from './components/AdminExternalForwardRuleForm';

// Re-export types from API for convenience
export type {
  AdminExternalForwardRule,
  AdminExternalForwardStatus,
  AdminListExternalForwardRulesParams,
  AdminCreateExternalForwardRuleRequest,
  AdminUpdateExternalForwardRuleRequest,
} from '@/api/admin/types';
