# 完整点数系统方案

## 📊 一、初始状态

### 1.1 新用户初始化
- **初始点数**: `200点`
- **扫描次数**: `0次`
- **分享次数**: `0次` (上限5次)
- **游戏次数**: `0次` (上限5次)
- **Day Pass**: `null` (无)

---

## 💸 二、点数扣除逻辑

### 2.1 菜单识别扣点
- **触发时机**: 用户上传菜单图片进行识别
- **扣除条件**: 
  - ✅ **成功识别** → 扣除 `50点`
  - ❌ **识别失败** → **不扣点**
- **Day Pass期间**: 
  - 如果用户有有效的Day Pass，**不扣点**（unlimited模式）
  - 识别仍然会执行，但不会扣除点数

### 2.2 扣点预检
- **检查时机**: 识别请求发送前
- **检查条件**: `credits < 50` 且 `!isUnlimited`
- **失败处理**: 返回 `403 OUT_OF_CREDITS`，前端自动跳转到 `support-section`

---

## 🎁 三、点数增加逻辑

### 3.1 里程碑奖励（识别奖励）

#### 第4次识别奖励 ⭐ **特殊处理**
- **触发条件**: `scanCount === 4` 且识别成功
- **奖励流程**:
  1. 先扣除 `50点` → 显示 `0点`
  2. **立即**奖励 `50点` → 显示 `50点`
  3. 触发特效 `milestone_4`
- **视觉效果**: 
  - 20个表情符号向上飞（💰🧧✨🎁）
  - 弹出消息："Reward Unlocked! +50 Credits"
  - 动画持续 `3秒`

#### 第10次识别奖励
- **触发条件**: `scanCount === 10` 且识别成功
- **奖励点数**: `+50点`
- **触发特效**: `milestone_10` (目前未实现特效，但会触发)

#### 第20次识别奖励
- **触发条件**: `scanCount === 20` 且识别成功
- **奖励点数**: `+50点`
- **触发特效**: `milestone_20` (目前未实现特效，但会触发)

### 3.2 分享奖励

#### 规则
- **每日限制**: 每天只能分享 `1次`
- **总次数限制**: 总共可以分享 `5次`
- **奖励点数**: 每次 `+50点`
- **触发条件**: 
  - `shareCount < 5`
  - `lastShareDate !== today` (今天未分享)

#### 流程
1. 用户点击分享按钮
2. 触发浏览器原生分享功能
3. 分享成功后，调用 `/api/user-action` (action: 'share')
4. 后端增加 `50点`，更新 `shareCount` 和 `lastShareDate`
5. 返回 `achievementTriggered: "share_bonus"`

#### Day Pass期间特殊处理
- **后台**: 点数正常增加（`credits += 50`）
- **前端显示**: **不更新点数显示**（保持显示 `∞` unlimited）
- **其他字段**: 正常更新 `shareCount` 和 `lastShareDate`

### 3.3 游戏奖励

#### 规则
- **总次数限制**: 总共可以游戏 `5次`
- **奖励点数**: 每次 `+10点`
- **触发条件**: 游戏全对且 `gameWinCount < 5`

#### 流程
1. 用户完成游戏并全对
2. 调用 `handleGameWin()`
3. 调用 `/api/user-action` (action: 'game_win')
4. 后端增加 `10点`，更新 `gameWinCount`
5. 返回 `achievementTriggered: "game_bonus"`

#### Day Pass期间特殊处理
- **后台**: 点数正常增加（`credits += 10`）
- **前端显示**: **不更新点数显示**（保持显示 `∞` unlimited）
- **其他字段**: 正常更新 `gameWinCount`

### 3.4 购买点数包（Support）

#### 三档支持
| 档位 | 价格 | 点数 | 可识别次数 |
|------|------|------|-----------|
| Soda | $2 | +150点 | 3次 |
| Coffee | $5 | +400点 | 8次 |
| Cheesecake | $9 | +1000点 | 20次 |

#### 流程
1. 用户选择档位并完成PayPal支付
2. 前端调用 `/api/verify_order` 验证订单
3. 后端验证PayPal订单状态
4. 成功后增加对应点数
5. 返回更新后的 `userData`

### 3.5 购买Day Pass

#### 三种时长
| 时长 | 价格 | 说明 |
|------|------|------|
| 3-Day Pass | $3.99 | 3天无限识别 |
| 7-Day Pass | $7.99 | 7天无限识别 |
| 15-Day Pass | $15.99 | 15天无限识别 |

#### 流程
1. 用户选择时长并完成PayPal支付
2. 前端调用 `/api/verify_order` 验证订单
3. 后端验证PayPal订单状态
4. 计算过期时间：
   - 如果已有未过期的Pass → 在现有过期时间基础上延长
   - 如果没有Pass → 从当前时间开始计算
5. 设置 `passExpiryDate`
6. 返回更新后的 `userData`

#### Day Pass期间特性
- **识别**: 不扣点（unlimited模式）
- **分享/游戏奖励**: 
  - 后台正常增加点数
  - 前端不显示点数变化（保持 `∞`）
- **过期后**: 自动恢复显示后台实际点数

---

## 🎨 四、点数展示逻辑

### 4.1 显示规则

#### 普通模式（无Day Pass）
- **显示内容**: `{credits} CREDITS`
- **示例**: `150 CREDITS`, `0 CREDITS`
- **颜色状态**:
  - `credits >= 50`: 绿色 (`bg-emerald-600`)
  - `credits < 50`: 红色 + 跳动动画 (`bg-rose-600 animate-bounce`)

#### Unlimited模式（Day Pass有效）
- **显示内容**: `∞` (无限符号)
- **显示条件**: `passExpiryDate && new Date(passExpiryDate) > Date.now()`
- **颜色**: 绿色 (`bg-emerald-600`)
- **副文本**: `{daysLeft}d Premium Active`

### 4.2 点数耗尽处理

#### 自动跳转
- **触发条件**: 
  - `credits <= 0`
  - `!isUnlimited`
  - `scanCount > 0` (至少识别过一次)
- **跳转目标**: `support-section` (优先) 或 `pricing-section` (备选)
- **延迟时间**: `800ms` 后自动滚动

#### 上传拦截
- **检查时机**: 用户点击上传按钮时
- **拦截条件**: `!isUnlimited && credits < 50`
- **处理方式**: 弹出 `PricingModule` 模态框

---

## ✨ 五、动效系统

### 5.1 特效触发机制

#### 触发源
- **监听字段**: `usage.achievementTriggered`
- **触发时机**: 后端返回 `achievementTriggered` 字段时
- **清理时机**: 动画播放完成后（3秒）自动清理

### 5.2 已实现的特效

#### 1. 里程碑奖励 (milestone_4)
- **触发值**: `milestone_4` 或 `milestone_4_reward`
- **视觉效果**:
  - 20个表情符号从底部向上飞（💰🧧✨🎁）
  - 每个表情有随机延迟和旋转
  - 中央弹出消息框："Reward Unlocked! +50 Credits"
- **动画时长**: `3秒`
- **动画类型**: 
  - `coin-fly`: 2秒向上飞
  - `message-pop`: 2.5秒弹出消息

#### 2. 分享奖励 (share_bonus / daily_share_bonus)
- **触发值**: `share_bonus` 或 `daily_share_bonus` (两者都支持)
- **视觉效果**:
  - 中央弹出绿色消息框
  - 显示："⚡ Boosted! +50 Credits"
- **动画时长**: `3秒`
- **状态**: ✅ 已修复，支持两种触发值

#### 3. 游戏奖励 (game_bonus / game_win_reward)
- **触发值**: `game_bonus` 或 `game_win_reward` (两者都支持)
- **视觉效果**:
  - 12个星星从底部向上飞（✨⭐🎊）
  - 中央弹出深色消息框
  - 显示："+10 CREDITS" 和 "Master Mind Bonus"
- **动画时长**: `3秒`
- **状态**: ✅ 已修复，支持两种触发值

#### 4. 里程碑奖励 (milestone_10 / milestone_20)
- **触发值**: `milestone_10` 或 `milestone_20`
- **视觉效果**: 复用 `milestone_4` 的特效
  - 20个表情符号从底部向上飞（💰🧧✨🎁）
  - 中央弹出消息框，显示对应里程碑信息
- **动画时长**: `3秒`
- **状态**: ✅ 已实现，复用 milestone_4 特效

---

## 🔄 六、数据同步机制

### 6.1 同步时机

#### 自动同步
1. **识别成功后**: 后端返回 `usage` 对象，前端调用 `syncWithBackend()`
2. **支付成功后**: PayPal验证成功，后端返回 `userData`，前端调用 `syncWithBackend()`
3. **分享/游戏后**: 后端返回 `userData`，前端调用 `syncWithBackend()` 或特殊处理

### 6.2 Day Pass过期处理

#### 过期检测
- **检测时机**: 每次 `syncWithBackend()` 调用时
- **检测逻辑**:
  ```typescript
  const hadPass = prev.passExpiryDate && new Date(prev.passExpiryDate) > Date.now();
  const hasPassNow = newUsage.passExpiryDate && new Date(newUsage.passExpiryDate) > Date.now();
  
  if (hadPass && !hasPassNow && backendUsage.credits !== undefined) {
    newUsage.credits = backendUsage.credits; // 恢复实际点数
  }
  ```

#### 过期后行为
- **显示**: 从 `∞` 切换为实际点数
- **点数**: 显示后台存储的实际点数（包括Day Pass期间获得的分享/游戏奖励）

---

## 📝 七、数据存储

### 7.1 后端存储 (Cloudflare KV)
- **存储位置**: `env.USER_USAGE`
- **Key**: `userId`
- **数据结构**:
```json
{
  "credits": 200,
  "scanCount": 0,
  "shareCount": 0,
  "gameWinCount": 0,
  "lastShareDate": "2026-01-28",
  "passExpiryDate": "2026-02-04T00:00:00.000Z",
  "lastUsed": "2026-01-28T10:00:00.000Z"
}
```

### 7.2 前端存储 (LocalStorage)
- **存储Key**: `china_menu_usage`
- **数据结构**: 与后端相同
- **同步策略**: 
  - 每次 `usage` 变化时自动保存到 LocalStorage
  - 页面加载时从 LocalStorage 恢复
  - 后端数据优先（`syncWithBackend` 会覆盖本地数据）

---

## ⚠️ 八、已知问题与待修复

### 8.1 特效匹配 ✅ 已修复
- ✅ `share_bonus` 和 `daily_share_bonus` 都支持
- ✅ `game_bonus` 和 `game_win_reward` 都支持
- ✅ `milestone_10` 和 `milestone_20` 复用 `milestone_4` 特效

### 8.3 Day Pass期间点数显示
- ✅ 已实现：Day Pass期间不显示点数变化
- ⚠️ 注意：后台点数正常增加，过期后会显示

---

## 📊 九、点数流转示例

### 示例1: 新用户完整流程
```
初始: 200点
识别1: 200 - 50 = 150点
识别2: 150 - 50 = 100点
识别3: 100 - 50 = 50点
识别4: 50 - 50 = 0点 → 立即 +50 = 50点 (触发milestone_4特效)
识别5: 50 - 50 = 0点
分享1: 0 + 50 = 50点 (触发share_bonus，但特效不匹配)
游戏1: 50 + 10 = 60点 (触发game_bonus，但特效不匹配)
```

### 示例2: Day Pass期间
```
购买7-Day Pass: 设置passExpiryDate
识别: 不扣点 (显示∞)
分享: 后台+50，前端仍显示∞
游戏: 后台+10，前端仍显示∞
过期后: 显示后台实际点数 (包含期间获得的奖励)
```

### 示例3: 购买点数包
```
当前: 0点
购买Coffee ($5): +400点
结果: 400点 (可识别8次)
```

---

## 🎯 十、总结

### 核心规则
1. ✅ 初始200点
2. ✅ 成功识别扣50点，失败不扣
3. ✅ 第4次识别后立即奖励50点（先扣后奖，显示0→50）
4. ✅ 第10、20次识别奖励50点
5. ✅ 分享每天1次，总共5次，每次50点
6. ✅ 游戏总共5次，每次10点
7. ✅ Support三档：$2/150点, $5/400点, $9/1000点
8. ✅ Day Pass：3/7/15天，期间不扣点
9. ✅ Day Pass期间分享/游戏后台加点，前端不显示
10. ✅ Day Pass过期后恢复实际点数

### 展示规则
- 普通模式：显示实际点数
- Unlimited模式：显示 `∞`
- 点数耗尽：自动跳转support section

### 动效规则
- 里程碑奖励：喷发特效
- 分享/游戏奖励：弹出消息（需修复匹配问题）
