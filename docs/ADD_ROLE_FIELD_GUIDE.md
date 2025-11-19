# 添加用户角色字段完整指南

## 概述

本文档指导如何在Orris系统中添加用户角色（role）字段支持，以实现基于角色的权限控制（RBAC）。

## 🎯 目标

- 在数据库用户表添加`role`字段
- 更新后端User模型包含role字段
- 修改登录API返回role信息
- 为管理员用户设置正确的角色

---

## 📋 第一步：数据库迁移

### 1.1 创建迁移SQL脚本

创建文件：`migrations/add_user_role.sql`

```sql
-- ========================================
-- 添加用户角色字段
-- ========================================

-- 1. 添加role字段到users表
ALTER TABLE users
ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL
COMMENT '用户角色: user=普通用户, admin=管理员, moderator=审核员';

-- 2. 创建索引以提高查询性能
CREATE INDEX idx_users_role ON users(role);

-- 3. 为现有管理员用户设置admin角色
-- 将test@gmail.com设置为管理员
UPDATE users
SET role = 'admin'
WHERE email = 'test@gmail.com';

-- 4. 添加CHECK约束确保角色值有效（可选）
ALTER TABLE users
ADD CONSTRAINT chk_user_role
CHECK (role IN ('user', 'admin', 'moderator'));
```

### 1.2 执行迁移

```bash
# 连接到数据库
mysql -u root -p orris_db < migrations/add_user_role.sql

# 或者使用PostgreSQL
psql -U postgres -d orris_db -f migrations/add_user_role.sql
```

### 1.3 验证迁移

```sql
-- 检查字段是否添加成功
DESC users;
-- 或
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- 检查test@gmail.com的角色
SELECT id, email, role FROM users WHERE email = 'test@gmail.com';
```

---

## 📝 第二步：更新后端代码

### 2.1 更新User模型

文件路径：`internal/domain/models/user.go`

```go
package models

import (
	"time"
)

type User struct {
	ID            uint      `gorm:"primarykey" json:"id"`
	Email         string    `gorm:"uniqueIndex;not null" json:"email"`
	DisplayName   string    `gorm:"column:display_name" json:"display_name"`
	Name          string    `json:"name"`
	Initials      string    `json:"initials"`
	Status        string    `json:"status"`

	// ✅ 新增：用户角色字段
	Role          string    `gorm:"default:user;not null" json:"role"`

	EmailVerified bool      `gorm:"column:email_verified;default:false" json:"email_verified"`
	OAuthProvider string    `gorm:"column:oauth_provider" json:"oauth_provider,omitempty"`
	PasswordHash  string    `gorm:"column:password_hash" json:"-"`

	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// UserRole 常量定义
const (
	RoleUser      = "user"      // 普通用户
	RoleAdmin     = "admin"     // 管理员
	RoleModerator = "moderator" // 审核员
)

// IsAdmin 检查用户是否为管理员
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// HasRole 检查用户是否拥有指定角色
func (u *User) HasRole(role string) bool {
	return u.Role == role
}
```

### 2.2 更新UserResponse DTO

文件路径：`internal/application/user/dto/user_response.go`

```go
package dto

import (
	"time"
	"orris/internal/domain/models"
)

type UserResponse struct {
	ID          uint      `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	Name        string    `json:"name"`
	Initials    string    `json:"initials"`
	Status      string    `json:"status"`

	// ✅ 新增：角色字段
	Role        string    `json:"role"`

	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Metadata    *UserMetadata `json:"metadata,omitempty"`
}

// FromModel 从User模型转换
func (r *UserResponse) FromModel(user *models.User) *UserResponse {
	return &UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Name:        user.Name,
		Initials:    user.Initials,
		Status:      user.Status,
		Role:        user.Role, // ✅ 添加role字段映射
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}
```

### 2.3 更新AuthResponse

文件路径：`internal/interfaces/http/handlers/auth_handler.go`

确保登录响应包含完整的用户信息（含role）：

```go
type AuthResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	TokenType    string        `json:"token_type"`
	ExpiresIn    int64         `json:"expires_in"`
	User         *dto.UserResponse `json:"user"` // ✅ 确保使用完整的UserResponse
}
```

### 2.4 更新Swagger文档

在 `swagger` 注释中添加role字段：

```go
// @Description 用户信息
type UserResponse struct {
	ID          uint      `json:"id" example:"1"`
	Email       string    `json:"email" example:"user@example.com"`
	DisplayName string    `json:"display_name" example:"John Doe"`
	Name        string    `json:"name" example:"John Doe"`
	Initials    string    `json:"initials" example:"JD"`
	Status      string    `json:"status" example:"active"`
	// @Description 用户角色: user=普通用户, admin=管理员, moderator=审核员
	Role        string    `json:"role" example:"user" enums:"user,admin,moderator"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
```

---

## 🔒 第三步：权限中间件（可选但推荐）

### 3.1 创建权限中间件

文件路径：`internal/interfaces/http/middleware/permission.go`

```go
package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"orris/internal/domain/models"
)

// RequireRole 要求用户拥有指定角色
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从context获取用户信息（假设已通过AuthMiddleware设置）
		userInterface, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
			c.Abort()
			return
		}

		user, ok := userInterface.(*models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "用户信息格式错误"})
			c.Abort()
			return
		}

		// 检查用户角色是否在允许列表中
		for _, role := range roles {
			if user.Role == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
		c.Abort()
	}
}

// RequireAdmin 要求管理员权限
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}
```

### 3.2 使用权限中间件

文件路径：`internal/interfaces/http/routes/routes.go`

```go
func SetupRoutes(r *gin.Engine, handler *handlers.Handler) {
	api := r.Group("/api")
	{
		// 公开路由
		auth := api.Group("/auth")
		{
			auth.POST("/login", handler.Login)
			auth.POST("/register", handler.Register)
		}

		// 需要登录的路由
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/user/profile", handler.GetProfile)
		}

		// ✅ 需要管理员权限的路由
		admin := api.Group("/subscription-plans")
		admin.Use(middleware.AuthMiddleware(), middleware.RequireAdmin())
		{
			admin.POST("", handler.CreatePlan)
			admin.PUT("/:id", handler.UpdatePlan)
			admin.DELETE("/:id", handler.DeletePlan)
		}
	}
}
```

---

## 🧪 第四步：测试验证

### 4.1 测试数据库

```sql
-- 查看所有用户的角色
SELECT id, email, role, created_at FROM users;

-- 验证约束
INSERT INTO users (email, role) VALUES ('test2@example.com', 'invalid_role');
-- 应该失败（如果添加了CHECK约束）
```

### 4.2 测试登录API

```bash
# 登录并检查返回的用户数据
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "Dajidali@1"
  }' | jq '.user.role'

# 期望输出: "admin"
```

### 4.3 测试权限控制

```bash
# 使用普通用户token访问管理端API（应该失败）
curl -X POST http://localhost:8081/subscription-plans \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
# 期望: 403 Forbidden

# 使用管理员token访问（应该成功）
curl -X POST http://localhost:8081/subscription-plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
# 期望: 200 OK
```

---

## 📚 第五步：更新Swagger文档

```bash
# 重新生成Swagger文档
swag init -g cmd/server/main.go -o docs

# 复制到前端项目
cp docs/swagger.yaml ../orris-frontend/backend/
cp docs/swagger.json ../orris-frontend/backend/
cp docs/docs.go ../orris-frontend/backend/
```

---

## ✅ 验证清单

- [ ] 数据库users表包含role字段
- [ ] test@gmail.com用户的role为'admin'
- [ ] User模型包含Role字段
- [ ] UserResponse DTO包含role字段
- [ ] 登录API返回的user对象包含role字段
- [ ] Swagger文档已更新
- [ ] 前端能正确识别用户角色
- [ ] 管理端导航菜单正确显示
- [ ] 权限中间件正常工作（可选）

---

## 🐛 故障排查

### 问题1：登录后前端仍显示用户端

**检查**：
```javascript
// 在浏览器控制台
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log(auth.state.user.role);
```

**解决**：
- 如果为`undefined`，检查后端API响应
- 如果为`"user"`，检查数据库中的role值
- 清除localStorage并重新登录

### 问题2：数据库迁移失败

**可能原因**：
- 字段已存在：`ALTER TABLE users DROP COLUMN role;` 然后重试
- 权限不足：使用root用户执行
- 语法错误：检查数据库类型（MySQL vs PostgreSQL）

### 问题3：Swagger文档未更新

```bash
# 确保swag已安装
go install github.com/swaggo/swag/cmd/swag@latest

# 重新生成
swag init -g cmd/server/main.go -o docs

# 检查生成的文件
cat docs/swagger.yaml | grep -A 5 "UserResponse"
```

---

## 🎓 最佳实践

1. **使用常量定义角色**
   ```go
   const (
       RoleUser      = "user"
       RoleAdmin     = "admin"
       RoleModerator = "moderator"
   )
   ```

2. **添加数据库约束**
   - NOT NULL约束确保字段不为空
   - DEFAULT值确保旧数据兼容
   - CHECK约束确保值有效

3. **使用枚举类型**（PostgreSQL）
   ```sql
   CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
   ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';
   ```

4. **日志记录**
   ```go
   log.Printf("User %s (role: %s) accessed admin panel", user.Email, user.Role)
   ```

5. **审计追踪**
   ```sql
   CREATE TABLE role_change_log (
       id SERIAL PRIMARY KEY,
       user_id INT NOT NULL,
       old_role VARCHAR(20),
       new_role VARCHAR(20),
       changed_by INT,
       changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

---

## 📖 相关文档

- [前端权限系统文档](./FRONTEND_PERMISSIONS.md)
- [API认证文档](./OAUTH_FRONTEND_INTEGRATION.md)
- [数据库设计文档](./DATABASE_SCHEMA.md)

---

## 🆘 需要帮助？

如果在实施过程中遇到问题：

1. 检查本文档的"故障排查"部分
2. 查看相关日志文件
3. 在项目issue中提问

---

**最后更新**: 2025-11-10
**作者**: Claude Code Assistant
