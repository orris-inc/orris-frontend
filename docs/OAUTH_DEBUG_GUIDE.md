# OAuth调试指南

## 当前修改总结

已按照 `docs/OAUTH_FRONTEND_INTEGRATION.md` 文档完成前端OAuth集成：

### 1. 修改消息类型定义

**文件**: `src/features/auth/types/auth.types.ts`

修改了OAuth消息类型以匹配后端实际发送的格式：

```typescript
// 后端发送的成功消息（扁平结构）
{
  type: 'oauth_success',
  access_token: string,
  refresh_token: string,
  token_type: 'Bearer',
  expires_in: number,
  user: { ... }
}

// 而不是嵌套在data字段中
```

### 2. 更新OAuth处理逻辑

**文件**: `src/features/auth/utils/oauth-popup.ts`

- 修改了postMessage消息处理，适配后端扁平结构
- 添加了消息格式验证
- 增强了origin安全检查
- 修复了COOP跨域问题

### 3. 统一API URL配置

**文件**:
- `src/shared/lib/axios.ts`
- `src/features/auth/utils/oauth-popup.ts`

将默认API_BASE_URL统一为 `http://localhost:8081`（不包含/api后缀）

## 后端配置要求

### config.yaml

```yaml
server:
  allowed_origins:
    - "http://localhost:3000"  # 前端地址
  frontend_callback_url: "http://localhost:3000"  # postMessage targetOrigin
```

### 后端OAuth回调必须返回的HTML

成功情况：
```html
<script>
  const authData = {
    type: 'oauth_success',
    access_token: '{{.AccessToken}}',
    refresh_token: '{{.RefreshToken}}',
    token_type: 'Bearer',
    expires_in: {{.ExpiresIn}},
    user: {
      id: '{{.User.ID}}',
      email: '{{.User.Email}}',
      name: '{{.User.Name}}',
      avatar: '{{.User.Avatar}}',
      email_verified: {{.User.EmailVerified}},
      oauth_provider: '{{.User.OAuthProvider}}',
      created_at: '{{.User.CreatedAt}}',
      updated_at: '{{.User.UpdatedAt}}'
    }
  };

  if (window.opener) {
    window.opener.postMessage(authData, 'http://localhost:3000');
    setTimeout(() => window.close(), 100);
  }
</script>
```

## 测试方法

### 方法1：使用测试回调页面（推荐）

1. 访问 `http://localhost:3000/login`
2. 打开浏览器控制台
3. 在控制台输入以下代码，模拟OAuth弹窗：

```javascript
// 打开测试回调页面
const popup = window.open(
  'http://localhost:3000/oauth-test-callback.html',
  'oauth-test',
  'width=600,height=700,left=400,top=200'
);
```

4. 在打开的测试页面中点击"发送成功消息"按钮
5. 观察主页面是否成功登录

### 方法2：添加消息监听器调试

在浏览器控制台添加全局监听器：

```javascript
window.addEventListener('message', (event) => {
  console.log('==========================================');
  console.log('📨 收到postMessage:');
  console.log('来源origin:', event.origin);
  console.log('消息内容:', event.data);
  console.log('==========================================');
}, true);
```

然后点击OAuth登录按钮，观察控制台输出。

### 方法3：直接测试真实OAuth流程

确保后端配置正确后：

1. 访问 `http://localhost:3000/login`
2. 点击"使用 Google 登录"或"使用 GitHub 登录"
3. 在Google/GitHub授权页面完成授权
4. 检查：
   - 弹窗是否显示后端返回的HTML
   - 控制台是否有postMessage日志
   - 主页面是否接收到消息
   - 是否自动登录成功

## 常见问题排查

### 问题1: "用户取消了OAuth授权"

**可能原因**:
- 后端没有返回HTML页面
- 后端HTML中没有执行postMessage
- postMessage的targetOrigin不正确
- 弹窗被意外关闭

**排查步骤**:
1. 检查后端OAuth回调handler是否返回HTML
2. 检查HTML中的JavaScript是否正确执行
3. 检查targetOrigin是否是前端URL (`http://localhost:3000`)
4. 在控制台查看是否有postMessage相关错误

### 问题2: COOP警告

**现象**: 控制台显示 `Cross-Origin-Opener-Policy policy would block the window.closed call`

**说明**: 这是正常现象，不影响OAuth功能。COOP是浏览器安全机制，阻止跨域访问弹窗状态。

**解决**: 无需解决，已通过try-catch处理，主要依赖postMessage通信。

### 问题3: 消息未接收

**排查步骤**:

1. **检查origin验证**:
```javascript
// 前端会验证消息来源
const apiOrigin = new URL(API_BASE_URL).origin;  // http://localhost:8081
if (event.origin !== apiOrigin && event.origin !== window.location.origin) {
  // 消息会被拒绝
}
```

确保后端发送postMessage时的origin在允许列表中。

2. **检查消息格式**:
使用控制台监听器查看实际接收到的消息格式是否正确。

3. **检查CORS配置**:
后端的`allowed_origins`必须包含前端URL。

### 问题4: 弹窗被浏览器阻止

**解决**:
- 允许浏览器弹窗权限
- 或使用fallback模式（在同一窗口中打开OAuth）

## 检查清单

- [ ] 后端config.yaml配置了正确的`allowed_origins`和`frontend_callback_url`
- [ ] 后端OAuth回调返回HTML页面（不是JSON）
- [ ] HTML中包含正确的postMessage代码
- [ ] postMessage的targetOrigin是前端URL
- [ ] 消息格式是扁平结构（不嵌套在data字段）
- [ ] 前端.env配置了VITE_API_BASE_URL
- [ ] 浏览器允许弹窗
- [ ] 前端能接收到postMessage（通过控制台监听验证）

## 成功的OAuth流程应该是：

1. ✅ 点击登录 → 弹窗打开
2. ✅ 跳转到Google/GitHub → 用户授权
3. ✅ 回调到后端 → 处理授权码
4. ✅ 返回HTML → 执行postMessage
5. ✅ 前端接收消息 → 存储token
6. ✅ 弹窗关闭 → 跳转到首页

如果任何一步失败，请按照上面的排查步骤检查。

## 环境变量

### 前端 (.env)

```env
VITE_API_BASE_URL=http://localhost:8081
```

### 后端 (config.yaml)

```yaml
server:
  allowed_origins:
    - "http://localhost:3000"
  frontend_callback_url: "http://localhost:3000"
```

生产环境请替换为实际域名。
