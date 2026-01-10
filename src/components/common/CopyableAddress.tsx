/**
 * CopyableAddress Component
 * Displays an address with truncation and copy functionality
 */
import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils';

export interface CopyableAddressProps {
  /** The address to display */
  address: string;
  /** Additional CSS classes */
  className?: string;
  /** Maximum length before truncation */
  maxLength?: number;
  /** Number of characters to show at start */
  startChars?: number;
  /** Number of characters to show at end */
  endChars?: number;
  /** Whether to show tooltip on truncation */
  showTooltip?: boolean;
  /** Copy button title */
  copyTitle?: string;
}

export const CopyableAddress: React.FC<CopyableAddressProps> = ({
  address,
  className = '',
  maxLength = 20,
  startChars = 8,
  endChars = 6,
  showTooltip = true,
  copyTitle = '复制地址',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (address && address !== '-') {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  if (!address || address === '-') {
    return <span className={cn('text-muted-foreground', className)}>-</span>;
  }

  const needsTruncate = address.length > maxLength;
  const displayAddress = needsTruncate
    ? `${address.slice(0, startChars)}...${address.slice(-endChars)}`
    : address;

  const content = (
    <span className={cn('inline-flex items-center gap-1 group', className)}>
      <span className="font-mono text-xs truncate">{displayAddress}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
        title={copied ? '已复制' : copyTitle}
      >
        {copied ? (
          <Check className="size-3 text-green-500" />
        ) : (
          <Copy className="size-3 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    </span>
  );

  if (showTooltip && needsTruncate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="font-mono text-xs max-w-xs break-all">
          {address}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

/**
 * CopyableAddressRow Component
 * Variant for table rows with label
 */
export interface CopyableAddressRowProps extends CopyableAddressProps {
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'top';
}

export const CopyableAddressRow: React.FC<CopyableAddressRowProps> = ({
  label,
  labelPosition = 'left',
  ...props
}) => {
  if (!label) {
    return <CopyableAddress {...props} />;
  }

  if (labelPosition === 'top') {
    return (
      <div className="space-y-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <CopyableAddress {...props} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}:</span>
      <CopyableAddress {...props} />
    </div>
  );
};
