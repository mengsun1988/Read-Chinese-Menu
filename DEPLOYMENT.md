# 🚀 EdgeOne 部署步骤

## 前置准备

- ✅ 有效的 Gemini API Key（从 https://aistudio.google.com/app/apikeys 获取）
- ✅ EdgeOne 账户和项目已创建
- ✅ 项目已构建（`npm run build`）

---

## 第一步：在 EdgeOne 创建函数

### 方式 1：通过 EdgeOne 控制台（推荐）

1. 登录 EdgeOne 控制台
2. 进入 **函数** → **创建函数**
3. 选择 **Web Service** 或 **HTTP 触发器**
4. 函数名称：`read-chinese-menu-api`
5. 路由：`/api/gemini`
6. 运行环境：选择支持 JavaScript/Node.js 的环境

---

## 第二步：配置环境变量

1. 在函数编辑页面，找到 **环境变量** 部分
2. 添加新的环境变量：

```
变量名: GEMINI_API_KEY
变量值: 你的_实际_API_Key
```

**注意：**
- 不要添加引号
- 不要添加任何前缀
- 复制粘贴时确保没有多余的空格

3. 点击 **保存**

---

## 第三步：上传函数代码

### 方式 1：复制粘贴（快速）

1. 打开 [edge-functions/api/gemini.js](edge-functions/api/gemini.js)
2. 复制整个文件内容
3. 在 EdgeOne 控制台的函数编辑器中粘贴
4. 保存

### 方式 2：使用 CLI（推荐用于生产环境）

如果 EdgeOne 支持 wrangler CLI：

```bash
# 1. 安装 wrangler（如果还没有）
npm install -g wrangler

# 2. 登录你的 EdgeOne 账户
wrangler login

# 3. 发布函数
wrangler publish

# 或如果使用其他 CLI 工具
# edgeone-cli deploy
```

---

## 第四步：部署和测试

1. **重新部署函数**
   - 在 EdgeOne 控制台中点击 **部署** 或 **发布**
   - 等待部署完成（通常需要 30 秒 - 2 分钟）

2. **验证环境变量生效**
   - 等待 1-2 分钟让环境变量在边缘节点传播
   - 查看函数日志中是否有新的日志输出

3. **测试 API 端点**
   - 在浏览器中打开你的应用
   - 尝试上传一张菜单图片
   - 观察浏览器 Console 和 EdgeOne 函数日志

---

## 第五步：验证和排查

### 查看实时日志

1. 进入 EdgeOne 控制台 → 函数 → 你的函数
2. 找到 **日志** 或 **监控** 标签
3. 上传菜单图片后，实时查看日志输出

### 预期的成功日志

```
[Gemini API] Request received
[Env Debug] context.env keys: GEMINI_API_KEY, ...
[Env Debug] ✓ Found in context.env.GEMINI_API_KEY
[Gemini API] API Key status: ✓ Found (length: 39)
[Gemini API] Request params: { type: "menu", imageLength: 125000 }
[Gemini Call] Sending request to Gemini API
[Gemini Call] Response status: 200
[Gemini Response] Length: 2456
[Gemini Call] Parse successful
[Gemini API] Success, returned 3 items
```

如果看到这些日志，恭喜！API 配置成功！

### 常见问题排查

#### 问题：看到 `✗ Not found in any source`

```
[Gemini API] API Key status: ✗ Not found in any source
```

**解决方案：**
- 检查环境变量名称是否正确：`GEMINI_API_KEY`（大小写敏感）
- 确认已保存并重新部署
- 等待 2 分钟让环境变量在全球边缘节点同步
- 尝试手动重启函数或重新部署一次

#### 问题：看到 `Response status: 401` 或 `403`

```
[Gemini API Error] Status: 401
```

**解决方案：**
- API Key 无效或过期
- 重新从 https://aistudio.google.com/app/apikeys 复制 API Key
- 在 Google Cloud 控制台确认项目已启用 Generative Language API
- 确认账户有足够的配额

#### 问题：看到 `Response status: 429`

```
[Gemini API Error] Status: 429
```

**解决方案：**
- 请求频率过高或配额用尽
- 等待一段时间后重试
- 在 Google Cloud 控制台增加配额限制

#### 问题：看到 `Could not extract JSON from Gemini response`

```
[JSON Parse Error] Could not find JSON in response
```

**解决方案：**
- 尝试上传更清晰的菜单图片
- 确保图片中有清晰的文字内容
- 尝试用 JPG 或 PNG 格式
- 检查图片大小是否过小（< 10KB）

---

## 📝 完整的部署清单

- [ ] 从 https://aistudio.google.com/app/apikeys 获取有效的 API Key
- [ ] 在 EdgeOne 中创建函数（路由：`/api/gemini`）
- [ ] 上传 [edge-functions/api/gemini.js](edge-functions/api/gemini.js) 的代码
- [ ] 配置环境变量 `GEMINI_API_KEY` = 你的 API Key
- [ ] 保存并重新部署函数
- [ ] 等待 1-2 分钟环境变量生效
- [ ] 在浏览器中测试上传菜单图片
- [ ] 检查 EdgeOne 函数日志确认 API Key 被找到
- [ ] 验证返回的数据格式正确（JSON 数组）
- [ ] 页面显示菜肴卡片无错误

---

## 🔗 有用的链接

- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)
- [EdgeOne 文档](https://www.edgeone.ai/)
- [获取 API Key](https://aistudio.google.com/app/apikeys)
- [Google Cloud 控制台](https://console.cloud.google.com/)

---

## 🆘 仍有问题？

1. 查看 [DEBUGGING.md](DEBUGGING.md) 获得更详细的排查步骤
2. 检查 EdgeOne 函数的完整日志（可能被截断）
3. 尝试用不同的菜单图片测试
4. 确保浏览器已清除缓存（Ctrl+Shift+Delete）
5. 检查网络选项卡确认 `/api/gemini` 请求的完整响应

---

## ✅ 成功标志

部署成功时，你应该能够：
- 📱 在手机或浏览器上打开网站
- 🖼️ 选择并上传菜单图片
- ⏳ 等待 2-5 秒处理时间
- 🍜 看到识别出的菜肴列表和详细信息
- 💬 点击菜肴卡片查看完整的营养和过敏信息
