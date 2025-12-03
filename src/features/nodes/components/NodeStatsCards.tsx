/**
 * 节点统计卡片组件
 */

import type { LucideIcon } from 'lucide-react';
import { Server, CheckCircle, XCircle, Wrench, AlertCircle } from 'lucide-react';
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
    error: nodes.filter(n => n.status === 'error').length,
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
    {
      title: '错误',
      value: stats.error,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-14 h-14 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-10 h-10" />
                </div>
              </div>
              <h4 className={`text-3xl font-bold ${stat.color}`}>
                {loading ? '-' : stat.value}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
