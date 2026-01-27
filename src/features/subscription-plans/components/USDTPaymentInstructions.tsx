/**
 * USDT payment instructions component
 * Displays USDT payment details with copy functionality and countdown timer
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { getChainDisplayName } from '@/api/payment/types';

interface USDTPaymentInstructionsProps {
  chainType: string;
  receivingAddress: string;
  usdtAmount: number;
  exchangeRate?: number;
  expiredAt: string;
  onCompleted?: () => void;
  className?: string;
}

export const USDTPaymentInstructions: React.FC<USDTPaymentInstructionsProps> = ({
  chainType,
  receivingAddress,
  usdtAmount,
  exchangeRate,
  expiredAt,
  onCompleted,
  className,
}) => {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<'address' | 'amount' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Calculate and update remaining time
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiredAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('00:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [expiredAt]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Full precision for clipboard (required for payment matching)
  const exactAmount = usdtAmount.toFixed(6);
  // Display-friendly format (removes trailing zeros)
  const displayAmount = parseFloat(exactAmount).toString();
  const chainDisplayName = getChainDisplayName(chainType);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Warning */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('pricing.confirm.usdt.warning')}
        </AlertDescription>
      </Alert>

      {/* Payment details */}
      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        {/* Network */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('pricing.confirm.usdt.network')}
          </span>
          <span className="font-medium">{chainDisplayName}</span>
        </div>

        {/* Receiving address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('pricing.confirm.usdt.receivingAddress')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(receivingAddress, 'address')}
              className="h-8 px-2"
            >
              {copiedField === 'address' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1.5 text-xs">
                {copiedField === 'address' ? t('common.actions.copied') : t('pricing.confirm.usdt.copyAddress')}
              </span>
            </Button>
          </div>
          {/* QR Code and Address */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-md bg-background border border-border">
            {/* QR Code */}
            <div className="shrink-0 p-2 bg-white rounded-lg">
              <QRCodeSVG
                value={receivingAddress}
                size={120}
                level="M"
                includeMargin={false}
              />
            </div>
            {/* Address and hint */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <code className="text-xs sm:text-sm font-mono break-all block">
                {receivingAddress}
              </code>
              <p className="text-xs text-muted-foreground">
                {t('pricing.confirm.usdt.scanQrCode')}
              </p>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('pricing.confirm.usdt.amount')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(exactAmount, 'amount')}
              className="h-8 px-2"
            >
              {copiedField === 'amount' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1.5 text-xs">
                {copiedField === 'amount' ? t('common.actions.copied') : t('pricing.confirm.usdt.copyAmount')}
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-md bg-background border border-border">
            <span className="text-xl sm:text-2xl font-bold font-mono">
              {displayAmount}
            </span>
            <span className="text-sm text-muted-foreground">USDT</span>
          </div>
        </div>

        {/* Exchange rate */}
        {exchangeRate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('pricing.confirm.usdt.exchangeRate')}
            </span>
            <span className="text-muted-foreground">
              1 USDT = CNY {exchangeRate.toFixed(2)}
            </span>
          </div>
        )}

        {/* Expiration countdown */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t('pricing.confirm.usdt.expiresIn')}
          </span>
          <span
            className={cn(
              'font-mono font-medium',
              isExpired ? 'text-destructive' : 'text-foreground'
            )}
          >
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Completed button */}
      {onCompleted && (
        <Button
          onClick={onCompleted}
          className="w-full"
          size="lg"
          disabled={isExpired}
        >
          {t('pricing.confirm.usdt.completed')}
        </Button>
      )}

      {/* Expired message */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('pricing.confirm.usdt.expired')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
