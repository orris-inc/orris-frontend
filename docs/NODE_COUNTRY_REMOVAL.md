# 节点Country字段移除更新

## 更新日期
2025-11-11

## 变更说明

根据最新的后端API文档（`backend/swagger.json`），**country字段已被移除**，现在只保留可选的region字段。

### API变更对比

**之前的必需字段：**
```json
{
  "required": [
    "name",
    "protocol",
    "server_address",
    "server_port",
    "method",
    "country"  // ❌ 已移除
  ]
}
```

**现在的必需字段：**
```json
{
  "required": [
    "name",
    "protocol",
    "server_address",
    "server_port",
    "method"
  ]
}
```

**可选字段中保留：**
- `region` - 地区（可选字段）

---

## 更新内容

### 1. 类型定义更新 ✅

**文件：** `src/features/nodes/types/nodes.types.ts`

#### NodeListItem
```typescript
export interface NodeListItem {
  // ... 其他字段
  region?: string;     // 保留：可选地区字段
  // country 字段已移除 ❌
  // ... 其他字段
}
```

#### CreateNodeRequest
```typescript
export interface CreateNodeRequest {
  name: string;
  protocol: NodeProtocol;
  server_address: string;
  server_port: number;
  method: string;
  // country 字段已移除 ❌
  region?: string;     // 保留：可选地区字段
  // ... 其他可选字段
}
```

#### UpdateNodeRequest
```typescript
export interface UpdateNodeRequest {
  name?: string;
  protocol?: NodeProtocol;
  // country 字段已移除 ❌
  region?: string;     // 保留：可选地区字段
  // ... 其他可选字段
}
```

#### NodeListParams
```typescript
export interface NodeListParams {
  page?: number;
  page_size?: number;
  status?: NodeStatus;
  // country 筛选参数已移除 ❌
}
```

#### NodeFilters
```typescript
export interface NodeFilters {
  status?: NodeStatus;
  search?: string;
  // country 筛选已移除 ❌
}
```

---

### 2. CreateNodeDialog组件更新 ✅

**文件：** `src/features/nodes/components/CreateNodeDialog.tsx`

**变更内容：**
- ❌ 移除国家输入框
- ✅ 保留地区输入框（可选）
- ❌ 移除country字段验证
- ✅ 更新表单初始状态（移除country）
- ✅ 更新提交数据逻辑（移除country）
- ✅ 更新表单验证条件（移除country检查）

---

### 3. EditNodeDialog组件更新 ✅

**文件：** `src/features/nodes/components/EditNodeDialog.tsx`

**变更内容：**
- ❌ 移除国家输入框
- ✅ 保留地区输入框（可选）
- ❌ 移除country字段验证
- ✅ 更新初始化逻辑（移除country）
- ✅ 更新变更检测逻辑（移除country）

---

### 4. NodeListTable组件更新 ✅

**文件：** `src/features/nodes/components/NodeListTable.tsx`

**变更内容：**
- 表头：`国家/地区` → `地区`
- 显示逻辑：
  ```tsx
  // 之前
  <Typography>{node.country}{node.region && ` - ${node.region}`}</Typography>

  // 现在
  <Typography>{node.region || '-'}</Typography>
  ```
- 空值显示为 `-`

---

### 5. NodeFilters组件更新 ✅

**文件：** `src/features/nodes/components/NodeFilters.tsx`

**变更内容：**
- ❌ 移除国家筛选输入框
- ✅ 保留状态筛选
- ✅ 保留关键词搜索
- ✅ 调整Grid布局（3列变2列+按钮）
  - 状态筛选：4列宽度
  - 关键词搜索：6列宽度
  - 重置按钮：2列宽度

---

## 影响范围

### 已修改的文件
1. ✅ `src/features/nodes/types/nodes.types.ts`
2. ✅ `src/features/nodes/components/CreateNodeDialog.tsx`
3. ✅ `src/features/nodes/components/EditNodeDialog.tsx`
4. ✅ `src/features/nodes/components/NodeListTable.tsx`
5. ✅ `src/features/nodes/components/NodeFilters.tsx`

### 无需修改的文件
- `src/features/nodes/api/nodes-api.ts` - 使用类型定义，自动适配
- `src/features/nodes/stores/nodes-store.ts` - 使用类型定义，自动适配
- `src/features/nodes/hooks/useNodes.ts` - 使用类型定义，自动适配
- `src/pages/NodeManagementPage.tsx` - 无直接country使用

---

## 测试验证

### TypeScript类型检查
```bash
npx tsc --noEmit
```
✅ **通过** - 无类型错误

### 项目构建
```bash
npm run build
```
✅ **成功** - 构建完成

---

## UI变化对比

### 创建节点表单
**之前：**
- 节点名称
- 国家 ⭐（必填）
- 协议类型
- 服务器地址
- 端口
- 加密方法
- 地区（可选）
- ...其他字段

**现在：**
- 节点名称
- 协议类型
- 服务器地址
- 端口
- 加密方法
- 地区（可选）✅
- ...其他字段

### 编辑节点表单
同上变更。

### 节点列表表格
**列头变更：**
- `国家/地区` → `地区`

**数据显示：**
- 之前：`US - California`
- 现在：`California` 或 `-`（无数据时）

### 筛选器
**之前：** 状态 | 国家 | 搜索 | 重置
**现在：** 状态 | 搜索 | 重置 ✅

---

## 数据兼容性

### 旧数据处理
如果后端返回的旧数据仍包含country字段：
- 前端会忽略该字段（TypeScript不会报错）
- 不会影响功能运行
- 建议后端清理旧数据或保持API一致性

### Region字段
- 完全可选
- 可以为空或不提供
- UI显示为 `-` 当值为空时

---

## 迁移建议

### 对于后端
1. ✅ 确认country字段已从API中移除
2. ✅ 确认region字段为可选
3. 建议：清理数据库中的country字段数据（如果需要）

### 对于前端
1. ✅ 所有country相关代码已移除
2. ✅ 保留region字段支持
3. ✅ UI已适配新的数据结构

---

## 注意事项

1. **向后兼容：** 前端代码会忽略后端返回的country字段（如果存在）
2. **Region字段：** 仍然保留并完全可选
3. **筛选功能：** 不再支持按国家筛选
4. **验证逻辑：** 创建节点时不再要求country

---

## 相关文档

- 节点管理完整文档：`docs/NODE_MANAGEMENT_COMPLETE.md`
- Protocol字段更新：`docs/NODE_PROTOCOL_UPDATE.md`
- 功能总结：`docs/NODE_MANAGEMENT_SUMMARY.md`
