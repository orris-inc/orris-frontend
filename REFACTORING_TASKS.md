# Radix UI 重构任务分解

## 🎯 重构策略说明

### 直接使用 Radix UI（推荐策略）

本项目采用**直接使用 Radix UI 原生组件**的策略：

#### 1️⃣ 复杂组件 → 直接使用 Radix UI
- **适用**：Dialog, Select, DropdownMenu, Checkbox, Switch, Separator, Label, Tooltip 等
- **原理**：直接使用 `@radix-ui/react-*` 原生组件
- **优势**：零封装开销，性能最优，完全灵活

#### 2️⃣ 简单组件 → `ui-styles.ts` + 原生 HTML
- **适用**：Button, Input, Textarea, Badge, Alert, Card 等
- **原理**：原生 HTML 元素 + Tailwind CSS 样式工具
- **优势**：零依赖，易于定制

### 📋 快速参考

**导入示例：**
```tsx
// 复杂组件（方式 1）
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';

// 简单组件（方式 2）
import { getButtonClass, inputStyles, labelStyles } from '@/lib/ui-styles';

// 使用
<Dialog.Root>
  <Dialog.Portal>
    <Dialog.Overlay className="..." />
    <Dialog.Content className="...">
      <input className={inputStyles} />
      <Select.Root>...</Select.Root>
      <button className={getButtonClass('default')}>提交</button>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**参考已完成文件：**
- `src/pages/LoginPage.tsx` - Dialog, Checkbox, Label 完整示例
- `src/pages/RegisterPage.tsx` - Progress, Separator 示例
- `src/pages/UserManagementPage.tsx` - Select 完整示例

## 任务组 A：Users Feature 对话框组件（高优先级）
**依赖**: UserManagementPage 已完成
**预计时间**: 1-2 小时
**状态**: ✅ 完成

- [x] Task-A1: `src/features/users/components/CreateUserDialog.tsx` ✅
  - 替换 Dialog → `@radix-ui/react-dialog`
  - 替换 Button → 原生 `<button>`
  - 替换 Input, Label → 原生 + Radix Label

- [x] Task-A2: `src/features/users/components/EditUserDialog.tsx` ✅
  - 替换 Dialog → `@radix-ui/react-dialog`
  - 替换 Select → SimpleSelect helper
  - 替换 Button, Input, Label → 原生 HTML

- [ ] Task-A3: `src/features/users/components/UserListTable.tsx`
  - 检查当前使用的 UI 组件
  - 替换 Table, Badge, Button, DropdownMenu 等

## 任务组 B：Subscriptions Feature 组件（高优先级）
**依赖**: UserManagementPage 已完成
**预计时间**: 1 小时
**状态**: ✅ 完成

- [x] Task-B1: `src/features/subscriptions/components/AssignSubscriptionDialog.tsx` ✅
  - 替换 Dialog → `@radix-ui/react-dialog`
  - 替换 Select, Checkbox, Alert → Radix UI
  - 替换 Button → 原生

## 任务组 C：Profile Feature 补充组件（中优先级）
**依赖**: ProfileDialog 已完成
**预计时间**: 1-2 小时
**状态**: ✅ 完成 (3/3 完成)

- [x] Task-C1: `src/features/profile/components/ChangePasswordForm.tsx` ✅
  - 替换 Input, Label, Button → 原生 HTML

- [x] Task-C2: `src/features/profile/components/AvatarUpload.tsx` ✅
  - 替换 Button, Dialog → Radix + 原生

- [x] Task-C3: `src/features/profile/components/AvatarCropDialog.tsx` ✅
  - 替换 Dialog, Button, Slider → Radix UI

## 任务组 D：认证页面（高优先级）
**依赖**: 无
**预计时间**: 2-3 小时
**状态**: ✅ 完成 (6/6 完成)

- [x] Task-D1: `src/pages/LoginPage.tsx` ✅
  - 替换 Input, Label, Button, Alert, Checkbox, Separator

- [x] Task-D2: `src/pages/RegisterPage.tsx` ✅
  - 替换 Input, Label, Button, Card, Alert, Progress, Separator

- [x] Task-D3: `src/pages/ForgotPasswordPage.tsx` ✅
  - 替换 Input, Label, Button, Card, Alert

- [x] Task-D4: `src/pages/ResetPasswordPage.tsx` ✅
  - 替换 Input, Label, Button, Card, Alert

- [x] Task-D5: `src/pages/EmailVerificationPage.tsx` ✅
  - 替换 Button, Card, Alert

- [x] Task-D6: `src/pages/VerificationPendingPage.tsx` ✅
  - 替换 Input, Label, Button, Card, Alert

## 任务组 E：主要页面（中优先级）
**依赖**: DashboardLayout 已完成
**预计时间**: 2-3 小时
**状态**: ✅ 完成 (3/3 完成)

- [x] Task-E1: `src/pages/DashboardPage.tsx` ✅
  - 替换 Alert, Card

- [x] Task-E2: `src/pages/HomePage.tsx` ✅
  - 替换 Button, Card, Avatar, Badge

- [x] Task-E3: `src/pages/ProfileSettingsPage.tsx` ✅
  - 替换 Card, Alert, Separator

## 任务组 F：管理页面（中优先级）
**依赖**: AdminLayout 已完成
**预计时间**: 3-4 小时

- [ ] Task-F1: `src/pages/NodeManagementPage.tsx`
  - 替换 Button, Card, Tooltip, Dialog, Textarea

- [ ] Task-F2: `src/pages/NodeGroupManagementPage.tsx`
  - 替换 Button, Card, Tooltip

- [ ] Task-F3: `src/pages/SubscriptionManagementPage.tsx`
  - 替换 Table, Card

- [ ] Task-F4: `src/pages/SubscriptionPlansManagementPage.tsx`
  - 替换 Button, Card

## 任务组 G：Dashboard 组件（低优先级）
**依赖**: DashboardPage
**预计时间**: 1-2 小时

- [ ] Task-G1: `src/components/dashboard/QuickLinks.tsx`
- [ ] Task-G2: `src/components/dashboard/UserProfileCard.tsx`
- [ ] Task-G3: `src/components/dashboard/SubscriptionCard.tsx`

## 任务组 H：Subscription Plans Feature（低优先级）
**依赖**: SubscriptionPlansManagementPage
**预计时间**: 2-3 小时

- [ ] Task-H1: `src/features/subscription-plans/components/BillingCycleBadge.tsx`
- [ ] Task-H2: `src/features/subscription-plans/components/PlanCard.tsx`
- [ ] Task-H3: `src/features/subscription-plans/components/PlanPricingSelector.tsx`
- [ ] Task-H4: `src/features/subscription-plans/components/ManagePlanNodeGroupsDialog.tsx`

## 并行处理策略

### 批次 1（立即开始）
同时处理：
- Task-A1, A2, A3 (Users Feature)
- Task-B1 (Subscriptions)

### 批次 2
同时处理：
- Task-D1, D2, D3, D4, D5, D6 (所有认证页面)

### 批次 3
同时处理：
- Task-E1, E2, E3 (主要页面)
- Task-C1, C2, C3 (Profile 组件)

### 批次 4
同时处理：
- Task-F1, F2, F3, F4 (管理页面)

### 批次 5（最后）
同时处理：
- Task-G1, G2, G3 (Dashboard 组件)
- Task-H1, H2, H3, H4 (Subscription Plans)

## 执行顺序（优先级）

1. ⚡ **批次 1** - Users + Subscriptions（关键功能）
2. ⚡ **批次 2** - 认证页面（用户入口）
3. 🔥 **批次 3** - 主要页面 + Profile
4. 📊 **批次 4** - 管理页面
5. 🎨 **批次 5** - 辅助组件

## 成功标准

每个任务完成后必须满足：

### ✅ 代码质量
- ✅ **不再导入** `@/components/ui/*`
- ✅ **正确使用架构策略**：
  - 复杂组件 → 直接使用 `@radix-ui/react-*`
  - 简单组件 → 使用 `ui-styles.ts` + 原生 HTML
- ✅ **样式一致性**：
  - 参考 LoginPage、RegisterPage 等已完成文件的样式
  - 从已完成文件中复制 Radix 组件的样式类名
  - 保持与已重构页面的视觉一致性
- ✅ **代码风格**：
  - 导入顺序：React → 第三方库 → Radix UI → ui-styles → 本地组件
  - 组件结构清晰，易于维护

### ✅ 功能验证
- ✅ **功能正常**（需要手动测试）：
  - 表单提交正常
  - 对话框打开/关闭正常
  - 下拉选择器工作正常
  - 所有交互按预期工作
- ✅ **无控制台错误**
- ✅ **响应式布局正常**（移动端/桌面端）

### ✅ 样式参考
- ✅ 从已完成文件中复制样式：
  - Dialog 样式 → 参考 `LoginPage.tsx`
  - Select 样式 → 参考 `UserManagementPage.tsx`
  - Checkbox 样式 → 参考 `LoginPage.tsx`
  - Progress 样式 → 参考 `RegisterPage.tsx`
- ✅ 保持 Tailwind 类名一致性

### 📋 重构检查清单
重构每个文件时，请按以下步骤操作：

1. **分析组件**：列出所有使用的 UI 组件
2. **选择策略**：
   - 复杂组件 → 直接使用 Radix UI
   - 简单组件 → 使用 ui-styles.ts
3. **更新导入**：
   - 复杂组件：`import * as Dialog from '@radix-ui/react-dialog'`
   - 简单组件：`import { getButtonClass } from '@/lib/ui-styles'`
4. **复制样式**：从已完成文件中复制相应的 Radix 组件样式
5. **更新代码**：替换组件使用方式
6. **测试功能**：确保所有功能正常
7. **代码审查**：检查代码风格和一致性
