# Subscription Plans API 更新说明

**更新日期**: 2025-11-10
**版本**: v1.1
**状态**: ✅ 已完成并测试

---

## 📋 更新摘要

后端 `/subscription-plans` 相关接口已更新，前端已同步更新以支持新功能。主要变更包括：

1. **新增接口**: `GET /subscription-plans/{id}/pricings`
2. **响应数据增强**: `SubscriptionPlan` 对象新增 `pricings` 字段
3. **多定价支持**: 一个计划现在可以有多个计费周期的定价选项

---

## 🆕 新增功能

### 1. 新增 API 端点

#### `GET /subscription-plans/{id}/pricings`

**描述**: 获取指定计划的所有定价选项

**认证**: 无需认证（公开访问）

**请求示例**:
```bash
curl http://localhost:8081/subscription-plans/1/pricings
```

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "billing_cycle": "monthly",
      "price": 2900,
      "currency": "CNY",
      "is_active": true
    },
    {
      "billing_cycle": "annual",
      "price": 29900,
      "currency": "CNY",
      "is_active": true
    }
  ]
}
```

---

### 2. 响应数据增强

`SubscriptionPlan` 对象新增 `pricings` 字段：

```typescript
interface SubscriptionPlan {
  // ... 原有字段保持不变
  Price: number;                    // 主要价格（向后兼容）
  Currency: string;
  BillingCycle: BillingCycle;

  // 新增字段
  pricings?: PlanPricing[];         // 多定价选项支持
}

interface PlanPricing {
  billing_cycle: BillingCycle;      // 计费周期
  price: number;                    // 价格（分）
  currency: string;                 // 货币代码
  is_active: boolean;               // 是否激活
}
```

---

## 🔄 前端更新内容

### 1. 类型定义更新

**文件**: `src/features/subscription-plans/types/subscription-plans.types.ts`

- ✅ 新增 `PlanPricing` 接口
- ✅ 更新 `SubscriptionPlan` 接口，添加 `pricings?` 字段

### 2. API 调用层更新

**文件**: `src/features/subscription-plans/api/subscription-plans-api.ts`

- ✅ 新增 `getPlanPricings(id: number)` 函数

```typescript
export const getPlanPricings = async (id: number): Promise<PlanPricing[]> => {
  const response = await apiClient.get<APIResponse<PlanPricing[]>>(
    `/subscription-plans/${id}/pricings`
  );
  return response.data.data;
};
```

### 3. 状态管理更新

**文件**: `src/features/subscription-plans/stores/subscription-plans-store.ts`

- ✅ 新增 `planPricings` 状态（带缓存）
- ✅ 新增 `fetchPlanPricings(id)` 方法

### 4. UI 组件更新

#### 新增组件

**文件**: `src/features/subscription-plans/components/PlanPricingSelector.tsx`

新组件用于显示和选择计划的多种定价选项：

```typescript
<PlanPricingSelector
  pricings={plan.pricings}
  defaultBillingCycle="monthly"
  onPricingChange={(pricing) => console.log(pricing)}
/>
```

**功能**:
- 显示所有激活的定价选项
- 切换计费周期（月付/季付/年付/终身）
- 自动格式化价格显示
- 单定价时自动简化显示

#### 更新组件

**文件**: `src/features/subscription-plans/components/PlanCard.tsx`

- ✅ 集成 `PlanPricingSelector` 组件
- ✅ 自动检测 `pricings` 字段
- ✅ 向后兼容旧的单一价格模式

**兼容性处理**:
```typescript
// 有 pricings 字段时使用新组件
{hasPricings ? (
  <PlanPricingSelector pricings={plan.pricings!} />
) : (
  // 向后兼容：使用单一价格显示
  <Typography>{formattedPrice}</Typography>
)}
```

---

## 📊 API 接口清单（更新后）

| 方法 | 路径 | 描述 | 认证 | 状态 |
|------|------|------|------|------|
| GET | `/subscription-plans` | 获取计划列表（分页+筛选） | ✅ Bearer | ✅ 已实现 |
| GET | `/subscription-plans/public` | 获取公开计划 | ❌ 无需 | ✅ 已实现 |
| GET | `/subscription-plans/{id}` | 获取计划详情 | ✅ Bearer | ✅ 已实现 |
| POST | `/subscription-plans` | 创建计划 | ✅ Bearer | ✅ 已实现 |
| PUT | `/subscription-plans/{id}` | 更新计划 | ✅ Bearer | ✅ 已实现 |
| POST | `/subscription-plans/{id}/activate` | 激活计划 | ✅ Bearer | ✅ 已实现 |
| POST | `/subscription-plans/{id}/deactivate` | 停用计划 | ✅ Bearer | ✅ 已实现 |
| GET | `/subscription-plans/{id}/pricings` | 获取定价选项 | ❌ 无需 | 🆕 新增 |

---

## ✅ 测试验证

### 自动化测试结果

```bash
🧪 测试 Subscription Plans API 更新

1️⃣  GET /subscription-plans/public
   ✅ 成功获取公开计划
   ✅ 包含 pricings 字段
   ✅ 定价选项数量正确

2️⃣  GET /subscription-plans/{id}/pricings
   ✅ 成功获取定价选项
   ✅ 返回格式正确

3️⃣  数据结构兼容性
   ✅ 原有字段完整（向后兼容）
   ✅ pricings 字段结构正确

🎉 所有测试通过！
```

### 构建验证

```bash
npm run build
✅ TypeScript 编译通过
✅ Vite 构建成功
✅ 无类型错误
```

---

## 🔄 向后兼容性

**✅ 完全向后兼容**

- 原有字段 `Price`, `Currency`, `BillingCycle` 保持不变
- `pricings` 字段为可选 (`optional`)
- 现有代码无需修改即可继续工作
- UI 组件自动检测并适配新旧格式

---

## 📝 使用示例

### 示例 1: 获取公开计划（自动包含定价）

```typescript
import { usePublicPlans } from '@/features/subscription-plans/hooks/usePublicPlans';

function PricingPage() {
  const { plans, loading } = usePublicPlans();

  return (
    <div>
      {plans.map(plan => (
        <PlanCard
          key={plan.ID}
          plan={plan}  // pricings 会自动显示
        />
      ))}
    </div>
  );
}
```

### 示例 2: 手动获取定价选项

```typescript
import { getPlanPricings } from '@/features/subscription-plans/api/subscription-plans-api';

async function loadPricings(planId: number) {
  const pricings = await getPlanPricings(planId);

  pricings.forEach(pricing => {
    console.log(`${pricing.billing_cycle}: ¥${pricing.price / 100}`);
  });
}
```

### 示例 3: 使用 Store 缓存

```typescript
import { useSubscriptionPlansStore } from '@/features/subscription-plans/stores/subscription-plans-store';

function MyComponent() {
  const fetchPlanPricings = useSubscriptionPlansStore(state => state.fetchPlanPricings);

  const loadPricings = async (planId: number) => {
    // 自动缓存，重复调用不会重复请求
    const pricings = await fetchPlanPricings(planId);
    console.log(pricings);
  };
}
```

---

## 🚀 下一步计划

### 建议的功能增强

1. **价格对比功能** - 在定价页面并排对比不同计费周期的折扣
2. **优惠提示** - 年付相比月付的节省金额显示
3. **动态定价** - 支持后台动态调整不同地区的价格
4. **批量定价管理** - 管理端批量设置多个计费周期

---

## 📚 相关文档

- [订阅计划实现文档](./SUBSCRIPTION_PLANS_IMPLEMENTATION.md)
- [项目快速启动指南](./QUICK_START_GUIDE.md)
- [后端 Swagger 文档](http://localhost:8081/swagger/index.html)

---

## 👥 更新记录

| 日期 | 版本 | 更新者 | 说明 |
|------|------|--------|------|
| 2025-11-10 | v1.1 | Claude Code | 新增 pricings 接口和多定价支持 |
| 2025-11-10 | v1.0 | - | 初始版本 |

---

**更新完成** ✅ 前端已完全同步后端 API 更新，所有功能已测试通过。
