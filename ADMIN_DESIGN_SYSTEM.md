# 管理端设计系统文档
## 精致商务风格统一规范

## 🎨 设计理念

**精致商务风格**：专业、现代、清晰的视觉层次，优雅的色彩分离

### 核心原则
- ✨ 精致：注重细节，丰富的视觉反馈
- 📊 专业：商务场景适用的稳重配色
- 🎯 清晰：明确的视觉层次和信息架构
- 🌗 完善：深色模式完整支持

---

## 📐 设计规范

### 1. 色彩系统

#### 基础色调
- **主色调**：slate系列（灰色系）
  - slate-50 → slate-900（浅到深）
  - 用于背景、文字、边框

#### 功能色彩
- **蓝色**：主要操作、信息提示
  - bg: `bg-blue-50/100` → `bg-blue-900`
  - text: `text-blue-600` / `dark:text-blue-400`

- **绿色**：成功、积极指标
  - bg: `bg-emerald-50` → `bg-emerald-900/20`
  - text: `text-emerald-600` / `dark:text-emerald-400`

- **紫色**：高级功能、特殊标识
  - bg: `bg-violet-50` → `bg-violet-900/20`
  - text: `text-violet-600` / `dark:text-violet-400`

- **橙色**：警示、性能指标
  - bg: `bg-orange-50` → `bg-orange-900/20`
  - text: `text-orange-600` / `dark:text-orange-400`

- **红色**：错误、危险操作
  - bg: `bg-rose-50` → `bg-rose-900/20`
  - text: `text-rose-600` / `dark:text-rose-400`

#### 深色模式
- 背景：`bg-slate-900`
- 卡片：`bg-slate-900` + `border-slate-800`
- 文字：`text-white` / `text-slate-300/400`

### 2. 排版系统

#### 标题层级
```
H1 (页面主标题): text-3xl font-bold tracking-tight
H2 (区块标题):   text-lg font-semibold
H3 (卡片标题):   text-base font-semibold
```

#### 正文
```
描述文字: text-base text-slate-500 dark:text-slate-400
小文字:   text-sm text-slate-500 dark:text-slate-400
```

#### 字体
- 使用系统默认字体栈（见tailwind配置）
- 不使用Inter、Roboto等通用字体

### 3. 圆角系统

```
按钮: rounded-xl (12px)
卡片: rounded-2xl (16px)
徽章: rounded-full
```

### 4. 间距系统

```
页面容器: space-y-8 py-8
卡片内部: p-6
组件间距: gap-4 / gap-6
```

### 5. 阴影效果

```
卡片hover: shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
按钮:      shadow-lg shadow-slate-900/10 dark:shadow-white/10
```

### 6. 图标规范

- 使用 **lucide-react**
- strokeWidth: **1.5**
- 尺寸根据上下文：
  - 页面图标：`size-6`
  - 按钮图标：`size-4`
  - 卡片图标：`size-5`

---

## 🧩 组件库

### AdminPageLayout
标准页面布局组件

```tsx
<AdminPageLayout
  title="用户管理"
  description="管理系统中的所有用户账户"
  icon={Users}
  info="可选的信息提示文字"
  action={<AdminButton>创建用户</AdminButton>}
>
  {/* 页面内容 */}
</AdminPageLayout>
```

### AdminCard
统一卡片样式

```tsx
<AdminCard>
  <AdminCardHeader
    title="卡片标题"
    description="可选描述"
    action={<button>操作</button>}
  />
  <AdminCardContent>
    {/* 内容 */}
  </AdminCardContent>
</AdminCard>
```

### AdminButton
统一按钮样式

```tsx
<AdminButton
  variant="primary" // primary | secondary | outline | ghost | danger
  size="md"         // sm | md | lg
  icon={<Plus className="size-4" />}
  loading={false}
>
  按钮文字
</AdminButton>
```

### AdminStatsCard
数据统计卡片

```tsx
<AdminStatsCard
  title="总用户数"
  value="2,847"
  change="+12.5%"
  changeType="increase"
  icon={<Users className="size-6" strokeWidth={1.5} />}
  iconBg="bg-blue-50 dark:bg-blue-900/20"
  iconColor="text-blue-600 dark:text-blue-400"
  accentColor="bg-blue-500"
/>
```

### AdminFilterCard
筛选器容器

```tsx
<AdminFilterCard>
  <FilterRow columns={4}>
    {/* 筛选项 */}
  </FilterRow>
</AdminFilterCard>
```

---

## 📝 使用示例

### 标准管理页面模板

```tsx
import { Users, Plus } from 'lucide-react';
import { AdminPageLayout, AdminButton, AdminCard, AdminFilterCard, FilterRow } from '@/components/admin';

export const ExampleManagementPage = () => {
  return (
    <AdminLayout>
      <AdminPageLayout
        title="功能管理"
        description="管理页面描述"
        icon={Users}
        info="这是一个信息提示"
        action={
          <AdminButton variant="primary" icon={<Plus className="size-4" />}>
            新增项目
          </AdminButton>
        }
      >
        {/* 筛选器 */}
        <AdminFilterCard>
          <FilterRow columns={4}>
            {/* 筛选项组件 */}
          </FilterRow>
        </AdminFilterCard>

        {/* 内容卡片 */}
        <AdminCard>
          {/* 表格或其他内容 */}
        </AdminCard>
      </AdminPageLayout>
    </AdminLayout>
  );
};
```

---

## ✅ 迁移检查清单

从旧风格迁移到新风格时，请确保：

- [ ] 使用 `AdminPageLayout` 替换自定义标题区
- [ ] 标题改为 `text-3xl`（而不是 `text-4xl/5xl`）
- [ ] 按钮使用 `AdminButton` 组件
- [ ] 卡片使用 `AdminCard` 组件
- [ ] 圆角统一为 `rounded-xl/2xl`
- [ ] 图标 strokeWidth 设置为 1.5
- [ ] 添加 hover 效果和阴影
- [ ] 深色模式完整支持
- [ ] 移除 CSS 变量（如 text-muted-foreground），改用直接颜色类名

---

## 🎯 效果对比

### 迁移前（旧风格）
```tsx
<div className="space-y-8 py-8 sm:py-12">
  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">标题</h1>
  <p className="text-lg text-muted-foreground">描述</p>
  <button className={getButtonClass('default')}>按钮</button>
</div>
```

### 迁移后（新风格）
```tsx
<AdminPageLayout
  title="标题"
  description="描述"
  icon={Icon}
  action={<AdminButton variant="primary">按钮</AdminButton>}
>
  {/* 内容 */}
</AdminPageLayout>
```

---

## 📚 参考资料

- NewAdminDashboardPage.tsx - 完整的设计范例
- src/components/admin/ - 统一组件库
- lucide-react 图标库: https://lucide.dev/

---

## 🔄 维护说明

1. **新增管理页面**：必须使用统一组件库
2. **修改现有页面**：逐步迁移到新风格
3. **自定义需求**：在统一组件基础上扩展，保持风格一致
4. **组件更新**：在 src/components/admin/ 中维护

---

*最后更新：2025-11*
