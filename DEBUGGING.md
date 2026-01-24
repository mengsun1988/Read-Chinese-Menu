# 🔧 EdgeOne 部署调试指南

## ❌ 遇到 500 错误？

如果看到 `Failed to load resource: the server responded with a status of 500` 错误，请按以下步骤调试：

---

## 📋 检查清单

### 1️⃣ 验证 EdgeOne 环境变量设置（最重要！）

在 **EdgeOne 函数管理控制台** 中：

```
步骤：
1. 进入函数管理 → 选择你的函数
2. 点击"配置" → "环境变量"
3. 确保有以下设置：
   
   变量名: GEMINI_API_KEY
   变量值: 你的实际 API Key (从 https://aistudio.google.com/app/apikeys 获取)
   
4. 保存并 **重新部署函数**
5. 等待 1-2 分钟环境变量生效
```

**关键点：**
- ✅ 变量名必须是 `GEMINI_API_KEY`（不是 `VITE_GEMINI_API_KEY`）
- ✅ 变量值是你的完整 API Key（没有引号）
- ✅ 部署后要等待一段时间生效

### 2️⃣ 验证 API Key 的有效性

- ✅ 访问 https://aistudio.google.com/app/apikeys
- ✅ 确认 API Key 仍然有效（未过期或被禁用）
- ✅ 确认你的 Google Cloud 项目有启用 Generative Language API
- ✅ 确认账户有配额剩余（检查使用情况）

### 3️⃣ 查看 EdgeOne 函数日志

1. 进入 EdgeOne 控制台
2. 找到你的函数 `/api/gemini`
3. 查看 **实时日志** 或 **执行日志**
4. 寻找以下日志信息：

```
✓ 成功情况：
[Gemini API] Request received
[Env Debug] ✓ Found in context.env.GEMINI_API_KEY
[Gemini API] API Key status: ✓ Found (length: XXX)
[Gemini Call] Response status: 200
[Gemini API] Success, returned 3 items

✗ 失败情况：
[Env Debug] context.env keys: ...（检查是否包含 GEMINI_API_KEY）
[Gemini API] API Key status: ✗ Not found in any source
```

---

## 🐛 常见错误和解决方案

### **错误 1: API Key status: ✗ Not found in any source**

**原因:** EdgeOne 中未设置 `GEMINI_API_KEY` 环境变量

**解决方案:**
```
1. 进入 EdgeOne 控制台
2. 函数配置 → 环境变量
3. 添加: GEMINI_API_KEY = 你的 API Key
4. 保存并重新部署
5. 等待 1-2 分钟
6. 重新测试上传菜单图片
```

### **错误 2: API Key status: ✓ Found 但还是 500**

**可能原因:** API Key 有效但 Gemini API 调用失败

**检查步骤:**
```
在日志中查找：
- [Gemini Call] Response status: ??? (应该是 200)
- [Gemini API Error] 401/403 → API Key 无效或权限不足
- [Gemini API Error] 400 → 请求格式错误
- [Gemini API Error] 429 → 配额用尽，请等待
```

**解决方案:**
- 如果是 401/403：重新复制 API Key，确保没有多余空格
- 如果是 400：尝试用不同的菜单图片
- 如果是 429：等待一段时间或提升配额

### **错误 3: Could not extract JSON from Gemini response**

**原因:** Gemini API 返回的内容不符合期望的 JSON 格式

**解决方案:**
```
1. 尝试用更清晰的菜单图片
2. 确保图片中包含清晰的文字内容
3. 检查日志中 [Gemini Response] 显示的响应长度
```

### **错误 4: Invalid image data: too short or empty**

**原因:** 上传的图片太小或格式不正确

**解决方案:**
```
1. 确保上传的是真实图片文件（JPG、PNG）
2. 图片大小至少 50KB
3. 在本地浏览器测试，查看console是否有其他错误
```

---

## 🔄 完整的调试流程

如果上述简单检查都没问题，按照以下流程深入调试：

### 第 1 步：验证环境变量确实存在
查看 EdgeOne 日志中的这一行：
```
[Env Debug] context.env keys: GEMINI_API_KEY, ...
```
如果 `GEMINI_API_KEY` 不在列表中，说明环境变量未正确设置。

### 第 2 步：验证 API Key 格式
查看日志中：
```
[Gemini API] API Key status: ✓ Found (length: 39)
```
一个有效的 Gemini API Key 长度通常在 30-50 之间。如果长度异常，说明格式错误。

### 第 3 步：验证请求发送成功
查看日志中：
```
[Gemini Call] Sending request to Gemini API
[Gemini Call] Response status: 200
```
如果没有看到这些日志，说明网络请求失败。

### 第 4 步：验证 JSON 解析成功
查看日志中：
```
[Gemini Call] Parse successful
[Gemini API] Success, returned 3 items
```
如果看到这些日志，表示一切正常！

---

## 🌐 网络和跨域问题

EdgeOne 函数调用 Gemini API 不涉及跨域问题（服务器端调用）。

但要确保：
- ✅ EdgeOne 节点能访问 `https://generativelanguage.googleapis.com`
- ✅ 防火墙没有阻止对该域名的请求

---

## 📱 本地开发和测试

### 本地运行 dev 服务器
```bash
npm run dev
```

此时 `/api/gemini` 会使用 Vite dev server 的代理，需要在 `vite.config.ts` 中配置：

```typescript
// vite.config.ts 中添加：
server: {
  proxy: {
    '/api/gemini': {
      target: 'http://localhost:8787', // 本地 wrangler dev 端口
      changeOrigin: true
    }
  }
}
```

或者直接调用本地 edge 函数（如果已安装 wrangler）：
```bash
wrangler dev
```

---

## ✅ 验证部署成功的标志

一旦 edge 函数能正确返回菜肴数据，你应该看到：

1. **浏览器 Network 标签：**
   - `/api/gemini` 请求返回 200 状态码
   - Response 是有效的 JSON 数组

2. **浏览器 Console：**
   - 没有 `w.map is not a function` 错误
   - 菜肴数据正确显示

3. **页面显示：**
   - 上传菜单图片后显示多张菜肴卡片
   - 卡片内容包括中文名、英文名、价格等

---

## 🆘 完全卡住了？

收集以下信息：

1. **截图 EdgeOne 日志** - 从请求开始到错误的完整日志
2. **用户 API Key** - 确认有效性（在浏览器中运行）
3. **测试图片** - 尝试用不同的菜单图片
4. **本地网络** - 确认能访问 `https://generativelanguage.googleapis.com`

然后联系支持或重新检查配置。
