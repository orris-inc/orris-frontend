import { Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { getAlertClass, alertDescriptionStyles } from '@/lib/ui-styles';

interface VerifyCodeSectionProps {
  verifyCode: string;
}

/**
 * Component displaying verification code and binding instructions
 */
export const VerifyCodeSection = ({ verifyCode }: VerifyCodeSectionProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
    <div className="space-y-6">
      {/* Instructions */}
      <div className={getAlertClass('default')}>
        <MessageCircle className="size-4" />
        <div className={alertDescriptionStyles}>
          <ol className="list-decimal list-inside space-y-2">
            <li>打开 Telegram 搜索并关注 <strong>@OrrisBot</strong></li>
            <li>发送命令 <code className="bg-muted px-1.5 py-0.5 rounded text-sm">/bind</code></li>
            <li>按提示输入下方验证码完成绑定</li>
          </ol>
        </div>
      </div>

      {/* Verify code display */}
      <div className="space-y-2">
        <label className="text-sm font-medium">您的验证码</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-lg tracking-widest text-center select-all">
            {verifyCode}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={copied ? '已复制' : '复制验证码'}
          >
            {copied ? (
              <CheckCircle2 className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          验证码有效期为 10 分钟，过期后刷新页面获取新验证码
        </p>
      </div>
    </div>
  );
};
