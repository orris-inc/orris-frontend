/**
 * Admin External Forward Rule Modal
 * Responsive modal for creating and editing external forward rules
 * Automatically switches between Dialog (desktop) and Sheet (mobile)
 *
 * Best Practice:
 * - Modal handles Header, Body (scrollable), and Footer layout
 * - Form component provides content via render prop for footer actions
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from '@/components/common/ResponsiveModal';
import { AdminExternalForwardRuleForm } from './AdminExternalForwardRuleForm';
import type {
  AdminExternalForwardRule,
  AdminCreateExternalForwardRuleRequest,
  AdminUpdateExternalForwardRuleRequest,
} from '@/api/admin/types';

// ============================================================================
// Create Modal
// ============================================================================

interface AdminCreateExternalForwardRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdminCreateExternalForwardRuleRequest) => void;
  isCreating?: boolean;
}

export const AdminCreateExternalForwardRuleModal: React.FC<AdminCreateExternalForwardRuleModalProps> = ({
  open,
  onClose,
  onSubmit,
  isCreating = false,
}) => {
  const { t } = useTranslation();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isCreating) {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      maxWidth="max-w-[600px]"
    >
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>
          {t('admin.externalForwardRules.createDialog.title')}
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>
      <ResponsiveModalBody>
        <AdminExternalForwardRuleForm
          mode="create"
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isCreating}
          renderFooter={({ onSubmit: handleSubmit, onCancel, isValid, isSubmitting }) => (
            <ResponsiveModalFooter>
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                {t('common.actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? t('admin.externalForwardRules.createDialog.creating')
                  : t('common.actions.create')}
              </Button>
            </ResponsiveModalFooter>
          )}
        />
      </ResponsiveModalBody>
    </ResponsiveModal>
  );
};

// ============================================================================
// Edit Modal
// ============================================================================

interface AdminEditExternalForwardRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ruleId: string, data: AdminUpdateExternalForwardRuleRequest) => void;
  rule: AdminExternalForwardRule | null;
  isUpdating?: boolean;
}

export const AdminEditExternalForwardRuleModal: React.FC<AdminEditExternalForwardRuleModalProps> = ({
  open,
  onClose,
  onSubmit,
  rule,
  isUpdating = false,
}) => {
  const { t } = useTranslation();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isUpdating) {
      onClose();
    }
  };

  if (!rule) {
    return null;
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      maxWidth="max-w-[600px]"
    >
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>
          {t('admin.externalForwardRules.editDialog.title')}
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>
      <ResponsiveModalBody>
        <AdminExternalForwardRuleForm
          mode="edit"
          rule={rule}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isUpdating}
          renderFooter={({ onSubmit: handleSubmit, onCancel, isValid, hasChanges, isSubmitting }) => (
            <ResponsiveModalFooter>
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                {t('common.actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || !hasChanges || isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? t('admin.externalForwardRules.editDialog.saving')
                  : t('common.actions.save')}
              </Button>
            </ResponsiveModalFooter>
          )}
        />
      </ResponsiveModalBody>
    </ResponsiveModal>
  );
};
