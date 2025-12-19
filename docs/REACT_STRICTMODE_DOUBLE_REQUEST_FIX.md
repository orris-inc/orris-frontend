# React StrictMode 双重请求问题修复

## 📅 修复日期
2025-11-13

## 🐛 问题现象

页面加载时，`GET /nodes` 接口被调用了两次，Network标签显示：
```
nodes?page=1&page_size=20  -  200  -  xhr  -  nodes-api.ts:43  -  1.2 kB  -  68ms
nodes?page=1&page_size=20  -  200  -  xhr  -  nodes-api.ts:43  -  1.2 kB  -  67ms
```

两次请求完全相同，时间几乎一致。

---

## 🔍 根本原因

### React StrictMode 的开发模式行为

应用在 `src/main.tsx` 中使用了 `<StrictMode>`：

```typescript
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**在开发模式下，React StrictMode 会故意双重调用以下内容：**
1. 函数组件
2. `useState` 的初始化函数
3. `useEffect`、`useMemo` 等 hooks
4. class 组件的 `constructor`、`render` 等方法

**目的：** 帮助开发者发现潜在的副作用问题和不纯的代码。

**重要：** 这只在开发环境（development mode）发生，生产环境（production build）不会出现。

---

## ✅ 解决方案

### 方案1：使用 useRef 防止重复调用（推荐）

在 `src/features/nodes/hooks/useNodes.ts` 中添加 ref 标记：

```typescript
import { useEffect, useRef } from 'react';

export const useNodes = () => {
  const { fetchNodes, ... } = useNodesStore();

  // 使用ref防止StrictMode导致的重复调用
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchNodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...
};
```

**原理：**
- `useRef` 创建的值在组件的整个生命周期中保持不变
- 即使 StrictMode 双重调用 useEffect，ref 的值在两次调用间共享
- 第一次调用时 `initialized.current` 为 false，执行 fetchNodes 并设置为 true
- 第二次调用时 `initialized.current` 已经是 true，跳过执行

---

### 方案2：移除 StrictMode（不推荐）

修改 `src/main.tsx`：

```typescript
// ❌ 不推荐
createRoot(rootElement).render(<App />);
```

**缺点：**
- 失去 StrictMode 的检查能力
- 可能隐藏潜在的副作用问题
- 违反 React 最佳实践

---

### 方案3：接受这个行为（可选）

如果双重请求不影响功能，可以保持现状：
- 开发环境会有两次请求
- 生产环境自动恢复为一次请求
- 有助于发现潜在问题

---

## 📊 验证

### 修复前
```
Network 标签：
✓ GET /nodes?page=1&page_size=20  (第1次)
✓ GET /nodes?page=1&page_size=20  (第2次)
```

### 修复后
```
Network 标签：
✓ GET /nodes?page=1&page_size=20  (仅1次)
```

---

## 🎓 关于 React StrictMode

### StrictMode 的好处

1. **识别不安全的生命周期**
   - 检测过时的 API 使用
   - 警告使用废弃的方法

2. **检测副作用**
   - 通过双重调用发现不纯的代码
   - 确保组件可以安全地重新渲染

3. **检测遗留 API**
   - 识别使用字符串 ref
   - 检测过时的 context API

### 为什么双重调用？

React 组件应该是"纯函数"，多次调用应该产生相同结果。StrictMode 通过双重调用来验证这一点：

```typescript
// ✅ 好的做法（纯函数）
function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ❌ 坏的做法（副作用）
let globalCounter = 0;
function Component() {
  globalCounter++; // 每次渲染都修改全局状态
  return <div>{globalCounter}</div>;
}
```

StrictMode 会让第二个例子的问题更明显。

---

## 🔄 相关问题排查

### 如何判断是否是 StrictMode 导致？

1. **检查特征：**
   - 两次请求参数完全相同
   - 时间几乎一致
   - 只在开发环境出现

2. **临时禁用 StrictMode 测试：**
   ```typescript
   // 临时移除 StrictMode
   createRoot(rootElement).render(<App />);
   ```
   如果只有一次请求，确认是 StrictMode 导致。

3. **检查生产构建：**
   ```bash
   npm run build
   npm run preview
   ```
   生产环境应该只有一次请求。

---

## 📁 修改文件

- ✅ `src/features/nodes/hooks/useNodes.ts`
  - 添加 `useRef` import
  - 添加 `initialized` ref
  - 在 useEffect 中添加条件检查

---

## 🎯 最佳实践

### 1. 保留 StrictMode
- 帮助发现潜在问题
- 遵循 React 官方推荐
- 生产环境不受影响

### 2. 使用 ref 防止重复调用
- 只在必要时使用（如 API 调用）
- 不要滥用，可能掩盖真正的问题
- 添加注释说明原因

### 3. 理解双重调用的意义
- 不是 bug，是特性
- 帮助写出更健壮的代码
- 只在开发环境生效

---

## 📚 参考资料

- [React StrictMode 文档](https://react.dev/reference/react/StrictMode)
- [理解 StrictMode 的双重调用](https://react.dev/learn/keeping-components-pure#detecting-impure-calculations-with-strict-mode)

---

## ✅ 总结

1. **问题原因：** React StrictMode 在开发模式下故意双重调用 useEffect
2. **解决方案：** 使用 useRef 添加初始化标记，防止重复执行
3. **最佳实践：** 保留 StrictMode，只在必要时使用 ref 防护
4. **验证结果：** 页面加载时只调用一次 API，开发和生产环境行为一致
