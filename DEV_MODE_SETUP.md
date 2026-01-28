# 开发环境免检点数设置

## 📝 说明

为了安全，我们移除了基于 Origin 头的 localhost 检查（防止用户伪造 Origin 头绕过付费系统）。

现在使用**环境变量**来控制开发环境的免检功能，这样更安全，因为环境变量在服务器端，用户无法伪造。

## 🔧 设置方法

### 方法 1: 使用 wrangler.toml（推荐用于本地开发）

编辑 `wrangler2.toml` 文件，在 `[vars]` 部分添加：

```toml
[vars]
ENVIRONMENT = "production"
ENABLE_DEV_MODE = "true"  # 启用开发模式，免检点数
```

### 方法 2: 使用 Cloudflare 控制台（用于开发环境 Worker）

1. 登录 Cloudflare Dashboard
2. 进入你的 Worker 项目
3. 进入 **Settings** -> **Variables**
4. 添加环境变量：
   - **Variable name**: `ENABLE_DEV_MODE`
   - **Value**: `true`
   - **Type**: Plain Text

### 方法 3: 使用 wrangler CLI（临时设置）

```bash
wrangler dev --var ENABLE_DEV_MODE:true
```

## ⚠️ 重要提示

1. **生产环境不要设置此变量** - 确保生产环境 Worker 中 `ENABLE_DEV_MODE` 未设置或为 `false`
2. **仅用于开发** - 此功能仅用于本地开发和测试
3. **安全考虑** - 环境变量在服务器端，用户无法伪造，比 Origin 头检查更安全

## ✅ 验证

设置后，在 localhost 环境下：
- ✅ 不会检查点数
- ✅ 不会扣除点数
- ✅ 识别功能正常工作

## 🔒 安全说明

- **修复前**: 使用 Origin 头检查，用户可以伪造 `Origin: http://localhost:3000` 绕过
- **修复后**: 使用环境变量，只有服务器端可以设置，用户无法伪造

---

**更新时间**: 2026-01-28
