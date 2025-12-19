# 订阅计划功能快速启动指南

## 🔧 配置检查

### 1. 环境变量配置

确认 `.env` 文件存在并配置正确：

```bash
# 查看当前配置
cat .env
```

应该包含：
```
VITE_API_BASE_URL=http://localhost:8081
```

如果文件不存在，从示例创建：
```bash
cp .env.example .env
```

### 2. 端口配置

**前端端口**: `3000` (配置在 `vite.config.ts`)
**后端端口**: `8081` (配置在 `.env`)

### 3. 验证Vite配置

```bash
cat vite.config.ts | grep -A 3 "server:"
```

应该显示：
```typescript
server: {
  port: 3000,
  open: true,
},
```

---

## 🚀 启动步骤

### 步骤1：启动后端服务

确保后端服务运行在 `http://localhost:8081`

```bash
# 在后端项目目录运行
cd /path/to/backend
go run main.go
# 或
./backend-binary
```

验证后端是否运行：
```bash
curl http://localhost:8081/health
```

### 步骤2：安装前端依赖（如果还没安装）

```bash
npm install
```

### 步骤3：启动前端开发服务器

```bash
npm run dev
```

应该会自动打开浏览器访问 `http://localhost:3000`

---

## 📍 访问页面

启动成功后，可以访问以下页面：

### 用户端 - 定价页面（公开访问）
```
http://localhost:3000/pricing
```
功能：
- 查看所有公开的订阅计划
- 按计费周期筛选
- 选择计划（显示确认对话框）

### 管理端 - 订阅计划管理（需要登录）
```
http://localhost:3000/dashboard/subscription-plans
```
功能：
- 创建、编辑、激活/停用订阅计划
- 分页和筛选
- 完整的CRUD操作

**注意**: 管理端页面需要先登录才能访问。

---

## 🧪 测试流程

### 1. 登录系统
访问 `http://localhost:3000/login` 登录账户

### 2. 创建订阅计划（管理端）

a. 访问管理页面：`http://localhost:3000/dashboard/subscription-plans`

b. 点击"创建计划"按钮

c. 填写表单：
```
计划名称: 专业版
Slug: professional
价格: 99.00 元
货币: CNY
计费周期: 月付
描述: 适合中小团队使用
功能列表:
  - 无限项目
  - 10GB 存储空间
  - 24/7 客服支持
  - API 访问
最大用户数: 10
最大项目数: 50
存储限制: 10 GB
试用天数: 7
✓ 公开显示此计划
```

d. 点击"创建"

e. 在列表中找到刚创建的计划，确保状态为"激活"（绿色）

### 3. 查看用户端定价页面

a. 访问 `http://localhost:3000/pricing`

b. 应该能看到刚才创建的"专业版"计划

c. 切换计费周期筛选，测试筛选功能

d. 点击"选择计划"按钮

e. 查看订阅确认对话框，包含：
   - 计划详情
   - 价格信息
   - 功能列表
   - 使用限制
   - 试用期提示

### 4. 测试管理端功能

a. 编辑计划：点击编辑图标，修改价格或功能

b. 停用计划：点击电源图标，将计划设为"未激活"

c. 验证：返回定价页面，停用的计划应该不再显示

d. 重新激活：返回管理页面，再次点击电源图标激活

e. 筛选测试：使用页面顶部的筛选器，按状态、计费周期筛选

---

## 🔍 故障排查

### 问题1：前端无法连接后端

**症状**: 控制台显示网络错误，如 `ERR_CONNECTION_REFUSED`

**检查**:
```bash
# 1. 确认后端是否运行
curl http://localhost:8081/health

# 2. 检查.env配置
cat .env | grep VITE_API_BASE_URL

# 3. 重启前端开发服务器
npm run dev
```

### 问题2：页面显示"暂无可用的订阅计划"

**原因**:
- 后端没有公开的订阅计划
- 或者计划状态不是"激活"

**解决**:
1. 访问管理页面创建计划
2. 确保勾选"公开显示此计划"
3. 确保计划状态为"激活"（绿色标签）

### 问题3：管理页面访问被重定向到登录页

**原因**: 未登录或Token过期

**解决**:
1. 访问 `/login` 登录
2. 检查浏览器localStorage中是否有auth-storage
3. 确认Token未过期

### 问题4：TypeScript类型错误

**症状**: 终端显示大量Grid相关的类型错误

**说明**: 这是已知的MUI v7兼容性问题，不影响运行

**解决方案**:
- 方案A: 忽略（代码可以正常运行）
- 方案B: 降级MUI到v6
  ```bash
  npm install @mui/material@^6.0.0
  ```

### 问题5：API请求返回404

**检查API路径**:
```bash
# 查看实际请求的URL（在浏览器开发者工具 Network 标签）
# 应该是: http://localhost:8081/subscription-plans
# 而不是: http://localhost:8081/api/subscription-plans
```

如果后端需要 `/api` 前缀，修改 `.env`:
```
VITE_API_BASE_URL=http://localhost:8081/api
```

---

## 📊 API端点验证

使用curl测试后端API是否可用：

### 测试公开计划端点（无需认证）
```bash
curl http://localhost:8081/subscription-plans/public
```

预期响应：
```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

### 测试订阅计划列表端点（需要Token）
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8081/subscription-plans?page=1&page_size=20
```

### 测试创建订阅计划端点
```bash
curl -X POST http://localhost:8081/subscription-plans \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试计划",
    "slug": "test-plan",
    "price": 9900,
    "currency": "CNY",
    "billing_cycle": "monthly",
    "is_public": true
  }'
```

---

## 📝 开发者注意事项

1. **不使用mock数据** - 所有数据来自后端API
2. **价格单位** - 前端显示"元"，但发送给后端的是"分"（x100）
3. **认证方式** - Bearer Token，自动从localStorage读取
4. **错误处理** - 所有错误通过全局Snackbar显示
5. **状态管理** - 使用Zustand，数据实时从API获取

---

## 📖 更多文档

- 详细实现文档: `docs/SUBSCRIPTION_PLANS_IMPLEMENTATION.md`
- 后端API文档: `backend/swagger.json` 或访问 `http://localhost:8081/swagger`
- 错误消息处理: `docs/ERROR_MESSAGES.md`

---

更新时间: 2025-11-10
