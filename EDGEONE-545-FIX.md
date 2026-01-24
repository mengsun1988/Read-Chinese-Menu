# 🔧 545 错误诊断指南

## 什么是 545 错误？

**545 是一个非标准的 HTTP 状态码**，不属于官方 HTTP 规范。在你的情况下，这可能意味着：

### 可能的原因

| 原因 | 症状 | 解决方案 |
|------|------|--------|
| **函数超时** | 请求需要 > 30 秒 | 优化代码，减少 API 等待时间 |
| **网络连接中断** | 無法連接到 Gemini API | 檢查防火牆，重試 |
| **环境变量未设置** | Gemini API Key 为空 | 在 EdgeOne 中设置 GEMINI_API_KEY |
| **请求体过大** | base64 编码的图片太大 | 压缩图片或分片上传 |
| **函数资源不足** | 内存或 CPU 限制 | 增加函数资源配置 |
| **EdgeOne 特定错误** | 平台特有的限制 | 查阅平台文档 |

---

## 🔍 逐步诊断

### 第 1 步：检查是否是网络问题

**在浏览器 Console 中运行：**
```javascript
// 测试能否连接到 Gemini API
fetch('https://generativelanguage.googleapis.com/', {mode: 'no-cors'})
  .then(r => console.log('✓ Can reach Gemini API'))
  .catch(e => console.log('✗ Cannot reach:', e.message))
```

如果能连接，问题可能不在网络层。

### 第 2 步：测试 Mock 版本

使用 [edge-functions/api/gemini-test.js](../edge-functions/api/gemini-test.js)：

1. 将其代码复制到 EdgeOne 函数编辑器
2. 部署
3. 重新上传菜单图片
4. **如果成功显示 2 个菜肴** → 基本流程正常，问题在 Gemini 集成
5. **如果仍然 545 错误** → 问题在 EdgeOne 配置或网络

### 第 3 步：查看 EdgeOne 函数日志

如果有日志功能，查看是否有以下信息：

**正常情况：**
```
[Test API] Request received
[Test API] Request type: menu
[Test API] Image length: 125000
[Test API] Returning mock menu data
```

**出错情况：**
```
[Test API] Error: <具体错误信息>
```

---

## 💡 快速解决方案

### 方案 1：简化请求（最快）

如果 mock 版本失败，可能是上传的图片太大。在浏览器 Console 中尝试：

```javascript
// 检查上传的 base64 大小
const base64 = "你上传的_base64_数据";
console.log("Base64 size:", base64.length, "bytes");
console.log("Estimated image size:", Math.round(base64.length * 0.75 / 1024), "KB");

// 如果超过 5MB，尝试压缩
```

### 方案 2：增加函数超时时间

在 EdgeOne 中：
1. 找到函数配置
2. 增加 "超时时间" 或 "Timeout" 到 60 秒以上
3. 重新部署

### 方案 3：检查环境变量

在 EdgeOne 函数代码中临时添加调试：

```javascript
export async function onRequestPost(context) {
  console.log("Environment variables:");
  console.log("GEMINI_API_KEY:", context.env?.GEMINI_API_KEY ? "✓ Set" : "✗ Missing");
  // ... 其他代码
}
```

---

## 📊 对比测试

### 测试清单

| 测试项 | 预期结果 | 实际结果 | 备注 |
|--------|---------|---------|------|
| Mock 版本 | 200 + 2 菜肴 | | |
| 完整版本（有 API Key） | 200 + 识别结果 | | |
| 完整版本（无 API Key） | 400 错误 | | |
| 大图片上传 | 取决于超时配置 | | |
| 小图片上传 | 应该工作 | | |

---

## 🆘 如果还是不行

请收集以下信息：

1. **尝试 mock 版本的结果**
   - 成功还是失败？
   - 返回什么状态码？

2. **EdgeOne 日志内容**
   - 是否有 `[Test API]` 或 `[Gemini API]` 开头的日志？
   - 有什么错误信息？

3. **浏览器 Console 错误**
   - 完整的错误消息
   - 堆栈跟踪信息

4. **上传的图片信息**
   - 文件大小多少？
   - 什么格式（JPG、PNG）？
   - 分辨率多少？

5. **EdgeOne 平台信息**
   - 你使用的 EdgeOne 具体是哪个平台？
   - 函数的内存和超时配置是多少？

有了这些信息，我可以更精确地帮助你！
