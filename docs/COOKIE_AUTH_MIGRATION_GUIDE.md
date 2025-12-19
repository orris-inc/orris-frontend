# Cookie 认证方案迁移指南

## 📋 目录

- [背景说明](#背景说明)
- [方案对比](#方案对比)
- [后端改造详细步骤](#后端改造详细步骤)
- [前端改造详细步骤](#前端改造详细步骤)
- [安全加固](#安全加固)
- [测试要点](#测试要点)
- [迁移步骤](#迁移步骤)
- [常见问题](#常见问题)

---

## 背景说明

### 当前方案的问题

当前系统使用 **localStorage/sessionStorage** 存储 JWT Token：

```
登录流程：
1. 用户登录
2. 后端返回 access_token 和 refresh_token（JSON 格式）
3. 前端存储到 localStorage/sessionStorage
4. 每次请求时，前端从存储读取 Token，添加到 Authorization Header
```

**存在的安全风险**：
1. ❌ **XSS 攻击**：恶意 JS 可以通过 `localStorage.getItem('auth-storage')` 读取 Token
2. ❌ **隐私模式**：部分浏览器的隐私模式不支持 localStorage
3. ❌ **存储管理**：需要手动处理 Token 的存储、读取、清理逻辑

### 目标方案

改用 **HttpOnly Cookie** 存储 Token：

```
登录流程：
1. 用户登录
2. 后端将 Token 写入 HttpOnly Cookie
3. 浏览器自动携带 Cookie 发送请求
4. JS 无法读取 Cookie（防 XSS）
```

**优势**：
- ✅ **防 XSS**：JS 无法读取 HttpOnly Cookie
- ✅ **自动管理**：浏览器自动处理 Cookie 的发送和过期
- ✅ **更安全**：符合 OWASP 最佳实践

---

## 方案对比

| 对比项 | 当前方案 (localStorage) | 目标方案 (HttpOnly Cookie) |
|--------|-------------------------|---------------------------|
| **XSS 防护** | ❌ JS 可读取 Token | ✅ JS 无法读取 |
| **CSRF 防护** | ✅ 不受影响 | ⚠️ 需要 CSRF Token |
| **隐私模式** | ⚠️ 可能不可用 | ✅ 通常支持 |
| **实现复杂度** | ⚠️ 前端需要手动管理 | ✅ 浏览器自动处理 |
| **CORS 配置** | ✅ 简单 | ⚠️ 需要 `AllowCredentials` |
| **后端改动** | ✅ 无需改动 | ⚠️ 需要修改接口 |

---

## 后端改造详细步骤

假设后端使用 **Go + Gin** 框架（根据实际框架调整）

### 1️⃣ 登录接口改造

#### **当前实现**

```go
// POST /auth/login
func LoginHandler(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "请求参数错误"})
        return
    }

    // 验证用户
    user, err := AuthenticateUser(req.Email, req.Password)
    if err != nil {
        c.JSON(401, gin.H{"error": "邮箱或密码错误"})
        return
    }

    // 生成 Token
    accessToken, _ := GenerateAccessToken(user.ID)
    refreshToken, _ := GenerateRefreshToken(user.ID)

    // ❌ 当前：返回 JSON
    c.JSON(200, gin.H{
        "code": 200,
        "data": gin.H{
            "access_token":  accessToken,
            "refresh_token": refreshToken,
            "token_type":    "Bearer",
            "expires_in":    3600,
            "user":          user,
        },
    })
}
```

#### **改造后**

```go
// POST /auth/login
func LoginHandler(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "请求参数错误"})
        return
    }

    // 验证用户
    user, err := AuthenticateUser(req.Email, req.Password)
    if err != nil {
        c.JSON(401, gin.H{"error": "邮箱或密码错误"})
        return
    }

    // 生成 Token
    accessToken, _ := GenerateAccessToken(user.ID)
    refreshToken, _ := GenerateRefreshToken(user.ID)

    // ✅ 改造：设置 HttpOnly Cookie
    // Access Token Cookie（短期，1小时）
    c.SetCookie(
        "access_token",              // Cookie 名称
        accessToken,                 // Token 值
        3600,                        // 过期时间（秒）
        "/",                         // 路径（所有路径可访问）
        "",                          // 域名（空字符串 = 当前域名）
        true,                        // Secure（仅 HTTPS，本地开发可设为 false）
        true,                        // HttpOnly（JS 无法读取）
    )

    // Refresh Token Cookie（长期，7天 或 30天）
    refreshExpiry := 7 * 24 * 3600  // 默认 7 天
    if req.RememberMe {
        refreshExpiry = 30 * 24 * 3600  // 记住我：30 天
    }

    c.SetCookie(
        "refresh_token",
        refreshToken,
        refreshExpiry,
        "/",
        "",
        true,
        true,
    )

    // ✅ 改造：响应体不返回 Token，仅返回用户信息
    c.JSON(200, gin.H{
        "code": 200,
        "message": "登录成功",
        "data": gin.H{
            "user": user,
            // 不再返回 access_token 和 refresh_token
        },
    })
}
```

---

### 2️⃣ 认证中间件改造

#### **当前实现**

```go
// 当前：从 Authorization Header 读取 Token
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // ❌ 从 Header 读取
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "未登录"})
            c.Abort()
            return
        }

        // 解析 "Bearer <token>"
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{"error": "Token 格式错误"})
            c.Abort()
            return
        }

        token := parts[1]

        // 验证 Token
        claims, err := ValidateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Token 无效"})
            c.Abort()
            return
        }

        // 将用户信息存入上下文
        c.Set("user_id", claims.UserID)
        c.Next()
    }
}
```

#### **改造后**

```go
// 改造：从 Cookie 读取 Token
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // ✅ 从 Cookie 读取
        accessToken, err := c.Cookie("access_token")
        if err != nil {
            c.JSON(401, gin.H{
                "code": 401,
                "error": "未登录或登录已过期",
            })
            c.Abort()
            return
        }

        // 验证 Token
        claims, err := ValidateToken(accessToken)
        if err != nil {
            // Token 无效或过期
            c.JSON(401, gin.H{
                "code": 401,
                "error": "Token 无效或已过期",
            })
            c.Abort()
            return
        }

        // 将用户信息存入上下文
        c.Set("user_id", claims.UserID)
        c.Next()
    }
}
```

---

### 3️⃣ 刷新 Token 接口改造

#### **当前实现**

```go
// POST /auth/refresh
func RefreshTokenHandler(c *gin.Context) {
    var req RefreshTokenRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "请求参数错误"})
        return
    }

    // ❌ 从请求体读取 Refresh Token
    refreshToken := req.RefreshToken

    // 验证 Refresh Token
    claims, err := ValidateRefreshToken(refreshToken)
    if err != nil {
        c.JSON(401, gin.H{"error": "Refresh Token 无效"})
        return
    }

    // 生成新的 Access Token
    newAccessToken, _ := GenerateAccessToken(claims.UserID)

    // ❌ 返回 JSON
    c.JSON(200, gin.H{
        "code": 200,
        "data": gin.H{
            "access_token": newAccessToken,
            "expires_in":   3600,
        },
    })
}
```

#### **改造后**

```go
// POST /auth/refresh
func RefreshTokenHandler(c *gin.Context) {
    // ✅ 从 Cookie 读取 Refresh Token
    refreshToken, err := c.Cookie("refresh_token")
    if err != nil {
        c.JSON(401, gin.H{
            "code": 401,
            "error": "Refresh Token 不存在或已过期",
        })
        return
    }

    // 验证 Refresh Token
    claims, err := ValidateRefreshToken(refreshToken)
    if err != nil {
        c.JSON(401, gin.H{
            "code": 401,
            "error": "Refresh Token 无效",
        })
        return
    }

    // 生成新的 Access Token
    newAccessToken, _ := GenerateAccessToken(claims.UserID)

    // ✅ 更新 Access Token Cookie
    c.SetCookie(
        "access_token",
        newAccessToken,
        3600,
        "/",
        "",
        true,
        true,
    )

    // ✅ 仅返回成功消息
    c.JSON(200, gin.H{
        "code": 200,
        "message": "Token 刷新成功",
    })
}
```

---

### 4️⃣ 登出接口改造

#### **当前实现**

```go
// POST /auth/logout
func LogoutHandler(c *gin.Context) {
    // ❌ 当前：可能需要将 Token 加入黑名单
    // 但前端直接删除 localStorage 即可

    c.JSON(200, gin.H{
        "code": 200,
        "message": "登出成功",
    })
}
```

#### **改造后**

```go
// POST /auth/logout
func LogoutHandler(c *gin.Context) {
    // ✅ 清除 Cookie（设置为立即过期）
    c.SetCookie("access_token", "", -1, "/", "", true, true)
    c.SetCookie("refresh_token", "", -1, "/", "", true, true)

    c.JSON(200, gin.H{
        "code": 200,
        "message": "登出成功",
    })
}
```

---

### 5️⃣ CORS 配置改造（**关键**）

#### **当前配置**

```go
import "github.com/gin-contrib/cors"

func SetupRouter() *gin.Engine {
    router := gin.Default()

    // ❌ 当前 CORS 配置
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Content-Type", "Authorization"},
        // AllowCredentials 默认为 false
    }))

    return router
}
```

#### **改造后（重要！）**

```go
func SetupRouter() *gin.Engine {
    router := gin.Default()

    // ✅ 必须启用 AllowCredentials
    router.Use(cors.New(cors.Config{
        AllowOrigins: []string{
            "http://localhost:5173",        // 本地开发
            "https://yourdomain.com",       // 生产环境
        },
        AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders: []string{
            "Content-Type",
            "X-CSRF-Token",  // 如果使用 CSRF 防护
        },
        AllowCredentials: true,  // 【关键】允许携带 Cookie
        MaxAge:           12 * time.Hour,
    }))

    return router
}
```

**注意事项**：
- ⚠️ `AllowCredentials: true` 时，`AllowOrigins` **不能使用** `*`
- ⚠️ 必须明确指定前端域名（包括协议和端口）

---

### 6️⃣ OAuth 登录改造

#### **当前实现**

```go
// GET /auth/google/callback
func GoogleCallbackHandler(c *gin.Context) {
    // ... 验证 OAuth 授权码 ...

    // 生成 Token
    accessToken, _ := GenerateAccessToken(user.ID)
    refreshToken, _ := GenerateRefreshToken(user.ID)

    // ❌ 重定向到前端，Token 放在 URL 参数中
    redirectURL := fmt.Sprintf(
        "http://localhost:5173/oauth-callback?access_token=%s&refresh_token=%s",
        accessToken, refreshToken,
    )
    c.Redirect(302, redirectURL)
}
```

#### **改造后**

```go
// GET /auth/google/callback
func GoogleCallbackHandler(c *gin.Context) {
    // ... 验证 OAuth 授权码 ...

    // 生成 Token
    accessToken, _ := GenerateAccessToken(user.ID)
    refreshToken, _ := GenerateRefreshToken(user.ID)

    // ✅ 设置 Cookie
    c.SetCookie("access_token", accessToken, 3600, "/", "", true, true)
    c.SetCookie("refresh_token", refreshToken, 30*24*3600, "/", "", true, true)

    // ✅ 重定向到前端（不带 Token）
    c.Redirect(302, "http://localhost:5173/oauth-callback?success=true")
}
```

---

## 前端改造详细步骤

### 1️⃣ Axios 配置改造

#### **当前配置**

```typescript
// src/shared/lib/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ❌ 当前：手动添加 Authorization Header
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### **改造后**

```typescript
// src/shared/lib/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ 【关键】允许携带 Cookie
});

// ✅ 删除 Authorization Header 的拦截器
// 浏览器会自动携带 Cookie，无需手动处理

// 保留错误处理拦截器
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      // Token 过期，尝试刷新
      // ...
    }
    return Promise.reject(error);
  }
);
```

---

### 2️⃣ Auth Store 简化

#### **当前实现**

```typescript
// src/features/auth/stores/auth-store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;       // ❌ 删除
  refreshToken: string | null;      // ❌ 删除
  isAuthenticated: boolean;
  rememberMe: boolean;               // ❌ 删除

  login: (response: AuthResponse, rememberMe?: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;  // ❌ 删除
  getAccessToken: () => string | null;   // ❌ 删除
  getRefreshToken: () => string | null;  // ❌ 删除
  // ...
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... 复杂的存储逻辑
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => dynamicStorage),  // ❌ 删除
      }
    )
  )
);
```

#### **改造后**

```typescript
// src/features/auth/stores/auth-store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // ✅ 不再存储 Token

  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

// ✅ 简化：可选择性持久化 user 信息
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,

        login: (user: User) => {
          set({ user, isAuthenticated: true });
        },

        logout: () => {
          set({ user: null, isAuthenticated: false });
        },

        setUser: (user: User) => {
          set({ user });
        },

        clearAuth: () => {
          set({ user: null, isAuthenticated: false });
        },
      }),
      {
        name: 'auth-storage',
        // ✅ 只持久化用户信息（可选）
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// ✅ 删除 Axios 注册逻辑
// ❌ 不再需要：
// registerAuthStore({
//   getAccessToken: () => ...,
//   getRefreshToken: () => ...,
//   setTokens: () => ...,
//   clearAuth: () => ...,
// });
```

---

### 3️⃣ 认证 Hook 改造

#### **当前实现**

```typescript
// src/features/auth/hooks/useAuth.ts
const login = useCallback(
  async (data: LoginRequest) => {
    const response = await authApi.login(data);
    // ❌ 存储 Token
    storeLogin(response, data.remember_me ?? false);
    navigate('/dashboard');
  },
  [storeLogin, navigate]
);
```

#### **改造后**

```typescript
// src/features/auth/hooks/useAuth.ts
const login = useCallback(
  async (data: LoginRequest) => {
    const response = await authApi.login(data);
    // ✅ 只存储用户信息，Token 已在 Cookie 中
    storeLogin(response.user);
    navigate('/dashboard');
  },
  [storeLogin, navigate]
);

const logout = useCallback(async () => {
  try {
    // ✅ 调用后端登出接口，清除 Cookie
    await authApi.logout();
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    // 清除本地状态
    storeLogout();
  }
}, [storeLogout]);
```

---

### 4️⃣ 类型定义更新

#### **当前类型**

```typescript
// src/features/auth/types/auth.types.ts
export interface AuthResponse {
  access_token: string;      // ❌ 删除
  refresh_token: string;     // ❌ 删除
  token_type: 'Bearer';      // ❌ 删除
  expires_in: number;        // ❌ 删除
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;     // ❌ 删除
}
```

#### **改造后**

```typescript
// src/features/auth/types/auth.types.ts
export interface AuthResponse {
  user: User;  // ✅ 只返回用户信息
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;  // ✅ 保留，用于设置 Cookie 过期时间
}

// ✅ RefreshTokenRequest 不再需要
// ❌ 删除整个接口
```

---

### 5️⃣ API 调用更新

#### **当前实现**

```typescript
// src/features/auth/api/auth-api.ts
export const refreshToken = async (data: RefreshTokenRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<APIResponse<AuthResponse>>('/auth/refresh', data);
  return response.data.data;
};
```

#### **改造后**

```typescript
// src/features/auth/api/auth-api.ts
export const refreshToken = async (): Promise<void> => {
  // ✅ 不需要传递 refresh_token，Cookie 自动携带
  await apiClient.post<APIResponse>('/auth/refresh');
  // ✅ 后端会更新 Cookie，前端无需处理响应
};
```

---

### 6️⃣ 登录页面更新

#### **当前实现**

```typescript
// src/pages/LoginPage.tsx
const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data);
    showSuccess('登录成功！');
  } catch (err) {
    // ...
  }
};
```

#### **改造后**

```typescript
// src/pages/LoginPage.tsx
const onSubmit = async (data: LoginFormData) => {
  try {
    // ✅ remember_me 会传递给后端，影响 Cookie 过期时间
    await login({
      email: data.email,
      password: data.password,
      remember_me: data.rememberMe,
    });
    showSuccess('登录成功！');
  } catch (err) {
    // ...
  }
};
```

---

### 7️⃣ Axios 拦截器更新（处理 Token 刷新）

```typescript
// src/shared/lib/axios.ts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ✅ 调用刷新接口（Cookie 自动携带）
        await apiClient.post('/auth/refresh');

        // 刷新成功，处理队列
        processQueue(null);
        isRefreshing = false;

        // 重试原请求
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除认证状态
        processQueue(new Error('Token 刷新失败'));
        isRefreshing = false;

        useAuthStore.getState().clearAuth();
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 安全加固

### 1️⃣ CSRF 防护（推荐）

Cookie 方案需要防范 CSRF 攻击。

#### **后端：生成 CSRF Token**

```go
import "github.com/gin-contrib/csrf"

func SetupRouter() *gin.Engine {
    router := gin.Default()

    // 启用 CSRF 中间件
    router.Use(csrf.Middleware(csrf.Options{
        Secret: "your-csrf-secret-key",
        ErrorFunc: func(c *gin.Context) {
            c.JSON(403, gin.H{"error": "CSRF Token 无效"})
            c.Abort()
        },
    }))

    // 提供获取 CSRF Token 的接口
    router.GET("/auth/csrf-token", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "csrf_token": csrf.GetToken(c),
        })
    })

    return router
}
```

#### **前端：携带 CSRF Token**

```typescript
// 登录前获取 CSRF Token
const response = await apiClient.get('/auth/csrf-token');
const csrfToken = response.data.csrf_token;

// 所有 POST/PUT/DELETE 请求携带 CSRF Token
apiClient.interceptors.request.use((config) => {
  if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

---

### 2️⃣ Cookie 属性配置

| 属性 | 说明 | 推荐设置 |
|------|------|---------|
| **HttpOnly** | 禁止 JS 访问 | `true`（必须） |
| **Secure** | 仅 HTTPS 传输 | `true`（生产环境必须） |
| **SameSite** | 防 CSRF | `Lax` 或 `Strict` |
| **Domain** | Cookie 作用域 | 留空（当前域名） |
| **Path** | Cookie 作用路径 | `/` |

**Go 完整示例**：

```go
http.SetCookie(w, &http.Cookie{
    Name:     "access_token",
    Value:    accessToken,
    Path:     "/",
    Domain:   "",              // 留空 = 当前域名
    MaxAge:   3600,
    Secure:   true,            // 生产环境必须
    HttpOnly: true,            // 必须
    SameSite: http.SameSiteLaxMode,  // 防 CSRF
})
```

---

### 3️⃣ 本地开发环境配置

本地开发时，`Secure: true` 会导致 Cookie 无法设置（HTTP 不支持）。

**解决方案**：

```go
// 根据环境动态设置
secure := os.Getenv("ENV") == "production"

c.SetCookie(
    "access_token",
    accessToken,
    3600,
    "/",
    "",
    secure,  // 生产环境 true，本地开发 false
    true,
)
```

---

## 测试要点

### 后端测试

#### 1. 登录接口测试

```bash
# 登录请求
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","remember_me":true}' \
  -c cookies.txt \
  -v

# 检查响应头是否包含 Set-Cookie
# Set-Cookie: access_token=eyJhbGc...; Path=/; HttpOnly; Secure
# Set-Cookie: refresh_token=eyJhbGc...; Path=/; HttpOnly; Secure; Max-Age=2592000
```

#### 2. 认证接口测试

```bash
# 使用 Cookie 访问受保护接口
curl -X GET http://localhost:8080/api/protected \
  -b cookies.txt \
  -v

# 应返回 200 OK
```

#### 3. 登出测试

```bash
# 登出
curl -X POST http://localhost:8080/auth/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v

# 检查响应头是否清除了 Cookie
# Set-Cookie: access_token=; Max-Age=0
# Set-Cookie: refresh_token=; Max-Age=0
```

---

### 前端测试

#### 1. 浏览器开发者工具检查

1. **登录后检查 Cookie**：
   - F12 → Application → Cookies
   - 确认存在 `access_token` 和 `refresh_token`
   - 确认 `HttpOnly` 和 `Secure` 标记

2. **尝试用 JS 读取 Cookie**：
   ```javascript
   document.cookie  // 应该看不到 HttpOnly Cookie
   ```

3. **检查网络请求**：
   - F12 → Network
   - 查看请求头是否自动携带 `Cookie: access_token=...`

#### 2. 功能测试

- ✅ 勾选"记住我"登录，关闭浏览器后重新打开，验证是否保持登录
- ✅ 不勾选"记住我"登录，关闭浏览器后重新打开，验证是否需要重新登录
- ✅ Token 过期后，自动刷新是否正常工作
- ✅ 登出后，Cookie 是否被清除

---

## 迁移步骤

### 阶段 1：后端改造（1-2 天）

1. ✅ 修改登录接口，返回 Cookie
2. ✅ 修改认证中间件，从 Cookie 读取 Token
3. ✅ 修改刷新 Token 接口
4. ✅ 修改登出接口
5. ✅ 更新 CORS 配置
6. ✅ 本地测试（使用 Postman 或 curl）

### 阶段 2：前端改造（1 天）

1. ✅ 更新 Axios 配置（`withCredentials: true`）
2. ✅ 简化 Auth Store（删除 Token 存储）
3. ✅ 更新类型定义
4. ✅ 更新 API 调用
5. ✅ 本地联调测试

### 阶段 3：测试与部署（1 天）

1. ✅ 集成测试
2. ✅ 安全测试（XSS、CSRF）
3. ✅ 部署到测试环境
4. ✅ 生产环境部署

---

## 常见问题

### Q1：本地开发时 Cookie 无法设置？

**原因**：`Secure: true` 要求 HTTPS，但本地开发通常是 HTTP。

**解决**：
```go
secure := os.Getenv("ENV") == "production"
c.SetCookie("access_token", token, 3600, "/", "", secure, true)
```

---

### Q2：跨域请求无法携带 Cookie？

**原因**：
1. 后端未设置 `AllowCredentials: true`
2. 前端未设置 `withCredentials: true`

**解决**：
```go
// 后端
AllowCredentials: true
```
```typescript
// 前端
withCredentials: true
```

---

### Q3：Cookie 大小限制？

**限制**：单个 Cookie 最大 4KB。

**解决**：JWT Token 通常在 1-2KB 以内，无需担心。如果 Token 过大：
- 减少 JWT Payload 内容
- 使用 Session ID 方案（后端存储会话）

---

### Q4：如何防止 CSRF 攻击？

**方案 1**：SameSite Cookie
```go
SameSite: http.SameSiteLaxMode
```

**方案 2**：CSRF Token
```go
// 后端生成 CSRF Token，前端每次请求携带
X-CSRF-Token: <token>
```

**方案 3**：自定义请求头
```typescript
// 恶意网站无法设置自定义 Header
headers: {
  'X-Requested-With': 'XMLHttpRequest',
}
```

---

### Q5：OAuth 登录如何处理？

**问题**：OAuth 回调在浏览器窗口跳转，Cookie 可能无法设置。

**解决**：
```go
// 后端回调接口
func OAuthCallbackHandler(c *gin.Context) {
    // 验证授权码
    // ...

    // 设置 Cookie
    c.SetCookie("access_token", token, 3600, "/", "", true, true)

    // 重定向到前端
    c.Redirect(302, "http://localhost:5173/oauth-callback?success=true")
}
```

---

## 总结

### 改造收益

✅ **安全性提升**：防 XSS 攻击
✅ **代码简化**：减少前端存储管理代码
✅ **用户体验**：浏览器自动处理 Cookie

### 改造成本

⚠️ **后端改动**：登录、认证、刷新、登出接口
⚠️ **前端改动**：Axios 配置、Auth Store、类型定义
⚠️ **测试工作**：安全测试、功能测试

### 推荐时机

- ✅ 新项目：直接采用 Cookie 方案
- ⚠️ 老项目：评估改造成本，可考虑渐进式迁移

---

**文档版本**：1.0
**更新日期**：2025-11-11
**作者**：Claude Code
