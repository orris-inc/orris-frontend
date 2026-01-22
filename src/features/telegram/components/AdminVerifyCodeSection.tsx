/**
 * Admin Verify Code Section
 * Displays verification code and binding instructions for admin
 * Uses Radix UI Tooltip for copy feedback
 */

import { Copy, Check, ExternalLink } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/common/Tooltip";
import { cn } from "@/lib/utils";

interface AdminVerifyCodeSectionProps {
  verifyCode: string;
  botLink?: string;
}

/**
 * Verification code display for admin binding
 */
export const AdminVerifyCodeSection = ({
  verifyCode,
  botLink,
}: AdminVerifyCodeSectionProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Copy command with verify code together
  const copyText = `/adminbind ${verifyCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = copyText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyText]);

  // Extract bot username from link
  const botUsername = botLink?.replace("https://t.me/", "@") || "@OrrisBot";

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <p className="text-sm text-muted-foreground">
        {t("telegramAdmin.verifyCode.instruction1")}
        {botLink ? (
          <a
            href={botLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[brand-telegram] hover:underline inline-flex items-center gap-0.5"
          >
            {botUsername}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-[brand-telegram]">{botUsername}</span>
        )}
        {t("telegramAdmin.verifyCode.instruction2")}
      </p>

      {/* Command with verify code */}
      <TooltipProvider>
        <Tooltip open={copied ? true : undefined} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "w-full group relative flex items-center justify-center gap-2",
                "px-4 py-3 rounded-lg border transition-all duration-200",
                "cursor-pointer select-none",
                copied
                  ? "bg-success/5 border-success/30"
                  : "bg-muted/50 border-transparent hover:bg-muted hover:border-border"
              )}
            >
              <span className="font-mono text-base text-muted-foreground">
                /adminbind
              </span>
              <span className="font-mono text-lg tracking-[0.2em] font-medium text-foreground">
                {verifyCode}
              </span>
              <span
                className={cn(
                  "absolute right-3 transition-all duration-200",
                  copied
                    ? "text-success"
                    : "text-muted-foreground/50 group-hover:text-muted-foreground"
                )}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {copied
              ? t("telegramAdmin.verifyCode.copied")
              : t("telegramAdmin.verifyCode.clickToCopy")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <p className="text-xs text-muted-foreground text-center">
        {t("telegramAdmin.verifyCode.codeExpiry")}
      </p>
    </div>
  );
};
