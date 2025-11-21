# Radix UI 重构指南

本项目正在从 shadcn/ui 迁移到使用 Radix UI。以下是重构指南。

## 🎯 架构策略说明

### ⭐ 推荐方案：混合策略（最佳实践）

本项目采用**混合策略**，在维护性、性能和灵活性之间取得最佳平衡：

#### 方式 1️⃣：使用薄封装组件 **（推荐，用于复杂组件）**
- **适用于**：Dialog, Select, DropdownMenu, Checkbox, Switch, Tabs, Avatar, Progress 等
- **原理**：使用 `@/components/common/*` 薄封装组件
- **优点**：
  - ✅ 减少代码重复，提高维护性
  - ✅ 保证样式一致性
  - ✅ 开发效率高
  - ✅ 仍可通过 className 覆盖样式
  - ✅ 性能损耗几乎为零
- **示例**：
  ```tsx
  import { Dialog, DialogContent, DialogTitle } from '@/components/common/Dialog';
  import { Select, SelectContent, SelectItem } from '@/components/common/Select';
  import { Checkbox } from '@/components/common/Checkbox';

  // Dialog - 只需 3 行代码
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
      <DialogTitle>标题</DialogTitle>
      {/* 内容 */}
    </DialogContent>
  </Dialog>

  // 仍可自定义样式
  <DialogContent className="max-w-3xl">
    {/* 覆盖默认宽度 */}
  </DialogContent>
  ```

#### 方式 2️⃣：使用 `ui-styles.ts` + 原生 HTML **（推荐，用于简单组件）**
- **适用于**：Button, Input, Textarea, Badge, Alert, Card 等
- **原理**：直接使用原生 HTML 元素 + Tailwind CSS 工具函数
- **优点**：零依赖，性能最优，易于定制
- **示例**：
  ```tsx
  import { getButtonClass, inputStyles } from '@/lib/ui-styles';

  <button className={getButtonClass('default')}>提交</button>
  <input className={inputStyles} />
  ```

#### 方式 3️⃣：直接使用 Radix UI **（特殊场景）**
- **适用于**：需要特殊定制的场景
- **原理**：直接使用 `@radix-ui/react-*` 原生组件
- **优点**：完全灵活，可深度定制
- **示例**：
  ```tsx
  import * as Dialog from '@radix-ui/react-dialog';

  // 完全自定义的 Dialog
  <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Portal>
      <Dialog.Overlay className="..." />
      <Dialog.Content className="...">
        {/* 特殊定制 */}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
  ```

## 已完成的文件

### 核心布局和导航
- ✅ `src/layouts/AdminLayout.tsx`
- ✅ `src/layouts/DashboardLayout.tsx`
- ✅ `src/components/navigation/MobileDrawer.tsx`
- ✅ `src/components/navigation/DesktopNav.tsx`
- ✅ `src/components/navigation/EnhancedBreadcrumbs.tsx`
- ✅ `src/shared/components/ProtectedRoute.tsx`
- ✅ `src/shared/components/AdminRoute.tsx`

### Profile 相关
- ✅ `src/features/profile/components/ProfileDialog.tsx`
- ✅ `src/features/profile/components/SecurityTab.tsx`
- ✅ `src/features/profile/components/BasicInfoTab.tsx`
- ✅ `src/features/profile/components/ChangePasswordForm.tsx`

### 页面
- ✅ `src/pages/UserManagementPage.tsx`

### 工具
- ✅ `src/lib/ui-styles.ts` - 通用样式工具

### 薄封装组件 ✨ NEW
- ✅ `src/components/common/Dialog.tsx` - Dialog 薄封装
- ✅ `src/components/common/Select.tsx` - Select 薄封装
- ✅ `src/components/common/DropdownMenu.tsx` - DropdownMenu 薄封装
- ✅ `src/components/common/Checkbox.tsx` - Checkbox 薄封装
- ✅ `src/components/common/Switch.tsx` - Switch 薄封装
- ✅ `src/components/common/Tabs.tsx` - Tabs 薄封装
- ✅ `src/components/common/Label.tsx` - Label 薄封装
- ✅ `src/components/common/Separator.tsx` - Separator 薄封装
- ✅ `src/components/common/Avatar.tsx` - Avatar 薄封装
- ✅ `src/components/common/Progress.tsx` - Progress 薄封装

## 组件替换映射表

### 方式 1️⃣：使用薄封装组件 **（推荐，首选）**

适用于**所有复杂交互组件**，优先使用此方式：

| shadcn/ui | 薄封装组件 | 导入方式 | 优点 |
|-----------|----------|----------|------|
| Dialog | Dialog | `import { Dialog, DialogContent } from '@/components/common/Dialog'` | 减少重复代码 |
| Select | Select | `import { Select, SelectContent, SelectItem } from '@/components/common/Select'` | 样式一致性 |
| DropdownMenu | DropdownMenu | `import { DropdownMenu, DropdownMenuContent } from '@/components/common/DropdownMenu'` | 易于维护 |
| Checkbox | Checkbox | `import { Checkbox } from '@/components/common/Checkbox'` | 开发效率高 |
| Switch | Switch | `import { Switch, SwitchThumb } from '@/components/common/Switch'` | 可覆盖样式 |
| Tabs | Tabs | `import { Tabs, TabsList, TabsTrigger } from '@/components/common/Tabs'` | 零学习成本 |
| Label | Label | `import { Label } from '@/components/common/Label'` | 使用简单 |
| Separator | Separator | `import { Separator } from '@/components/common/Separator'` | 自动处理方向 |
| Avatar | Avatar | `import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/Avatar'` | 完整封装 |
| Progress | Progress | `import { Progress } from '@/components/common/Progress'` | 易用性好 |

### 方式 2️⃣：使用 `ui-styles.ts` + 原生 HTML **（推荐，用于简单组件）**

适用于**所有简单表单元素和展示组件**：

| shadcn/ui | 替换方案 | 样式从 ui-styles.ts 导入 |
|-----------|----------|--------------------------|
| Button | `<button>` | `getButtonClass(variant, size)` |
| Input | `<input>` | `inputStyles` |
| Textarea | `<textarea>` | `textareaStyles` |
| Badge | `<span>` | `getBadgeClass(variant)` |
| Alert | `<div>` | `getAlertClass(variant)` + `alertTitleStyles` + `alertDescriptionStyles` |
| Card | `<div>` | `cardStyles` + `cardHeaderStyles` + `cardContentStyles` 等 |
| Table | `<table>` | `tableStyles` + `tableHeaderStyles` + `tableBodyStyles` 等 |

### 方式 3️⃣：直接使用 Radix UI 原生组件 **（特殊场景）**

仅用于需要特殊定制的场景：

| shadcn/ui | Radix UI | 导入方式 | 何时使用 |
|-----------|----------|----------|---------|
| Dialog | Dialog | `import * as Dialog from '@radix-ui/react-dialog'` | 需要完全自定义样式 |
| Select | Select | `import * as Select from '@radix-ui/react-select'` | 特殊交互需求 |
| 其他组件 | ... | `import * as Component from '@radix-ui/react-*'` | 薄封装不满足需求时 |

## 重构步骤

### 1. 更新导入

**Before (shadcn/ui):**
```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
```

**After（推荐 - 使用薄封装 + ui-styles）:**
```tsx
// 复杂组件：使用薄封装
import { Dialog, DialogContent, DialogTitle } from '@/components/common/Dialog';
import { Select, SelectContent, SelectItem } from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';

// 简单组件：使用 ui-styles
import { getButtonClass, inputStyles } from '@/lib/ui-styles';
```

### 2. 替换 Dialog 组件（使用薄封装 - 推荐）

**Before (shadcn):**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
  </DialogContent>
</Dialog>
```

**After（推荐 - 使用薄封装）:**
```tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/common/Dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>标题</DialogTitle>
    <DialogDescription>描述</DialogDescription>
    {/* 内容 */}
  </DialogContent>
</Dialog>

// 可以覆盖默认样式
<DialogContent className="max-w-3xl">
  {/* 自定义宽度 */}
</DialogContent>
```

**优点：**
- ✅ 代码量减少 70%（从 ~15 行到 ~5 行）
- ✅ 样式自动一致
- ✅ 仍可自定义样式

### 3. 替换 Button 组件（方式 2️⃣：使用 ui-styles）

**Before:**
```tsx
<Button variant="default" size="lg" onClick={handler}>
  Click me
</Button>
```

**After:**
```tsx
<button
  onClick={handler}
  className={getButtonClass('default', 'lg')}
>
  Click me
</button>
```

### 4. 替换 Select 组件（使用薄封装 - 推荐）

**Before (shadcn):**
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">选项 1</SelectItem>
    <SelectItem value="2">选项 2</SelectItem>
  </SelectContent>
</Select>
```

**After（推荐 - 使用薄封装）:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">选项 1</SelectItem>
    <SelectItem value="2">选项 2</SelectItem>
  </SelectContent>
</Select>
```

**优点：**
- ✅ 用法几乎不变，零学习成本
- ✅ 自动包含 Check 图标和 ChevronDown 图标
- ✅ 样式完全一致

### 5. 替换 Card 组件（使用 ui-styles）

**Before (shadcn):**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

**After (使用 ui-styles):**
```tsx
import { cardStyles, cardHeaderStyles, cardTitleStyles, cardDescriptionStyles, cardContentStyles, cardFooterStyles } from '@/lib/ui-styles';

<div className={cardStyles}>
  <div className={cardHeaderStyles}>
    <h3 className={cardTitleStyles}>标题</h3>
    <p className={cardDescriptionStyles}>描述</p>
  </div>
  <div className={cardContentStyles}>内容</div>
  <div className={cardFooterStyles}>底部</div>
</div>
```

**说明：** 使用原生 div 元素 + Tailwind 样式常量。

## 待重构文件清单

### 高优先级 - 页面组件
- [ ] `src/pages/LoginPage.tsx`
- [ ] `src/pages/RegisterPage.tsx`  
- [ ] `src/pages/DashboardPage.tsx`
- [ ] `src/pages/HomePage.tsx`

### 中优先级 - Features 组件
- [ ] `src/features/users/components/CreateUserDialog.tsx`
- [ ] `src/features/users/components/EditUserDialog.tsx`
- [ ] `src/features/users/components/UserListTable.tsx`
- [ ] `src/features/subscriptions/components/AssignSubscriptionDialog.tsx`
- [ ] `src/features/profile/components/AvatarUpload.tsx`

### 低优先级 - 其他组件
- [ ] 其余页面和 feature 组件

## 注意事项

1. **优先使用薄封装组件** ⭐
   - 复杂组件（Dialog, Select, Checkbox 等）→ 优先使用 `@/components/common/*`
   - 减少代码重复，提高维护性
   - 仍可通过 className 覆盖样式

2. **使用 ui-styles 工具**：
   - 简单组件（Button, Input 等）→ 使用 `ui-styles.ts` 工具函数
   - 保持样式一致性

3. **何时直接使用 Radix UI**：
   - 仅当薄封装组件不满足需求时
   - 需要完全自定义样式和行为时
   - 特殊交互场景

4. **样式一致性**：
   - 所有薄封装组件已包含统一样式
   - 需要自定义时使用 className prop

5. **测试功能**：重构后确保功能正常

6. **渐进式迁移**：一次重构一个文件，避免大范围破坏

## 技巧

1. **批量替换导入**：
   ```bash
   # 使用 VSCode 的 Find & Replace (Cmd+Shift+H)
   # 查找：from '@/components/ui/dialog'
   # 替换为：from '@/components/common/Dialog'
   ```

2. **优先使用薄封装组件**：
   - `src/components/common/Dialog.tsx` - Dialog 完整示例
   - `src/components/common/Select.tsx` - Select 完整示例
   - 其他 common 组件 - 按需使用

3. **参考已完成的文件**：
   - 薄封装组件定义 - 查看 `src/components/common/*.tsx`
   - 使用示例 - 查看已重构的页面

4. **常见模式**：
   ```tsx
   // ✅ 推荐：使用薄封装 + ui-styles
   import { Dialog, DialogContent, DialogTitle } from '@/components/common/Dialog';
   import { Select, SelectContent, SelectItem } from '@/components/common/Select';
   import { Checkbox } from '@/components/common/Checkbox';
   import { Label } from '@/components/common/Label';
   import { getButtonClass, inputStyles } from '@/lib/ui-styles';

   <Dialog open={open} onOpenChange={setOpen}>
     <DialogContent>
       <DialogTitle>用户表单</DialogTitle>
       <form>
         <Label>用户名</Label>
         <input className={inputStyles} />

         <Label>角色</Label>
         <Select value={role} onValueChange={setRole}>
           <SelectContent>
             <SelectItem value="admin">管理员</SelectItem>
             <SelectItem value="user">用户</SelectItem>
           </SelectContent>
         </Select>

         <div className="flex items-center gap-2">
           <Checkbox checked={active} onCheckedChange={setActive} />
           <Label>激活</Label>
         </div>

         <button className={getButtonClass('default')}>提交</button>
       </form>
     </DialogContent>
   </Dialog>
   ```

## 完成标准

当以下条件都满足时，重构完成：
- ✅ 所有文件都不再导入 `@/components/ui/*`
- ✅ 复杂组件使用 `@/components/common/*` 薄封装
- ✅ 简单组件使用 `@/lib/ui-styles.ts`
- ✅ 所有功能正常运行
- ✅ UI 样式保持一致
- ✅ 可以安全删除 `src/components/ui` 目录

## 架构优势总结

### 当前混合策略 vs 之前方案

| 维度 | shadcn/ui（旧） | 完全不封装（之前计划） | 混合策略（当前 ⭐） |
|------|----------------|---------------------|-------------------|
| 代码重复 | ✅ 无重复 | ❌ Dialog 重复 9 次 | ✅ 无重复 |
| 维护成本 | ✅ 低 | ❌ 高（修改需改多处） | ✅ 低 |
| 样式一致性 | ✅ 自动保证 | ⚠️ 手动保证 | ✅ 自动保证 |
| 灵活性 | ⚠️ 受限 | ✅ 完全灵活 | ✅ 可灵活覆盖 |
| 性能 | ⚠️ 有封装层 | ✅ 零开销 | ✅ 几乎零开销 |
| 开发效率 | ✅ 高 | ❌ 低（重复代码多） | ✅ 高 |
| 学习成本 | ✅ 低 | ⚠️ 中（需熟悉 Radix） | ✅ 低 |
| 团队协作 | ✅ 易于协作 | ❌ 容易出错 | ✅ 易于协作 |

### 最佳实践

本项目采用的混合策略是业界推荐的最佳实践：

1. **薄封装组件** - 用于复杂交互组件
   - 减少重复，提高维护性
   - 保证一致性
   - 保留灵活性

2. **ui-styles 工具** - 用于简单组件
   - 零依赖，性能最优
   - 易于定制

3. **直接 Radix UI** - 特殊场景备用
   - 满足特殊定制需求
   - 完全控制权

这种架构在**维护性、性能和灵活性**之间取得了最佳平衡。
