/**
 * Node Other Settings Fields
 * Extracted from EditNodeSheet/EditNodeDialog/CreateNodeDialog
 * Supports desktop (Input/Select) and mobile (MobileFormInput/MobileSelect) variants
 */

import { useTranslation } from 'react-i18next';
import { SmartTruncate } from '@/components/common/SmartTruncate';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { Switch, SwitchThumb } from '@/components/common/Switch';
import { Checkbox } from '@/components/common/Checkbox';
import { ScrollArea } from '@/components/common/ScrollArea';
import { ExpirationDatePicker } from '@/components/common/ExpirationDatePicker';
import { MobileFormInput } from '@/components/common/mobile-form';
import { cardStyles } from '@/lib/ui-styles';
import { cn } from '@/lib/utils';
import { Layers, X, FolderTree } from 'lucide-react';
import type { ResourceGroup } from '@/api/resource/types';

interface NodeOtherSettingsFieldsProps {
  variant: 'desktop' | 'mobile';
  mode: 'create' | 'edit';
  formData: {
    region?: string;
    sortOrder?: number;
    tagsInput?: string;
    groupSids: string[];
    muteNotification?: boolean;
    expiresAt?: string;
    costLabel?: string;
  };
  onFieldChange: (field: string, value: string | number | boolean | undefined) => void;
  onCostLabelChange: (value: string) => void;
  onGroupToggle: (sid: string, checked: boolean) => void;
  onGroupRemove: (sid: string) => void;
  filteredResourceGroups: ResourceGroup[];
  isLoading: boolean;
  errors?: Record<string, string>;
}

// Desktop form field wrapper
const DesktopFormField: React.FC<{
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, icon, className = '', children }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <Label className={icon ? 'flex items-center gap-1.5' : ''}>
      {icon}
      {label}
    </Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// Mobile form field label
const FormFieldLabel: React.FC<{
  label: string;
  hint?: string;
}> = ({ label, hint }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {hint && <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>}
  </div>
);

export const NodeOtherSettingsFields: React.FC<NodeOtherSettingsFieldsProps> = ({
  variant,
  mode,
  formData,
  onFieldChange,
  onCostLabelChange,
  onGroupToggle,
  onGroupRemove,
  filteredResourceGroups,
  isLoading,
}) => {
  const { t } = useTranslation();
  const isMobile = variant === 'mobile';
  const isEdit = mode === 'edit';

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.region')} />
            <MobileFormInput
              value={formData.region || ''}
              onChange={(value) => onFieldChange('region', value)}
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel label={t('common.fields.sortOrder')} />
            <MobileFormInput
              type="number"
              value={String(formData.sortOrder ?? 0)}
              onChange={(value) => onFieldChange('sortOrder', parseInt(value, 10) || 0)}
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FormFieldLabel label={t('admin.nodes.form.tags')} hint={t('admin.nodes.form.tagsHint')} />
          <MobileFormInput
            placeholder={t('admin.nodes.form.tagsPlaceholder')}
            value={formData.tagsInput ?? ''}
            onChange={(value) => onFieldChange('tagsInput', value)}
          />
        </div>

        <div className="space-y-1.5">
          <FormFieldLabel label={t('admin.nodes.form.resourceGroup')} hint={t('admin.nodes.form.resourceGroupSelectHint')} />

          {/* Selected groups chips */}
          {formData.groupSids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.groupSids.map((sid) => {
                const group = filteredResourceGroups.find((g) => g.sid === sid);
                return (
                  <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                    <Layers className="size-3" />
                    {group?.name ?? sid}
                    <button
                      type="button"
                      onClick={() => onGroupRemove(sid)}
                      className="ml-0.5 rounded-full p-1 hover:bg-muted min-w-[28px] min-h-[28px] flex items-center justify-center"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Group selection list */}
          <div className={cn(cardStyles, 'max-h-[150px] overflow-y-auto bg-background')}>
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">{t('common.table.loading')}</div>
            ) : filteredResourceGroups.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.nodes.detail.noResourceGroups')}</div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredResourceGroups.map((group) => (
                  <label
                    key={group.sid}
                    className="flex items-center gap-3 p-3 active:bg-accent/30 transition-colors min-h-[52px]"
                  >
                    <Checkbox
                      checked={formData.groupSids.includes(group.sid)}
                      onCheckedChange={(checked) => onGroupToggle(group.sid, !!checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                          {group.status === 'active' ? t('common.status.enabled') : t('common.status.disabled')}
                        </Badge>
                      </div>
                      {group.description && <SmartTruncate text={group.description} className="text-xs text-muted-foreground" />}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {isEdit && (
          <div className="space-y-1.5">
            <FormFieldLabel label={t('admin.nodes.form.muteNotification')} hint={t('admin.nodes.form.muteNotificationHint')} />
            <div className="flex items-center gap-3 min-h-[52px] px-4 rounded-xl ring-1 ring-border bg-background">
              <Switch
                checked={formData.muteNotification ?? false}
                onCheckedChange={(checked) => onFieldChange('muteNotification', checked)}
              >
                <SwitchThumb />
              </Switch>
              <span className="text-sm text-muted-foreground">
                {formData.muteNotification ? t('admin.nodes.form.muted') : t('admin.nodes.form.unmuted')}
              </span>
            </div>
          </div>
        )}

        {/* Expiration time */}
        <div className="space-y-1.5">
          <FormFieldLabel label={t('common.fields.expiresAt')} hint={t('admin.nodes.form.expiresAtHint')} />
          <ExpirationDatePicker
            value={formData.expiresAt}
            onChange={(value) => onFieldChange('expiresAt', value ?? '')}
            emptyValue={isEdit ? '' : undefined}
            id="expiresAt"
            mobile
          />
        </div>

        {/* Cost label */}
        <div className="space-y-1.5">
          <FormFieldLabel label={t('common.fields.costLabel')} hint={t('common.costLabel.hint')} />
          <MobileFormInput
            value={formData.costLabel ?? ''}
            onChange={(value) => onCostLabelChange(value)}
            placeholder={t('common.costLabel.placeholder')}
          />
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
      <DesktopFormField label={t('admin.nodes.form.region')} hint={isEdit ? undefined : t('admin.nodes.form.regionHint')}>
        <Input
          id="region"
          placeholder={isEdit ? undefined : t('admin.nodes.form.regionPlaceholder')}
          value={formData.region || ''}
          onChange={(e) => onFieldChange('region', e.target.value)}
        />
      </DesktopFormField>

      <DesktopFormField label={t('common.fields.sortOrder')} hint={t('admin.nodes.form.sortOrderHint')}>
        <Input
          id="sortOrder"
          type="number"
          value={formData.sortOrder ?? 0}
          onChange={(e) => onFieldChange('sortOrder', parseInt(e.target.value, 10) || 0)}
          className={isEdit ? '' : 'h-10 font-mono'}
        />
      </DesktopFormField>

      <DesktopFormField
        label={t('admin.nodes.form.tags')}
        hint={t('admin.nodes.form.tagsHint')}
        className="@md:col-span-2"
      >
        <Input
          id="tagsInput"
          placeholder={t('admin.nodes.form.tagsPlaceholder')}
          value={formData.tagsInput ?? ''}
          onChange={(e) => onFieldChange('tagsInput', e.target.value)}
          className={isEdit ? '' : 'h-10'}
        />
      </DesktopFormField>

      {/* Resource Groups (multi-select) */}
      <div className="flex flex-col gap-2 @md:col-span-2">
        <Label className="flex items-center gap-1.5">
          {!isEdit && <FolderTree className="size-4" />}
          {isEdit ? t('admin.nodes.form.resourceGroup') : t('admin.nodes.form.bindResourceGroups')}
        </Label>
        {isEdit ? (
          <p className="text-xs text-muted-foreground">{t('admin.nodes.form.resourceGroupSelectHint')}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {formData.groupSids.length > 0
              ? t('admin.nodes.form.selectedGroupsCount', { count: formData.groupSids.length })
              : t('admin.nodes.form.bindResourceGroupsHint')}
          </p>
        )}

        {/* Selected groups chips (edit mode only) */}
        {isEdit && formData.groupSids.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formData.groupSids.map((sid) => {
              const group = filteredResourceGroups.find((g) => g.sid === sid);
              return (
                <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                  <Layers className="size-3" />
                  {group?.name ?? sid}
                  <button
                    type="button"
                    onClick={() => onGroupRemove(sid)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Group selection list */}
        <div className={`border rounded-lg ${isEdit ? 'max-h-[120px]' : ''} overflow-hidden`}>
          <ScrollArea className={isEdit ? 'max-h-[120px]' : 'h-[120px]'}>
            <div className={isEdit ? 'divide-y' : 'divide-y divide-border'}>
              {isLoading ? (
                <div className="p-3 text-center text-sm text-muted-foreground">{t('common.table.loading')}</div>
              ) : filteredResourceGroups.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">{t('admin.nodes.detail.noResourceGroups')}</div>
              ) : (
                filteredResourceGroups.map((group) => {
                  const isSelected = formData.groupSids.includes(group.sid);
                  return (
                    <label
                      key={group.sid}
                      className={`flex items-center gap-3 ${isEdit ? 'p-2.5' : 'px-3 py-2.5'} cursor-pointer transition-colors ${
                        isSelected ? (isEdit ? 'hover:bg-muted/50' : 'bg-primary/5') : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onGroupToggle(group.sid, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        {isEdit ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{group.name}</span>
                              <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                {group.status === 'active' ? t('common.status.enabled') : t('common.status.disabled')}
                              </Badge>
                            </div>
                            {group.description && <SmartTruncate text={group.description} className="text-xs text-muted-foreground" />}
                          </>
                        ) : (
                          <SmartTruncate text={group.name} className="text-sm font-medium" />
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mute Notification (edit mode only) */}
      {isEdit && (
        <DesktopFormField label={t('admin.nodes.form.muteNotification')} hint={t('admin.nodes.form.muteNotificationHint')}>
          <div className="flex items-center gap-3">
            <Switch
              id="muteNotification"
              checked={formData.muteNotification ?? false}
              onCheckedChange={(checked) => onFieldChange('muteNotification', checked)}
            >
              <SwitchThumb />
            </Switch>
            <span className="text-sm text-muted-foreground">
              {formData.muteNotification ? t('admin.nodes.form.muted') : t('admin.nodes.form.unmuted')}
            </span>
          </div>
        </DesktopFormField>
      )}

      {/* Expiration time */}
      <DesktopFormField label={t('common.fields.expiresAt')} hint={t('admin.nodes.form.expiresAtHint')}>
        <ExpirationDatePicker
          value={formData.expiresAt}
          onChange={(value) => onFieldChange('expiresAt', value ?? (isEdit ? '' : value))}
          emptyValue={isEdit ? '' : undefined}
          id="expiresAt"
        />
      </DesktopFormField>

      {/* Cost label */}
      <DesktopFormField label={t('common.fields.costLabel')} hint={t('common.costLabel.hint')}>
        <Input
          id="costLabel"
          type="text"
          value={formData.costLabel ?? ''}
          onChange={(e) => onCostLabelChange(e.target.value)}
          placeholder={t('common.costLabel.placeholder')}
          className={isEdit ? '' : 'h-10'}
        />
      </DesktopFormField>
    </div>
  );
};
