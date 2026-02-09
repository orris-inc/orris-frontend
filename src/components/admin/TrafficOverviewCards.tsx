/**
 * Traffic Overview Cards Component
 * Displays 4 statistics cards for traffic overview
 */

import { ArrowUp, ArrowDown, Activity, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TrafficOverview, formatTrafficBytes } from '@/api/admin';

interface TrafficOverviewCardsProps {
  data: TrafficOverview | null;
  loading: boolean;
}

interface CardConfig {
  title: string;
  getValue: (data: TrafficOverview) => string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const CARDS_CONFIG: readonly CardConfig[] = [
  {
    title: 'admin.stats.totalUpload',
    getValue: (data) => formatTrafficBytes(data.totalUpload),
    icon: <ArrowUp className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
  },
  {
    title: 'admin.stats.totalDownload',
    getValue: (data) => formatTrafficBytes(data.totalDownload),
    icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    title: 'admin.stats.totalTraffic',
    getValue: (data) => formatTrafficBytes(data.totalTraffic),
    icon: <Activity className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-relay/10',
    iconColor: 'text-relay',
  },
  {
    title: 'admin.stats.activeUsers',
    getValue: (data) => data.activeUsers.toLocaleString(),
    icon: <Users className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
];

export const TrafficOverviewCards = ({
  data,
  loading,
}: TrafficOverviewCardsProps) => {
  const { t } = useTranslation();

  return (
    <div className="@container grid grid-cols-2 @sm:grid-cols-4 gap-3">
      {CARDS_CONFIG.map((card, index) => (
        <div
          key={index}
          className="group relative bg-card rounded-lg p-3 @sm:p-4 border border-border hover:border-border/80 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className={`${card.iconBg} p-2 rounded-lg shrink-0`}>
              <div className={card.iconColor}>{card.icon}</div>
            </div>
            <div className="min-w-0">
              <div className="text-lg @sm:text-xl font-semibold text-foreground whitespace-nowrap">
                {loading ? (
                  <div className="h-5 w-12 bg-muted rounded animate-pulse motion-reduce:animate-none" />
                ) : (
                  data ? card.getValue(data) : '-'
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {t(card.title)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
