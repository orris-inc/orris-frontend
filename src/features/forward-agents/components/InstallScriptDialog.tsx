/**
 * Forward Agent Install Script Dialog
 * Wrapper around shared InstallScriptDialog for forward agents
 */

import {
  InstallScriptDialog as BaseInstallScriptDialog,
  type InstallScriptData,
} from '@/shared/components/agent';
import type { InstallCommandResponse } from '@/api/forward';

interface InstallScriptDialogProps {
  open: boolean;
  installCommandData: InstallCommandResponse | null;
  agentName?: string;
  onClose: () => void;
}

/**
 * Transform API response to common InstallScriptData
 */
const transformData = (
  data: InstallCommandResponse | null
): InstallScriptData | null => {
  if (!data) return null;
  return {
    installCommand: data.installCommand,
    uninstallCommand: data.uninstallCommand,
    scriptUrl: data.scriptUrl,
    apiUrl: data.serverUrl,
    token: data.token,
  };
};

export const InstallScriptDialog: React.FC<InstallScriptDialogProps> = ({
  open,
  installCommandData,
  agentName,
  onClose,
}) => {
  return (
    <BaseInstallScriptDialog
      open={open}
      onClose={onClose}
      data={transformData(installCommandData)}
      entityName={agentName}
      i18nNamespace="admin.forwardAgents.installScript"
    />
  );
};
