/**
 * 计划功能列表组件
 */

import { CheckCircle } from 'lucide-react';

interface PlanFeatureListProps {
  features: string[];
}

export const PlanFeatureList: React.FC<PlanFeatureListProps> = ({ features }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-2">
          <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
};
