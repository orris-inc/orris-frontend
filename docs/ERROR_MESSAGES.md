# 错误消息国际化系统

## 概述

本项目实现了统一的错误消息国际化系统，将所有后端返回的英文错误消息自动转换为用户友好的中文消息。

## 核心文件

### `src/shared/utils/error-messages.ts`

错误消息转换的核心工具文件，提供以下功能：

#### 主要函数

1. **`translateErrorMessage(message: string): string`**
   - 将英文错误消息转换为中文
   - 支持精确匹配、部分匹配和正则模式匹配
   - 如果消息已经是中文，直接返回
   - 未匹配到的消息返回通用错误提示

2. **`extractErrorMessage(error: any): string`**
   - 从各种错误对象中提取并转换错误消息
   - 支持Axios错误、标准Error对象、字符串错误等
   - 根据HTTP状态码返回对应的中文消息
   - 这是推荐在应用中使用的主函数

3. **`isAccountNotActiveError(error: any): boolean`**
   - 检查是否是"账号未激活"错误
   - 用于特殊错误处理（如显示重新发送验证邮件按钮）

4. **`extractRawErrorMessage(error: any): string`**
   - 提取原始错误消息（不翻译）
   - 用于日志记录和调试

#### 错误消息映射表

`errorMessages` 对象包含了常见的英文错误到中文的映射：

```typescript
{
  // 账号相关
  'account is not active': '您的账号尚未激活，请查收验证邮件',
  'account is locked': '账号已被锁定，请联系客服',

  // 登录相关
  'invalid email or password': '邮箱或密码错误',
  'user not found': '用户不存在',

  // Token相关
  'invalid token': '验证链接无效或已过期',
  'token expired': '验证链接已过期，请重新申请',

  // 邮箱验证
  'email already verified': '该邮箱已经验证过了',

  // 注册相关
  'email already exists': '该邮箱已被注册',

  // OAuth相关
  'oauth authentication failed': 'OAuth登录失败，请重试',

  // ... 更多映射
}
```

#### 模糊匹配模式

对于包含变量的错误消息（如 "user with email xxx@example.com already exists"），使用正则模式匹配：

```typescript
const errorPatterns = [
  {
    pattern: /user with email .* already exists/i,
    message: '该邮箱已被注册',
  },
  // ... 更多模式
];
```

## 使用方法

### 1. 在API调用中使用

推荐使用 `extractErrorMessage` 函数处理所有API错误：

```typescript
import { extractErrorMessage } from '@/shared/utils/error-messages';

try {
  await authApi.login(data);
} catch (err) {
  // 记录原始错误
  console.error('登录错误:', err);

  // 提取并转换错误消息
  const errorMsg = extractErrorMessage(err);
  setError(errorMsg);

  // 可以继续抛出原始错误，供调用者做特殊处理
  throw err;
}
```

### 2. 在Axios拦截器中使用

`src/shared/lib/axios.ts` 中的 `handleApiError` 函数已经集成了错误消息转换：

```typescript
export const handleApiError = (error: unknown): string => {
  console.error('API错误:', error);
  return extractErrorMessage(error);
};
```

### 3. 特殊错误处理

对于需要特殊处理的错误（如账号未激活），可以使用专门的判断函数：

```typescript
import { isAccountNotActiveError } from '@/shared/utils/error-messages';

try {
  await login(data);
} catch (err) {
  if (isAccountNotActiveError(err)) {
    // 显示"重新发送验证邮件"选项
    setShowResendVerification(true);
  }
}
```

## 已集成的页面

以下页面已经集成了错误消息转换系统：

1. **登录页面** (`src/pages/LoginPage.tsx`)
   - 普通登录错误转换
   - 特殊处理账号未激活错误（显示"前往验证"按钮）

2. **注册页面** (`src/pages/RegisterPage.tsx`)
   - 注册错误转换（如邮箱已存在）

3. **忘记密码页面** (`src/pages/ForgotPasswordPage.tsx`)
   - 发送重置邮件错误转换

4. **重置密码页面** (`src/pages/ResetPasswordPage.tsx`)
   - Token验证错误转换
   - 密码重置错误转换

5. **OAuth登录** (`src/features/auth/utils/oauth-popup.ts`)
   - OAuth错误消息转换

6. **认证Hook** (`src/features/auth/hooks/useAuth.ts`)
   - 所有认证相关操作的错误转换

## 添加新的错误消息

### 1. 添加精确匹配

在 `errorMessages` 对象中添加新的映射：

```typescript
export const errorMessages: Record<string, string> = {
  // ... 现有映射
  'new english error': '新的中文错误消息',
};
```

### 2. 添加模糊匹配模式

在 `errorPatterns` 数组中添加新的模式：

```typescript
const errorPatterns = [
  // ... 现有模式
  {
    pattern: /custom error pattern .*/i,
    message: '对应的中文消息',
  },
];
```

### 3. 添加特殊错误判断

如需添加特殊错误判断函数（类似 `isAccountNotActiveError`），在文件中添加：

```typescript
export function isCustomError(error: any): boolean {
  const message = extractRawErrorMessage(error);
  return /custom.*pattern/i.test(message);
}
```

## HTTP状态码错误映射

系统自动处理常见HTTP状态码：

- **401**: "认证失败，请重新登录"
- **403**: "没有权限访问此资源"
- **404**: "请求的资源不存在"
- **500**: "服务器错误，请稍后重试"
- **503**: "服务暂不可用，请稍后重试"

网络错误：
- **Network Error**: "网络连接失败，请检查网络设置"
- **ECONNABORTED**: "请求超时，请重试"

## 日志记录

为了调试方便，所有使用错误转换的地方都会记录原始错误：

```typescript
console.error('登录错误:', err);
```

这样在开发和调试时可以看到原始的英文错误消息，但用户看到的是友好的中文消息。

## 测试

错误消息转换系统包含完整的单元测试：`src/shared/utils/__tests__/error-messages.test.ts`

运行测试：
```bash
npm run test
```

## 最佳实践

1. **始终使用 `extractErrorMessage`**：在处理API错误时，使用此函数而不是直接访问 `error.message`

2. **保留原始错误**：在转换错误消息后，保留原始错误对象用于日志记录和特殊处理

3. **添加新错误时更新映射表**：发现新的后端错误消息时，及时添加到映射表中

4. **中文优先**：确保所有用户可见的错误消息都是中文，英文消息只用于日志

5. **具体且有帮助**：错误消息应该明确告诉用户问题是什么，并在可能时提供解决建议

## 未来改进

- [ ] 支持多语言（i18n）
- [ ] 添加更多后端错误消息的映射
- [ ] 实现错误消息的分类和分级
- [ ] 添加错误上报功能（未匹配的错误自动上报）
