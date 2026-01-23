/**
 * Node Install Script Dialog
 * Wrapper around shared InstallScriptDialog for nodes
 */

import {
  InstallScriptDialog as BaseInstallScriptDialog,
  type InstallScriptData,
} from '@/shared/components/agent';
import type { GenerateNodeInstallScriptResponse } from '@/api/node';

interface NodeInstallScriptDialogProps {
  open: boolean;
  installScriptData: GenerateNodeInstallScriptResponse | null;
  nodeName?: string;
  onClose: () => void;
}

/**
 * Transform API response to common InstallScriptData
 */
const transformData = (
  data: GenerateNodeInstallScriptResponse | null
): InstallScriptData | null => {
  if (!data) return null;
  return {
    installCommand: data.installCommand,
    uninstallCommand: data.uninstallCommand,
    scriptUrl: data.scriptUrl,
    apiUrl: data.apiUrl,
    token: data.token,
  };
};

export const NodeInstallScriptDialog: React.FC<NodeInstallScriptDialogProps> = ({
  open,
  installScriptData,
  nodeName,
  onClose,
}) => {
  return (
    <BaseInstallScriptDialog
      open={open}
      onClose={onClose}
      data={transformData(installScriptData)}
      entityName={nodeName}
      i18nNamespace="admin.nodes.installScript"
    />
  );
};
