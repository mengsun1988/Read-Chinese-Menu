📝 Read Chinese Menu 系统全逻辑技术手册 (修正版)

1\. 基础设施与配置文件 (Infrastructure)



文件名职责关键配置/备注cf-wrangler.tomlCloudflare Worker 部署配置绑定 CARDS\_KV 与 USER\_USAGE 空间worker.js后端核心逻辑实现处理所有 API 请求、AI 调度与点数计算useUserUsage.ts前端状态管理 Hook负责与 Worker 同步数据并持久化至 LocalStorage



2\. 接口与核心业务逻辑 (API \& Logic)

A. 账户初始化与数据同步涉及文件: worker.js -> getUserData()逻辑:新用户首次访问：初始化 credits: 200。每次请求结束：返回最新的 userData 对象给前端。接口: GET /api/survival (获取卡片列表时顺带同步)



B. AI 识别与精准扣费逻辑接口: POST /api/survival/scan (或根路径 /)核心流程:

预检: 检查 credits 是否 $\\ge 50$。

识别: Qwen/Gemini 竞速，获取菜品 JSON。

扣费判定:若 type === "menu" 且识别到菜品 (dishes.length > 0)：执行扣费: credits = credits - 50。累加计数: scanCount = scanCount + 1。若识别失败（如图片模糊、非菜单）：不扣费，点数保持不变。

里程碑奖励:当 scanCount 为 4, 10, 20 时：credits = credits + 50。设置 achievementTriggered = "milestone\_X"。

显示效果:普通成功: 点数即时减少 50。里程碑成功: 点数减少后立刻加回，视觉上表现为点数跳动并触发 EffectLayer.tsx 的全屏金币特效。



C. 动作奖励逻辑

接口: POST /api/user-action

规则:share: credits + 50（每日限 1 次，总上限 5 次）。game\_win: credits + 10（总上限 5 次）。

文件: worker.js 处理逻辑，useUserUsage.ts 负责调用。



D. 支付验证逻辑

接口: POST /api/verify-payment

流程: Worker 校验 PayPal 订单状态 -> 确认 COMPLETED -> 增加点数或更新 passExpiryDate -> 标记订单已处理。



3\. 前端交互与显示效果 (UI/UX)

场景涉及文件显示效果

点数显示DishCard.tsx / TopBar实时显示 usage.credits 数值，随后端返回即时跳变。

识别中ScanningEffect.tsx扫描线动画。

扣费/奖励动画EffectLayer.tsx只有 achievementTriggered 不为空时触发：1. 里程碑: 💰 🧧 向上喷发。2. 分享: ⚡ 能量提示。

点数不足App.tsx (弹窗)拦截识别请求，弹出提示框引导用户分享或购买。



4\. 运维与部署流程 (DevOps)

修改: 在 VS Code 中编辑 worker.js。

部署: 运行 npx wrangler deploy --config cf-wrangler.toml。

存档: 通过 GitHub Desktop 提交 worker.js (后端) 和 useUserUsage.ts (前端) 的代码变动。

