/**
 * 编辑订阅计划对话框
 */

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubscriptionPlan, UpdatePlanRequest } from '../types/subscription-plans.types';

interface EditPlanDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdatePlanRequest) => Promise<void>;
}

export const EditPlanDialog: React.FC<EditPlanDialogProps> = ({
  open,
  plan,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdatePlanRequest>({});
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  // 当plan变化时，更新表单数据
  useEffect(() => {
    if (plan) {
      setFormData({
        price: plan.Price,
        currency: plan.Currency,
        description: plan.Description,
        features: plan.Features || [],
        is_public: plan.IsPublic,
        max_users: plan.MaxUsers,
        max_projects: plan.MaxProjects,
        api_rate_limit: plan.APIRateLimit,
        sort_order: plan.SortOrder,
      });
    }
  }, [plan]);

  const handleChange = (field: keyof UpdatePlanRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // 价格已经在 onChange 中转换为分（第170行），这里直接使用即可
      const submitData: UpdatePlanRequest = {
        ...formData,
        // formData.price 已经是分单位，无需再转换
        price: formData.price,
      };
      await onSubmit(plan.ID, submitData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑订阅计划: {plan.Name}</DialogTitle>
          <DialogDescription>修改订阅计划的配置信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息（只读） */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本信息（只读）</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>计划名称</Label>
                <Input value={plan.Name} disabled />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={plan.Slug} disabled />
              </div>

              <div className="space-y-2">
                <Label>计费周期</Label>
                <Input value={plan.BillingCycle} disabled />
              </div>
            </div>
          </div>

          {/* 可编辑字段 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">可编辑信息</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">价格（元）</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price !== undefined ? formData.price / 100 : ''}
                  onChange={(e) => handleChange('price', Number(e.target.value) * 100)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">货币</Label>
                <Select
                  value={formData.currency || plan.Currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">CNY (人民币)</SelectItem>
                    <SelectItem value="USD">USD (美元)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 功能列表 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">功能列表</h3>
            <div className="flex gap-2">
              <Input
                placeholder="添加功能"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
              />
              <Button type="button" onClick={handleAddFeature}>
                <Plus className="size-4" />
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.features?.map((feature, index) => (
                <Badge key={index} variant="secondary">
                  {feature}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* 限制配置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">限制配置</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max_users">最大用户数</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="0"
                  value={formData.max_users || ''}
                  onChange={(e) => handleChange('max_users', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_projects">最大项目数</Label>
                <Input
                  id="max_projects"
                  type="number"
                  min="0"
                  value={formData.max_projects || ''}
                  onChange={(e) => handleChange('max_projects', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_rate_limit">API速率限制（次/小时）</Label>
                <Input
                  id="api_rate_limit"
                  type="number"
                  min="0"
                  value={formData.api_rate_limit || ''}
                  onChange={(e) => handleChange('api_rate_limit', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">排序顺序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => handleChange('sort_order', e.target.value === '' ? undefined : Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">数字越小越靠前</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={formData.is_public ?? plan.IsPublic}
                  onCheckedChange={(checked) => handleChange('is_public', checked)}
                />
                <Label htmlFor="is_public" className="cursor-pointer">
                  公开显示此计划
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
