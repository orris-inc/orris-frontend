# 后端 API 分析文档

## 📋 概述

本文档基于 `backend/swagger.json` 分析了后端 API 的结构，特别关注用户权限相关的接口。

**文档生成时间**：2025-11-11
**Swagger 文件位置**：`backend/swagger.json`
**API 基础 URL**：`http://localhost:8081` (可通过 `VITE_API_BASE_URL` 配置)

---

## 🔐 用户权限系统

### 角色定义

根据 Swagger 文档，后端支持以下用户角色：

| 角色 | 值 | 说明 |
|------|-----|------|
| 普通用户 | `"user"` | 默认角色，可访问用户端功能 |
| 管理员 | `"admin"` | 可访问管理端功能 |

**来源**：`internal_application_user_dto.UpdateUserRequest`

```json
"role": {
  "type": "string",
  "enum": ["user", "admin"]
}
```

### ⚠️ 前后端同步

**已修复**：前端类型定义已同步更新为：

```typescript
// src/types/navigation.types.ts
export type UserRole = 'user' | 'admin';
```

**之前问题**：前端定义了 `'moderator'` 角色，但后端不支持。

---

## 🔑 认证相关接口

### 1. 用户登录

**接口**：`POST /auth/login`

**描述**：用户邮箱密码登录，设置 JWT Token 到 HttpOnly Cookie

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 用户邮箱 |
| password | string | ✅ | 用户密码 |
| remember_me | boolean | ❌ | 记住登录状态 |

**请求示例**：
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "remember_me": true
}
```

**响应格式**：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "display_name": "管理员",
      "role": "admin",         // ← 权限字段
      "status": "active",
      "email_verified": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  },
  "message": "登录成功"
}
```

**认证方式**：
- Token 存储在 HttpOnly Cookie 中
- 前端无需手动管理 Token
- Cookie 会自动在后续请求中携带

**错误响应**：

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 邮箱或密码错误 |

---

### 2. 获取当前用户信息

**接口**：`GET /auth/me`

**描述**：获取当前登录用户的完整信息

**认证**：需要 Bearer Token（通过 HttpOnly Cookie 自动携带）

**请求参数**：无

**响应格式**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "display_name": "管理员",
    "name": "管理员",
    "initials": "管",
    "avatar": "https://example.com/avatar.jpg",
    "role": "admin",              // ← 权限字段
    "status": "active",
    "email_verified": true,
    "oauth_provider": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**使用场景**：
- ✅ 应用启动时检查登录状态
- ✅ 刷新用户信息
- ✅ 验证 Token 是否有效

**错误响应**：

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录或 Token 过期 |
| 404 | 用户不存在 |

---

### 3. Token 刷新

**接口**：`POST /auth/refresh`

**描述**：刷新 Access Token（Cookie 自动携带 Refresh Token）

**请求参数**：无（Cookie 自动携带）

**响应格式**：
```json
{
  "success": true,
  "message": "Token 刷新成功"
}
```

**实现细节**：
- 前端 Axios 拦截器自动处理 401 错误
- 自动调用 `/auth/refresh`
- 后端自动更新 Cookie
- 重试原始请求

**代码位置**：`src/shared/lib/axios.ts:47-96`

---

### 4. 用户登出

**接口**：`POST /auth/logout`

**描述**：清除服务器端的认证 Cookie

**请求参数**：无

**响应格式**：
```json
{
  "success": true,
  "message": "登出成功"
}
```

**前端处理**：
- 调用 API 清除 Cookie
- 清空 `useAuthStore` 状态
- 跳转到登录页

---

## 👤 用户管理接口

### 1. 获取用户列表

**接口**：`GET /api/users`

**权限**：需要管理员权限

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| page | integer | 页码（从 1 开始） |
| page_size | integer | 每页数量 |
| role | string | 角色过滤（`user` 或 `admin`） |
| status | string | 状态过滤 |
| search | string | 搜索关键词（邮箱或名称） |

**响应格式**：
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "email": "user@example.com",
        "display_name": "用户1",
        "role": "user",
        "status": "active",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

---

### 2. 更新用户信息

**接口**：`PUT /api/users/{id}`

**权限**：需要管理员权限

**请求参数**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ❌ | 用户邮箱 |
| name | string | ❌ | 用户名称（2-100字符） |
| role | string | ❌ | 用户角色（`user` 或 `admin`） |
| status | string | ❌ | 账户状态 |

**状态枚举**：
- `active`: 活跃
- `inactive`: 未激活
- `pending`: 待处理
- `suspended`: 已暂停

**请求示例**：
```json
{
  "role": "admin",
  "status": "active"
}
```

---

## 📊 数据模型

### User 对象

虽然 Swagger 文档没有明确定义 User 响应模型，但根据代码实现和接口响应，User 对象包含以下字段：

```typescript
interface User {
  // 基础信息
  id: number | string;
  email: string;
  display_name?: string;    // 显示名称
  name?: string;            // 用户名
  initials?: string;        // 首字母缩写
  avatar?: string;          // 头像 URL

  // 权限相关
  role?: 'user' | 'admin';  // 用户角色
  status?: string;          // 账户状态

  // 认证相关
  email_verified?: boolean; // 邮箱是否已验证
  oauth_provider?: 'google' | 'github' | null;

  // 时间戳
  created_at: string;       // ISO 8601 格式
  updated_at?: string;      // ISO 8601 格式
}
```

---

## 🔄 权限获取流程

### 应用启动时

```
1. App.tsx 挂载
   ↓
2. useAuthInitializer() 自动调用
   ↓
3. GET /auth/me
   ↓
4. 响应：{ data: { id, email, role: "admin", ... } }
   ↓
5. 存储到 useAuthStore
   ↓
6. usePermissions() 可用
   ↓
7. 根据 role 显示对应 UI
```

### 用户登录时

```
1. 用户输入账号密码
   ↓
2. POST /auth/login { email, password }
   ↓
3. 后端验证，设置 HttpOnly Cookie
   ↓
4. 响应：{ data: { user: { role: "admin", ... } } }
   ↓
5. 前端存储到 useAuthStore
   ↓
6. 根据 user.role 重定向：
   - admin → /admin
   - user → /dashboard
```

---

## 🛡️ 安全机制

### 1. HttpOnly Cookie

**优势**：
- ✅ JavaScript 无法访问，防止 XSS 攻击
- ✅ 浏览器自动管理
- ✅ 无需手动存储 Token

**配置**：
```typescript
// src/shared/lib/axios.ts
export const apiClient = axios.create({
  withCredentials: true, // 允许携带 Cookie
});
```

### 2. 自动 Token 刷新

**机制**：
- Axios 响应拦截器捕获 401 错误
- 自动调用 `/auth/refresh`
- 刷新冷却时间：1 秒（防止频繁刷新）
- 并发控制：同时只有一个刷新请求

**代码位置**：`src/shared/lib/axios.ts:99-133`

### 3. 角色验证

**前端验证**：
- `AdminRoute` 组件：检查 `user.role === 'admin'`
- `usePermissions` hook：提供 `hasPermission()` 方法

**重要**：前端验证仅用于 UI 控制，后端必须进行权限验证！

---

## 📝 Swagger 文档限制

### 1. 泛型类型支持不足

**问题**：
```json
{
  "200": {
    "schema": {
      "$ref": "#/definitions/orris_internal_shared_utils.APIResponse"
    }
  }
}
```

`APIResponse.data` 字段是空对象 `{}`，没有具体类型。

**原因**：
- Go 的 Swagger 生成器（swaggo）对泛型支持有限
- 无法自动推断运行时类型

**解决方案**：
- 参考本文档的实际响应示例
- 查看后端代码实现
- 使用 TypeScript 类型定义

### 2. 缺少详细的响应示例

**建议**：
- 在开发环境中使用浏览器 DevTools 查看实际响应
- 参考本文档的响应格式定义
- 与后端团队确认字段含义

---

## 🔍 调试技巧

### 1. 查看当前用户权限

**浏览器控制台**：
```javascript
// 方法1：直接访问 store
import { useAuthStore } from '@/features/auth/stores/auth-store';
console.log(useAuthStore.getState().user?.role);

// 方法2：在组件中
const { user } = useAuthStore();
console.log(user?.role); // 'admin' | 'user'
```

### 2. 查看网络请求

**步骤**：
1. 打开浏览器 DevTools（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 找到 `/auth/me` 请求
5. 查看 Response 标签中的 `role` 字段

### 3. 模拟管理员权限

**开发环境**：

方法1：使用管理员账号登录
```
POST /auth/login
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

方法2：后端返回测试数据（需要后端支持）

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `ADMIN_PORTAL_IMPLEMENTATION.md` | 管理端入口实施总结 |
| `QUICK_START_GUIDE.md` | 项目快速入门 |
| `backend/swagger.json` | 完整 API 文档 |

---

## 🔗 前端实现位置

| 功能 | 文件路径 |
|------|---------|
| API 客户端配置 | `src/shared/lib/axios.ts` |
| 认证 API | `src/features/auth/api/auth-api.ts` |
| 认证状态管理 | `src/features/auth/stores/auth-store.ts` |
| 认证初始化 | `src/features/auth/hooks/useAuthInitializer.ts` |
| 权限检查 | `src/features/auth/hooks/usePermissions.ts` |
| 管理端守卫 | `src/shared/components/AdminRoute.tsx` |
| 用户类型定义 | `src/features/auth/types/auth.types.ts` |
| 角色类型定义 | `src/types/navigation.types.ts` |

---

## ✅ 检查清单

使用以下清单确保权限系统正常工作：

### 后端检查
- [ ] `/auth/login` 接口返回 `user.role` 字段
- [ ] `/auth/me` 接口返回 `user.role` 字段
- [ ] role 字段值为 `"user"` 或 `"admin"`
- [ ] HttpOnly Cookie 正确设置
- [ ] CORS 配置允许 `withCredentials`

### 前端检查
- [ ] `UserRole` 类型定义与后端一致
- [ ] `useAuthInitializer` 正常调用
- [ ] `useAuthStore` 正确存储 user 对象
- [ ] `usePermissions` 正常工作
- [ ] `AdminRoute` 正确拦截非管理员
- [ ] 登录后根据角色正确重定向

---

**文档维护**：
- 当后端 API 变化时，请更新本文档
- 当添加新角色时，需要同步更新前后端
- 定期检查 Swagger 文档的更新

**最后更新**：2025-11-11
**文档版本**：1.0.0
