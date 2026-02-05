/**
 * Shadowsocks protocol configuration form component
 * Handles plugin and plugin options configuration
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { AlertCircle } from 'lucide-react';

export interface ShadowsocksConfigFormProps {
  plugin?: string;
  pluginOptsString: string;
  onPluginChange: (value: string) => void;
  onPluginOptsChange: (value: string) => void;
  errors?: Record<string, string>;
}

interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = memo(({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <Label className="text-sm font-medium text-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {(error || hint) && (
      <p className={`text-xs flex items-center gap-1 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
        {error && <AlertCircle className="size-3" />}
        {error || hint}
      </p>
    )}
  </div>
));

const ShadowsocksConfigFormBase: React.FC<ShadowsocksConfigFormProps> = ({
  plugin,
  pluginOptsString,
  onPluginChange,
  onPluginOptsChange,
  errors = {},
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <FormField
        label={t('admin.nodes.form.plugin')}
        hint={t('admin.nodes.form.pluginHint')}
        error={errors.plugin}
      >
        <Input
          id="plugin"
          placeholder="obfs-local"
          value={plugin || ''}
          onChange={(e) => onPluginChange(e.target.value)}
          className="h-10 font-mono"
        />
      </FormField>

      <FormField
        label={t('admin.nodes.form.pluginOptions')}
        hint={t('admin.nodes.form.pluginOptionsHint')}
        error={errors.pluginOpts}
      >
        <Input
          id="pluginOpts"
          placeholder="obfs=http;obfs-host=www.bing.com"
          value={pluginOptsString}
          onChange={(e) => onPluginOptsChange(e.target.value)}
          className="h-10 font-mono"
        />
      </FormField>
    </div>
  );
};

export const ShadowsocksConfigForm = memo(ShadowsocksConfigFormBase);
