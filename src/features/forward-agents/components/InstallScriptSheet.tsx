/**
 * Forward Agent Install Script Sheet (Mobile)
 * Wrapper around shared InstallScriptSheet for forward agents
 */

import {
  InstallScriptSheet as BaseInstallScriptSheet,
  type InstallScriptData,
  type MultiInstanceConfig,
} from '@/shared/components/agent';
import type { InstallCommandResponse } from '@/api/forward';

interface InstallScriptSheetProps {
  open: boolean;
  installCommandData: InstallCommandResponse | null;
  agentName?: string;
  /** Enables the multi-instance name field */
  multiInstance?: MultiInstanceConfig;
  onClose: () => void;
}

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

export const InstallScriptSheet: React.FC<InstallScriptSheetProps> = ({
  open,
  installCommandData,
  agentName,
  multiInstance,
  onClose,
}) => {
  return (
    <BaseInstallScriptSheet
      open={open}
      onClose={onClose}
      data={transformData(installCommandData)}
      entityName={agentName}
      i18nNamespace="admin.forwardAgents.installScript"
      multiInstance={multiInstance}
    />
  );
};
