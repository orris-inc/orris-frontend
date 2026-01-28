/**
 * Passkey Management Component
 * Allows users to view, add, and remove passkeys
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Fingerprint,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Key,
  Smartphone,
  Monitor,
  Usb,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { usePasskeyManagement } from '../hooks/usePasskeyManagement';
import type { PasskeyCredential } from '@/api/passkey';
import { inputStyles, labelStyles, getAlertClass } from '@/lib/ui-styles';

// ============================================================================
// Shared Styles
// ============================================================================

const buttonBaseStyles =
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const buttonPrimaryStyles = `${buttonBaseStyles} bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2`;

const buttonSecondaryStyles = `${buttonBaseStyles} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2`;

const buttonDestructiveStyles = `${buttonBaseStyles} bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2`;

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Get icon for passkey transport type
 */
function getTransportIcon(transports: string[]): React.ReactNode {
  // Prioritize internal (platform) authenticator
  if (transports.includes('internal')) {
    return <Fingerprint className="size-5 text-muted-foreground" />;
  }
  // USB security key
  if (transports.includes('usb')) {
    return <Usb className="size-5 text-muted-foreground" />;
  }
  // Bluetooth
  if (transports.includes('ble')) {
    return <Smartphone className="size-5 text-muted-foreground" />;
  }
  // Hybrid (cross-device)
  if (transports.includes('hybrid')) {
    return <Smartphone className="size-5 text-muted-foreground" />;
  }
  // NFC
  if (transports.includes('nfc')) {
    return <Key className="size-5 text-muted-foreground" />;
  }
  // Default
  return <Monitor className="size-5 text-muted-foreground" />;
}

/**
 * Get transport type label
 */
function getTransportLabel(transports: string[], t: (key: string) => string): string {
  if (transports.includes('internal')) {
    return t('profile.security.passkey.transportInternal');
  }
  if (transports.includes('usb')) {
    return t('profile.security.passkey.transportUsb');
  }
  if (transports.includes('ble')) {
    return t('profile.security.passkey.transportBle');
  }
  if (transports.includes('hybrid')) {
    return t('profile.security.passkey.transportHybrid');
  }
  if (transports.includes('nfc')) {
    return t('profile.security.passkey.transportNfc');
  }
  return t('common.status.unknown');
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Passkey Item Component
// ============================================================================

interface PasskeyItemProps {
  passkey: PasskeyCredential;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

function PasskeyItem({ passkey, isDeleting, onDelete }: PasskeyItemProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
      <div className="flex items-start gap-3">
        {getTransportIcon(passkey.transports)}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{passkey.deviceName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {getTransportLabel(passkey.transports, t)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('profile.security.passkey.addedOn', { date: formatDate(passkey.createdAt) })}
          </p>
          <p className="text-xs text-muted-foreground">
            {passkey.lastUsedAt
              ? t('profile.security.passkey.lastUsed', { date: formatDate(passkey.lastUsedAt) })
              : t('profile.security.passkey.neverUsed')}
          </p>
        </div>
      </div>

      <AlertDialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialog.Trigger asChild>
          <button
            type="button"
            disabled={isDeleting}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            aria-label={t('common.actions.delete')}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
            <AlertDialog.Title className="text-lg font-semibold">
              {t('profile.security.passkey.deleteConfirmTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {t('profile.security.passkey.deleteConfirmDesc', { name: passkey.deviceName })}
            </AlertDialog.Description>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={() => onDelete(passkey.id)}
                  className={buttonDestructiveStyles}
                >
                  {t('common.actions.delete')}
                </button>
              </AlertDialog.Action>
              <AlertDialog.Cancel asChild>
                <button type="button" className={buttonSecondaryStyles}>
                  {t('common.actions.cancel')}
                </button>
              </AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

// ============================================================================
// Add Passkey Dialog
// ============================================================================

interface AddPasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name?: string) => Promise<boolean>;
  isRegistering: boolean;
}

function AddPasskeyDialog({ open, onOpenChange, onAdd, isRegistering }: AddPasskeyDialogProps) {
  const { t } = useTranslation();
  const [deviceName, setDeviceName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = deviceName.trim() || undefined;
    const success = await onAdd(name);
    if (success) {
      setDeviceName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
            {t('profile.security.passkey.addTitle')}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {t('profile.security.passkey.addDesc')}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="deviceName" className={labelStyles}>
                {t('profile.security.passkey.deviceName')}
              </label>
              <input
                id="deviceName"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={t('profile.security.passkey.deviceNamePlaceholder')}
                className={inputStyles}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t('profile.security.passkey.deviceNameHint')}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className={buttonSecondaryStyles}>
                  {t('common.actions.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isRegistering}
                className={`${buttonPrimaryStyles} disabled:pointer-events-none disabled:opacity-50`}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('profile.security.passkey.registering')}
                  </>
                ) : (
                  t('common.actions.continue')
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PasskeyManagement() {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const {
    isSupported,
    passkeys,
    isLoading,
    isRegistering,
    deletingId,
    error,
    registerPasskey,
    removePasskey,
    clearError,
  } = usePasskeyManagement();

  const handleAdd = async (name?: string): Promise<boolean> => {
    clearError();
    return registerPasskey(name);
  };

  const handleDelete = async (id: string) => {
    clearError();
    await removePasskey(id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">{t('profile.security.passkey.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('profile.security.passkey.desc')}
        </p>
      </div>

      {/* Content card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-6 space-y-4">
          {/* Browser not supported warning */}
          {!isSupported && (
            <div className={getAlertClass('destructive')}>
              <AlertTriangle className="size-4" />
              <div>
                <p className="text-sm font-medium">
                  {t('profile.security.passkey.notSupportedTitle')}
                </p>
                <p className="text-sm">
                  {t('profile.security.passkey.notSupportedDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={getAlertClass('destructive')}>
              <AlertTriangle className="size-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && isSupported && passkeys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Fingerprint className="size-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {t('profile.security.passkey.empty')}
              </p>
              <button
                type="button"
                onClick={() => setShowAddDialog(true)}
                className={buttonPrimaryStyles}
              >
                <Plus className="mr-2 size-4" />
                {t('profile.security.passkey.add')}
              </button>
            </div>
          )}

          {/* Passkey list */}
          {!isLoading && passkeys.length > 0 && (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <PasskeyItem
                  key={passkey.id}
                  passkey={passkey}
                  isDeleting={deletingId === passkey.id}
                  onDelete={handleDelete}
                />
              ))}

              {/* Add button */}
              {isSupported && (
                <button
                  type="button"
                  onClick={() => setShowAddDialog(true)}
                  className={`${buttonSecondaryStyles} w-full border-dashed`}
                >
                  <Plus className="mr-2 size-4" />
                  {t('profile.security.passkey.add')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add passkey dialog */}
      <AddPasskeyDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAdd}
        isRegistering={isRegistering}
      />
    </div>
  );
}
