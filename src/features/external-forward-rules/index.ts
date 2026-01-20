/**
 * External Forward Rules Feature Module
 */

// Hooks
export { useExternalForwardRules, useExternalForwardRulesSection } from './hooks/useExternalForwardRules';
export type { ExternalForwardRuleFilters } from './hooks/useExternalForwardRules';

// Components
export { ExternalForwardRulesSection } from './components/ExternalForwardRulesSection';
export { ExternalForwardRuleList } from './components/ExternalForwardRuleList';
export { ExternalForwardRuleMobileList } from './components/ExternalForwardRuleMobileList';
export { CreateExternalForwardRuleDialog } from './components/CreateExternalForwardRuleDialog';
export { EditExternalForwardRuleDialog } from './components/EditExternalForwardRuleDialog';

// Re-export types from API for convenience
export type {
  ExternalForwardRule,
  ExternalForwardStatus,
  CreateExternalForwardRuleRequest,
  UpdateExternalForwardRuleRequest,
  ListExternalForwardRulesParams,
} from '@/api/externalforward/types';
