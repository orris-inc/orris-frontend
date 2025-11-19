# 节点管理Protocol字段更新

## 更新日期
2025-11-11

## 重要发现

通过重新分析 `backend/swagger.json`，发现了一个**关键的必需字段**之前被遗漏：

### Protocol字段（必需）

根据最新的后端API文档 `node.CreateNodeRequest` 定义：

```json
{
  "required": [
    "country",
    "method",
    "name",
    "protocol",      // ⚠️ 新增必需字段
    "server_address",
    "server_port"
  ],
  "properties": {
    "protocol": {
      "type": "string",
      "enum": [
        "shadowsocks",
        "trojan"
      ],
      "example": "shadowsocks"
    }
  }
}
```

**Protocol是一个必需字段**，必须是以下值之一：
- `shadowsocks` - Shadowsocks协议
- `trojan` - Trojan协议

## 更新内容

### 1. 类型定义更新

**文件：** `src/features/nodes/types/nodes.types.ts`

#### 新增NodeProtocol类型
```typescript
export type NodeProtocol =
  | 'shadowsocks'  // Shadowsocks协议
  | 'trojan';      // Trojan协议
```

#### 更新NodeListItem接口
```typescript
export interface NodeListItem {
  id: number;
  name: string;
  description?: string;
  protocol: NodeProtocol;      // ✅ 新增必需字段
  server_address: string;
  // ... 其他字段
}
```

#### 更新CreateNodeRequest接口
```typescript
export interface CreateNodeRequest {
  name: string;
  protocol: NodeProtocol;       // ✅ 新增必需字段
  server_address: string;
  server_port: number;
  method: string;
  country: string;
  // ... 其他字段
}
```

#### 更新UpdateNodeRequest接口
```typescript
export interface UpdateNodeRequest {
  name?: string;
  description?: string;
  protocol?: NodeProtocol;      // ✅ 新增可选字段
  // ... 其他字段
}
```

### 2. CreateNodeDialog组件更新

**文件：** `src/features/nodes/components/CreateNodeDialog.tsx`

**更新内容：**
1. 初始状态添加 `protocol: 'shadowsocks'` 默认值
2. 添加protocol字段验证逻辑
3. 添加协议类型选择UI组件：
   ```tsx
   <TextField
     select
     label="协议类型"
     value={formData.protocol}
     required
   >
     <MenuItem value="shadowsocks">Shadowsocks</MenuItem>
     <MenuItem value="trojan">Trojan</MenuItem>
   </TextField>
   ```
4. 更新表单验证条件，包含protocol检查

### 3. EditNodeDialog组件更新

**文件：** `src/features/nodes/components/EditNodeDialog.tsx`

**更新内容：**
1. 从node数据初始化protocol字段
2. 添加协议类型编辑UI组件
3. 变更检测逻辑包含protocol字段

### 4. NodeListTable组件更新

**文件：** `src/features/nodes/components/NodeListTable.tsx`

**更新内容：**
1. 添加协议类型标签映射
   ```typescript
   const PROTOCOL_LABELS: Record<string, string> = {
     shadowsocks: 'Shadowsocks',
     trojan: 'Trojan',
   };
   ```
2. 表格头部添加"协议"列
3. 表格内容显示protocol字段，使用Chip组件展示
   ```tsx
   <Chip
     label={PROTOCOL_LABELS[node.protocol] || node.protocol}
     size="small"
     variant="outlined"
   />
   ```

## 测试验证

### TypeScript类型检查
```bash
npx tsc --noEmit
```
✅ 通过

### 项目构建
```bash
npm run build
```
✅ 成功

## 影响范围

### 必需修改的文件
1. `src/features/nodes/types/nodes.types.ts` - 类型定义
2. `src/features/nodes/components/CreateNodeDialog.tsx` - 创建对话框
3. `src/features/nodes/components/EditNodeDialog.tsx` - 编辑对话框
4. `src/features/nodes/components/NodeListTable.tsx` - 列表表格

### 无需修改的文件
- API层 (`nodes-api.ts`) - 使用泛型，自动适配
- Store (`nodes-store.ts`) - 使用类型定义，自动适配
- Hooks (`useNodes.ts`) - 使用类型定义，自动适配

## UI展示效果

### 创建节点表单
- 协议类型字段位置：国家字段下方
- 显示为下拉选择框
- 默认值：Shadowsocks
- 必填标记：红色*号

### 编辑节点表单
- 协议类型字段位置：状态字段下方
- 显示为下拉选择框
- 可编辑

### 节点列表表格
- 新增"协议"列，位于"名称"列之后
- 使用Chip组件展示，带边框样式
- 显示友好名称（Shadowsocks / Trojan）

## 注意事项

1. **向后兼容性**：旧数据如果没有protocol字段，需要后端确保返回默认值
2. **验证逻辑**：前端严格验证protocol必须为shadowsocks或trojan之一
3. **UI位置**：协议字段在表单中的位置靠前，因为是核心配置
4. **默认值**：创建时默认使用shadowsocks协议

## 后续建议

1. 根据协议类型动态调整可用的加密方法选项（Shadowsocks和Trojan支持的方法不同）
2. 添加协议类型的筛选功能
3. 在节点统计中增加按协议类型分组的统计

## 相关文档
- 详细实现文档：`docs/NODE_MANAGEMENT_UPDATE.md`
- 功能总结：`docs/NODE_MANAGEMENT_SUMMARY.md`
