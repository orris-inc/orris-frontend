/**
 * Exit Agent Configuration Fields
 * Extracted from CreateForwardRuleDialog - exit mode selection + agent configuration
 * Used for 'entry' rule type
 */

import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { RadioGroup, RadioGroupItem } from '@/components/common/RadioGroup';
import { Info } from 'lucide-react';
import { ExitAgentList } from './ExitAgentList';
import { FormField } from './form-primitives';
import type { ForwardAgent, TunnelType, ExitAgent, LoadBalanceStrategy } from '@/api/forward';

interface ExitAgentConfigFieldsProps {
  exitMode: 'single' | 'multi';
  onExitModeChange: (mode: string) => void;
  exitAgentId: string;
  onExitAgentIdChange: (value: string) => void;
  selectedExitAgent?: ForwardAgent;
  exitAgents: ExitAgent[];
  onExitAgentsChange: (agents: ExitAgent[]) => void;
  loadBalanceStrategy: LoadBalanceStrategy;
  onLoadBalanceStrategyChange: (value: string) => void;
  availableExitAgents: ForwardAgent[];
  tunnelType: string;
  onTunnelTypeChange: (value: string) => void;
  errors: Record<string, string | undefined>;
  idPrefix?: string;
}

export const ExitAgentConfigFields: React.FC<ExitAgentConfigFieldsProps> = ({
  exitMode,
  onExitModeChange,
  exitAgentId,
  onExitAgentIdChange,
  selectedExitAgent,
  exitAgents,
  onExitAgentsChange,
  loadBalanceStrategy,
  onLoadBalanceStrategyChange,
  availableExitAgents,
  tunnelType,
  onTunnelTypeChange,
  errors,
  idPrefix = '',
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Exit Mode Selection */}
      <div className="col-span-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">
          {t('admin.forwardRules.form.exitNode')}
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <RadioGroup
          value={exitMode}
          onValueChange={onExitModeChange}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id={`${idPrefix}exit-single`} />
            <Label
              htmlFor={`${idPrefix}exit-single`}
              className="font-normal cursor-pointer"
            >
              {t('admin.forwardRules.exitAgents.singleMode')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multi" id={`${idPrefix}exit-multi`} />
            <Label
              htmlFor={`${idPrefix}exit-multi`}
              className="font-normal cursor-pointer"
            >
              {t('admin.forwardRules.exitAgents.multiMode')}
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground mt-1">
          {t('admin.forwardRules.exitAgents.modeHint')}
        </p>
      </div>

      {/* Single Exit Agent Mode */}
      {exitMode === 'single' && (
        <FormField
          label={t('admin.forwardRules.form.exitNode')}
          required
          error={errors.exitAgentId}
          className="col-span-6 sm:col-span-4"
        >
          <Select
            value={exitAgentId}
            onValueChange={onExitAgentIdChange}
          >
            <SelectTrigger
              className={errors.exitAgentId ? 'border-destructive' : ''}
            >
              <SelectValue
                placeholder={t('admin.forwardRules.form.selectExitNode')}
              />
            </SelectTrigger>
            <SelectContent>
              {availableExitAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <span className="flex items-center gap-2">
                    {agent.name}
                    {agent.allowedPortRange && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-warning/50 text-warning"
                      >
                        {agent.allowedPortRange}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      {/* Multi Exit Agent Mode (Load Balancing) */}
      {exitMode === 'multi' && (
        <>
          <FormField
            label={t('admin.forwardRules.exitAgents.loadBalancing')}
            required
            error={errors.exitAgents}
            className="col-span-6 sm:col-span-4"
          >
            <ExitAgentList
              agents={availableExitAgents}
              exitAgents={exitAgents}
              onChange={onExitAgentsChange}
              hasError={!!errors.exitAgents}
              idPrefix={`${idPrefix}exit-agent`}
              loadBalanceStrategy={loadBalanceStrategy}
            />
          </FormField>

          <FormField
            label={t('admin.forwardRules.exitAgents.strategy')}
            hint={
              loadBalanceStrategy === 'failover'
                ? t('admin.forwardRules.exitAgents.strategyFailoverHint')
                : t('admin.forwardRules.exitAgents.strategyWeightedHint')
            }
            className="col-span-6 sm:col-span-2"
          >
            <Select
              value={loadBalanceStrategy}
              onValueChange={onLoadBalanceStrategyChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="failover">
                  {t('admin.forwardRules.exitAgents.strategyFailover')}
                </SelectItem>
                <SelectItem value="weighted">
                  {t('admin.forwardRules.exitAgents.strategyWeighted')}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </>
      )}

      {/* Tunnel Type */}
      <FormField
        label={t('admin.forwardRules.form.tunnelType')}
        className={exitMode === 'single' ? 'col-span-6 sm:col-span-2' : 'col-span-6 sm:col-span-3'}
      >
        <Select
          value={tunnelType}
          onValueChange={(value) => onTunnelTypeChange(value as TunnelType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ws">WebSocket</SelectItem>
            <SelectItem value="tls">TLS</SelectItem>
            <SelectItem value="ws_smux">WebSocket + SMUX</SelectItem>
            <SelectItem value="tls_smux">TLS + SMUX</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Port Range Warning for single exit agent */}
      {exitMode === 'single' && selectedExitAgent?.allowedPortRange && (
        <div className="col-span-6 flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/30 rounded-md px-2.5 py-1.5 -mt-2">
          <Info className="size-3.5 shrink-0" />
          <span>
            {t('admin.forwardRules.form.portRestriction', {
              range: selectedExitAgent.allowedPortRange,
            })}
          </span>
        </div>
      )}
    </>
  );
};
