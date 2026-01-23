/**
 * Source Badge Component
 * Displays the configuration source (database, environment, default)
 */

import { useTranslation } from 'react-i18next';
import { Database, Server, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfigSource } from '@/api/admin';

interface SourceBadgeProps {
  source: ConfigSource;
  className?: string;
}

const sourceConfig = {
  database: {
    icon: Database,
    bg: 'bg-info/10 text-info ring-info/20',
  },
  environment: {
    icon: Server,
    bg: 'bg-warning/10 text-warning ring-warning/20',
  },
  default: {
    icon: Settings2,
    bg: 'bg-muted text-muted-foreground ring-border',
  },
};

export const SourceBadge = ({ source, className }: SourceBadgeProps) => {
  const { t } = useTranslation();

  const { icon: Icon, bg } = sourceConfig[source];
  const label = t(`admin.settings.source.${source}`);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1',
        bg,
        className
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
};
