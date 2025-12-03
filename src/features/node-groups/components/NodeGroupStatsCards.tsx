/**
 * 节点组统计卡片组件
 */

import type { LucideIcon } from 'lucide-react';
import { Users, Globe, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import type { NodeGroup } from '@/api/node';

interface NodeGroupStatsCardsProps {
  nodeGroups: NodeGroup[];
  loading?: boolean;
}

interface StatsCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const NodeGroupStatsCards = ({ nodeGroups, loading = false }: NodeGroupStatsCardsProps) => {
  // 计算统计数据
  const stats = {
    total: nodeGroups.length,
    public: nodeGroups.filter((g) => g.isPublic).length,
    private: nodeGroups.filter((g) => !g.isPublic).length,
  };

  const cards: StatsCard[] = [
    {
      title: '总节点组数',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '公开节点组',
      value: stats.public,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '私有节点组',
      value: stats.private,
      icon: Lock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {card.title}
                  </p>
                  {loading ? (
                    <Skeleton className="w-[60px] h-[40px]" />
                  ) : (
                    <h4 className="text-3xl font-bold">
                      {card.value}
                    </h4>
                  )}
                </div>
                <div className={`flex items-center justify-center w-16 h-16 rounded-lg ${card.bgColor} ${card.color} opacity-80`}>
                  <Icon className="w-10 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
