/**
 * Payment method selector component
 * Card-based UI for selecting payment methods
 * Follows Tailwind Application UI patterns with mobile-first design
 */

import { useTranslation } from 'react-i18next';
import { CreditCard, Wallet, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/api/payment/types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  className?: string;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'stripe',
    icon: <CreditCard className="h-5 w-5" />,
    labelKey: 'pricing.confirm.paymentMethods.stripe',
    descriptionKey: 'pricing.confirm.paymentMethods.stripeDesc',
  },
  {
    id: 'alipay',
    icon: <AlipayIcon className="h-5 w-5" />,
    labelKey: 'pricing.confirm.paymentMethods.alipay',
    descriptionKey: 'pricing.confirm.paymentMethods.alipayDesc',
  },
  {
    id: 'wechat',
    icon: <WechatIcon className="h-5 w-5" />,
    labelKey: 'pricing.confirm.paymentMethods.wechat',
    descriptionKey: 'pricing.confirm.paymentMethods.wechatDesc',
  },
  {
    id: 'usdt_pol',
    icon: <Wallet className="h-5 w-5" />,
    labelKey: 'pricing.confirm.paymentMethods.usdtPol',
    descriptionKey: 'pricing.confirm.paymentMethods.usdtPolDesc',
  },
  {
    id: 'usdt_trc',
    icon: <Wallet className="h-5 w-5" />,
    labelKey: 'pricing.confirm.paymentMethods.usdtTrc',
    descriptionKey: 'pricing.confirm.paymentMethods.usdtTrcDesc',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn('space-y-2', className)}>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selectedMethod === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onMethodChange(method.id)}
            className={cn(
              'relative w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg border text-left transition-all',
              // Touch target
              'min-h-[56px]',
              // Hover & focus states
              'hover:border-primary/50 hover:bg-accent/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              // Active state
              'active:bg-accent/50',
              // Selected state
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {method.icon}
            </div>

            {/* Label and description */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium text-sm',
                isSelected && 'text-primary'
              )}>
                {t(method.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {t(method.descriptionKey)}
              </p>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shrink-0">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Custom icons for Alipay and WeChat
function AlipayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21.422 15.358c-1.389-.57-3.027-1.22-4.806-1.93.566-1.265.985-2.71 1.203-4.285h-4.363V7.705h5.08V6.548h-5.08V4.093h-2.155c-.23 0-.418.188-.418.418v2.037H5.68v1.157h5.203v1.438H6.32v1.159h8.29c-.17 1.04-.45 2.003-.827 2.866a37.143 37.143 0 0 0-4.903-1.527c-2.676-.621-4.878-.236-5.856 1.022-1.128 1.452-.882 3.678 1.229 4.91 1.313.767 2.94.912 4.555.492 1.897-.493 3.577-1.745 4.958-3.542 2.108.893 3.9 1.662 5.053 2.134 0 0 2.333-5.04 2.603-5.319zM6.58 18.24c-1.702.384-3.16-.122-3.616-1.065-.455-.944.034-2.118 1.652-2.463 1.22-.26 2.49-.046 3.727.453-1.012 1.746-2.14 2.644-3.763 3.075z" />
    </svg>
  );
}

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a5.79 5.79 0 0 1-.271-1.752c0-3.694 3.369-6.69 7.524-6.69.182 0 .364.013.545.028-.587-3.67-4.279-6.218-8.609-6.218zm-2.97 5.114a.96.96 0 0 1-.957-.96.96.96 0 0 1 .957-.958.96.96 0 0 1 .957.959.96.96 0 0 1-.957.959zm5.158 0a.96.96 0 0 1-.957-.96.96.96 0 0 1 .957-.958.96.96 0 0 1 .957.959.96.96 0 0 1-.957.959zM24 14.378c0-3.258-3.225-5.902-7.202-5.902-3.979 0-7.205 2.644-7.205 5.902 0 3.26 3.226 5.903 7.205 5.903.672 0 1.32-.079 1.937-.225a.694.694 0 0 1 .576.079l1.526.89a.262.262 0 0 0 .134.045.236.236 0 0 0 .233-.237c0-.058-.023-.115-.039-.171l-.312-1.186a.474.474 0 0 1 .171-.534C22.931 17.932 24 16.268 24 14.378zm-9.537-1.233a.77.77 0 0 1-.767-.768.77.77 0 0 1 .767-.77.77.77 0 0 1 .767.77.77.77 0 0 1-.767.768zm4.67 0a.77.77 0 0 1-.767-.768.77.77 0 0 1 .767-.77.77.77 0 0 1 .767.77.77.77 0 0 1-.767.768z" />
    </svg>
  );
}
