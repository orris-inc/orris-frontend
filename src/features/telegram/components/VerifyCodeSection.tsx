/**
 * Verify Code Section - Compact Style
 * Displays verification code and binding instructions
 */

import { Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface VerifyCodeSectionProps {
  verifyCode: string;
}

/**
 * Compact verification code display
 */
export const VerifyCodeSection = ({ verifyCode }: VerifyCodeSectionProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = verifyCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <p className="text-sm text-muted-foreground">
        打开{' '}
        <a
          href="https://t.me/OrrisBot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#26A5E4] hover:underline inline-flex items-center gap-0.5"
        >
          @OrrisBot
          <ExternalLink className="size-3" />
        </a>
        {' '}发送 <code className="px-1 py-0.5 rounded bg-muted text-xs">/bind</code> 后输入验证码
      </p>

      {/* Verify code */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-lg tracking-widest text-center select-all">
          {verifyCode}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className={cn(
            'shrink-0 h-10 w-10',
            copied && 'border-success text-success'
          )}
        >
          {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">验证码 10 分钟内有效</p>
    </div>
  );
};
