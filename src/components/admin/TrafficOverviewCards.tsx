/**
 * Traffic Overview Cards Component
 * Displays 4 statistics cards for traffic overview
 */

import { ArrowUp, ArrowDown, Activity, Users } from 'lucide-react';
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
    title: '总上传流量',
    getValue: (data) => formatTrafficBytes(data.totalUpload),
    icon: <ArrowUp className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: '总下载流量',
    getValue: (data) => formatTrafficBytes(data.totalDownload),
    icon: <ArrowDown className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: '总流量',
    getValue: (data) => formatTrafficBytes(data.totalTraffic),
    icon: <Activity className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    title: '活跃用户',
    getValue: (data) => data.activeUsers.toLocaleString(),
    icon: <Users className="size-4" strokeWidth={1.5} />,
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

export const TrafficOverviewCards = ({
  data,
  loading,
}: TrafficOverviewCardsProps) => {

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CARDS_CONFIG.map((card, index) => (
        <div
          key={index}
          className="group relative bg-white dark:bg-slate-900 rounded-lg p-3 sm:p-4 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className={`${card.iconBg} p-2 rounded-lg shrink-0`}>
              <div className={card.iconColor}>{card.icon}</div>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                {loading ? (
                  <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  data ? card.getValue(data) : '-'
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
