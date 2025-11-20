/**
 * 创建订阅计划对话框
 */

import { useState } from 'react';
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
import type { CreatePlanRequest, BillingCycle } from '../types/subscription-plans.types';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
}

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'semi_annual', label: '半年付' },
  { value: 'annual', label: '年付' },
  { value: 'lifetime', label: '终身' },
];

export const CreatePlanDialog: React.FC<CreatePlanDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreatePlanRequest>({
    name: '',
    slug: '',
    price: 0,
    currency: 'CNY',
    billing_cycle: 'monthly',
    description: '',
    features: [],
    is_public: true,
    trial_days: 0,
    max_users: undefined,
    max_projects: undefined,
    api_rate_limit: undefined,
    sort_order: 0,
  });

  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof CreatePlanRequest, value: any) => {
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
    setLoading(true);
    try {
      // 转换价格为分
      const submitData: CreatePlanRequest = {
        ...formData,
        price: Math.round(formData.price * 100), // 元转分
      };
      await onSubmit(submitData);
      onClose();
      // 重置表单
      setFormData({
        name: '',
        slug: '',
        price: 0,
        currency: 'CNY',
        billing_cycle: 'monthly',
        description: '',
        features: [],
        is_public: true,
        trial_days: 0,
        sort_order: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建订阅计划</DialogTitle>
          <DialogDescription>填写以下信息创建新的订阅计划</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本信息</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  计划名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug (URL标识) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">仅小写字母、数字和连字符</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">
                  价格（元）<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  货币 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.currency}
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

              <div className="space-y-2">
                <Label htmlFor="billing_cycle">
                  计费周期 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) => handleChange('billing_cycle', value)}
                >
                  <SelectTrigger id="billing_cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
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
            <h3 className="text-sm font-semibold">限制配置（可选）</h3>
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
            </div>
          </div>

          {/* 其他设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">其他设置</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trial_days">试用天数</Label>
                <Input
                  id="trial_days"
                  type="number"
                  min="0"
                  value={formData.trial_days || 0}
                  onChange={(e) => handleChange('trial_days', e.target.value === '' ? undefined : Number(e.target.value))}
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
                  checked={formData.is_public}
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
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.slug}
          >
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
