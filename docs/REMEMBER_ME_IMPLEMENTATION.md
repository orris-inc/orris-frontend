# 记住我功能实现文档

## 概述

本文档描述了登录页面"记住我"功能的实现细节。该功能允许用户选择是否在关闭浏览器后保持登录状态。

## 功能说明

### 用户体验

- **勾选"记住我"**：用户信息和 Token 将存储在 `localStorage`，即使关闭浏览器也会保持登录状态
- **不勾选"记住我"**：用户信息和 Token 将存储在 `sessionStorage`，关闭浏览器后需要重新登录

### 技术实现

## 1. 类型定义更新

**文件**：`src/features/auth/types/auth.types.ts`

```typescript
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean; // 新增：记住我选项
}
```

## 2. 认证状态管理

**文件**：`src/features/auth/stores/auth-store.ts`

### 核心功能

#### 自定义存储策略

实现了一个动态存储对象，根据 `rememberMe` 标记自动选择使用 `localStorage` 或 `sessionStorage`：

```typescript
const dynamicStorage = {
  getItem: (name: string) => {
    // 优先从 localStorage 读取（如果之前选择了"记住我"）
    const rememberMe = localStorage.getItem('auth-remember-me') === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    return storage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    // 从存储的值中提取 rememberMe 标记
    const state = JSON.parse(value);
    const rememberMe = state.state?.rememberMe ?? false;

    // 保存 rememberMe 标记
    localStorage.setItem('auth-remember-me', String(rememberMe));

    // 根据 rememberMe 选择存储位置
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(name, value);

    // 清理另一个存储
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(name);
  },
  removeItem: (name: string) => {
    // 同时清理两个存储
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
    localStorage.removeItem('auth-remember-me');
  },
};
```

#### State 更新

```typescript
interface AuthState {
  // ... 其他状态
  rememberMe: boolean; // 新增：记住我标记

  // 更新 login 方法签名
  login: (response: AuthResponse, rememberMe?: boolean) => void;
}
```

## 3. 登录逻辑更新

**文件**：`src/features/auth/hooks/useAuth.ts`

```typescript
const login = useCallback(
  async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      // 将 remember_me 传递给 store，用于选择存储方式
      storeLogin(response, data.remember_me ?? false);
      // ...
    } catch (err) {
      // ...
    }
  },
  [storeLogin, navigate, getRedirectUrl]
);
```

## 4. 登录页面 UI

**文件**：`src/pages/LoginPage.tsx`

### 表单验证

```typescript
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  rememberMe: z.boolean().catch(false), // 新增：记住我字段
});
```

### UI 组件

在密码字段和"忘记密码"链接之间添加了复选框：

```tsx
<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <FormControlLabel
    control={
      <Checkbox
        {...register('rememberMe')}
        defaultChecked={false}
        color="primary"
      />
    }
    label="记住我"
  />
  <Link component={RouterLink} to="/forgot-password">
    忘记密码？
  </Link>
</Box>
```

## 后端 API

根据 `backend/swagger.json`，后端登录接口已支持 `remember_me` 字段：

```json
{
  "handlers.LoginRequest": {
    "type": "object",
    "required": ["email", "password"],
    "properties": {
      "email": { "type": "string" },
      "password": { "type": "string" },
      "remember_me": { "type": "boolean" }
    }
  }
}
```

## 数据流

```
用户勾选"记住我"
  ↓
表单提交 { email, password, remember_me: true }
  ↓
发送到后端 API /auth/login
  ↓
后端返回 AuthResponse
  ↓
调用 storeLogin(response, true)
  ↓
Auth Store 设置 rememberMe: true
  ↓
Zustand persist 中间件触发 setItem
  ↓
dynamicStorage 检测到 rememberMe: true
  ↓
将数据存储到 localStorage
  ↓
下次打开浏览器时自动恢复登录状态
```

## 安全考虑

1. **Token 安全**：无论使用哪种存储方式，都应该使用 HTTPS 传输
2. **XSS 防护**：确保应用代码没有 XSS 漏洞，避免 Token 被窃取
3. **Token 过期**：后端应该设置合理的 Token 过期时间
4. **Refresh Token**：使用 Refresh Token 机制延长登录会话

## 测试建议

### 功能测试

1. **勾选"记住我"登录**
   - 登录成功后关闭浏览器
   - 重新打开浏览器，验证是否保持登录状态
   - 检查开发者工具 → Application → Local Storage，确认 `auth-storage` 存在

2. **不勾选"记住我"登录**
   - 登录成功后关闭浏览器
   - 重新打开浏览器，验证是否需要重新登录
   - 检查开发者工具 → Application → Session Storage，确认 `auth-storage` 存在

3. **切换测试**
   - 先勾选"记住我"登录，然后登出
   - 再不勾选"记住我"登录
   - 验证 localStorage 被清理，数据转移到 sessionStorage

### 边界测试

1. 清空浏览器缓存后的表现
2. 多标签页同时登录的行为
3. Token 过期后的自动刷新机制

## 维护说明

### 相关文件

- `src/features/auth/types/auth.types.ts` - 类型定义
- `src/features/auth/stores/auth-store.ts` - 状态管理和存储逻辑
- `src/features/auth/hooks/useAuth.ts` - 认证逻辑
- `src/features/auth/api/auth-api.ts` - API 调用
- `src/pages/LoginPage.tsx` - 登录页面 UI

### 后续优化建议

1. **记住上次选择**：记录用户上次是否勾选了"记住我"，下次登录时默认勾选
2. **安全提示**：在公共设备上显示警告，提醒用户不要勾选"记住我"
3. **登出清理**：确保登出时彻底清理所有存储，包括 localStorage 和 sessionStorage

## 更新日期

2025-11-11
