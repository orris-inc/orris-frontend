/**
 * Node Install Script Sheet (Mobile)
 * Wrapper around shared InstallScriptSheet for nodes
 */

import {
  InstallScriptSheet as BaseInstallScriptSheet,
  type InstallScriptData,
} from '@/shared/components/agent';
import type { GenerateNodeInstallScriptResponse } from '@/api/node';

interface NodeInstallScriptSheetProps {
  open: boolean;
  installScriptData: GenerateNodeInstallScriptResponse | null;
  nodeName?: string;
  onClose: () => void;
}

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

export const NodeInstallScriptSheet: React.FC<NodeInstallScriptSheetProps> = ({
  open,
  installScriptData,
  nodeName,
  onClose,
}) => {
  return (
    <BaseInstallScriptSheet
      open={open}
      onClose={onClose}
      data={transformData(installScriptData)}
      entityName={nodeName}
      i18nNamespace="admin.nodes.installScript"
    />
  );
};
