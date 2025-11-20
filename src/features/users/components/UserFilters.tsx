/**
 * 用户筛选器组件
 */

import { FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserFilters as UserFiltersType, UserStatus, UserRole } from '../types/users.types';

interface UserFiltersComponentProps {
  filters: UserFiltersType;
  onChange: (filters: Partial<UserFiltersType>) => void;
}

export const UserFilters: React.FC<UserFiltersComponentProps> = ({ filters, onChange }) => {
  const handleStatusChange = (value: string) => {
    onChange({ status: value ? (value as UserStatus) : undefined });
  };

  const handleRoleChange = (value: string) => {
    onChange({ role: value ? (value as UserRole) : undefined });
  };

  const handleSearchChange = (value: string) => {
    onChange({ search: value });
  };

  const handleReset = () => {
    onChange({ status: undefined, role: undefined, search: '' });
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 状态筛选 */}
      <div className="space-y-2">
        <Label>状态</Label>
        <Select value={filters.status || ''} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="active">激活</SelectItem>
            <SelectItem value="inactive">未激活</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="suspended">暂停</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 角色筛选 */}
      <div className="space-y-2">
        <Label>角色</Label>
        <Select value={filters.role || ''} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="user">普通用户</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 关键词搜索 */}
      <div className="space-y-2">
        <Label>搜索</Label>
        <Input
          placeholder="邮箱或姓名"
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* 重置按钮 */}
      <div className="flex items-end">
        <Button variant="outline" onClick={handleReset} className="w-full">
          <FilterX className="mr-2 size-4" />
          重置
        </Button>
      </div>
    </div>
  );
};
