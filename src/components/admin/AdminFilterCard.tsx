/**
 * 管理端筛选器卡片组件
 * 精致商务风格 - 统一的筛选器容器
 */

import { ReactNode } from 'react';
import { AdminCard } from './AdminCard';

interface AdminFilterCardProps {
  children: ReactNode;
}

/**
 * 筛选器容器卡片
 * 提供统一的筛选器展示样式
 */
export const AdminFilterCard = ({ children }: AdminFilterCardProps) => {
  return (
    <AdminCard>
      <div className="space-y-4">
        {children}
      </div>
    </AdminCard>
  );
};

interface FilterRowProps {
  children: ReactNode;
  columns?: number;
}

/**
 * 筛选器行布局
 */
export const FilterRow = ({ children, columns = 4 }: FilterRowProps) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
  };

  return (
    <div className={`grid gap-4 grid-cols-1 ${gridCols[columns as keyof typeof gridCols]}`}>
      {children}
    </div>
  );
};
