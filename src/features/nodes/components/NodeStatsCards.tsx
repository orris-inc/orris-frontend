/**
 * 节点统计卡片组件
 */

import type { LucideIcon } from 'lucide-react';
import { Server, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import type { Node } from '@/api/node';

interface NodeStatsCardsProps {
  nodes: Node[];
  loading?: boolean;
}

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const NodeStatsCards: React.FC<NodeStatsCardsProps> = ({ nodes, loading }) => {
  // 计算统计数据
  const stats = {
    total: nodes.length,
    active: nodes.filter(n => n.status === 'active').length,
    inactive: nodes.filter(n => n.status === 'inactive').length,
    maintenance: nodes.filter(n => n.status === 'maintenance').length,
  };

  const statCards: StatCard[] = [
    {
      title: '总节点数',
      value: stats.total,
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '激活',
      value: stats.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '未激活',
      value: stats.inactive,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: '维护中',
      value: stats.maintenance,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="flex items-center justify-center sm:justify-between mb-1 sm:mb-2">
                <div className={`size-8 sm:size-10 md:size-14 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                  <Icon className="size-5 sm:size-6 md:size-10" />
                </div>
              </div>
              <h4 className={`text-lg sm:text-2xl md:text-3xl font-bold ${stat.color} text-center sm:text-left`}>
                {loading ? '-' : stat.value}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 text-center sm:text-left truncate">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
