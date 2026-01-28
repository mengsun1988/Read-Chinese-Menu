# AI Prompt 字段与展示对应关系检查

## 📋 一、字段获取与展示总览

### 1.1 菜单识别阶段（第一步：批量识别）

#### AI Prompt 要求字段
**位置**: `worker.js` 第 116 行

```javascript
"Analyze menu. Return JSON {dishes:[{name_cn, name_en, price, description, pinyin, pronunciation, spiciness_level}]}. JSON ONLY."
```

**获取字段**:
1. ✅ `name_cn` - 中文菜名
2. ✅ `name_en` - 英文菜名
3. ✅ `price` - 价格
4. ✅ `description` - 简介
5. ✅ `pinyin` - 拼音
6. ✅ `pronunciation` - 发音
7. ✅ `spiciness_level` - 辣度等级

#### 前端展示位置

**DishCard 组件** (`components/DishCard.tsx`):
- ✅ `name_cn` (第 21, 72 行) - 显示中文名
- ✅ `name_en` (第 22, 62 行) - 显示英文名
- ✅ `price` (第 34, 64-68 行) - 显示价格
- ✅ `description` (第 90-94 行) - **仅分析后显示**
- ✅ `spiciness_level` (第 23, 102-110 行) - 显示辣度图标
- ⚠️ `ingredients` (第 78-88 行) - **仅分析后显示前3个**，但菜单识别阶段不获取
- ❌ `pinyin` - **未在卡片中显示**
- ❌ `pronunciation` - **未在卡片中显示**

**结论**: 
- ✅ 菜单识别阶段获取的字段都有展示位置
- ⚠️ `pinyin` 和 `pronunciation` 在卡片中不显示，但在详情模态框中显示

---

### 1.2 详情识别阶段（第二步：点击后深度分析）

#### AI Prompt 要求字段
**位置**: `worker.js` 第 115 行

```javascript
`Analyze "${name_cn}". Return JSON: { "ingredients": [{"name_cn": "...", "name_en": "..."}], "spiciness_level": 0-5, "pinyin": "", "pronunciation": "", "allergens": [], "description": "", "has_animal_fats": true/false }.`
```

**获取字段**:
1. ✅ `ingredients` - 食材列表（包含 name_cn 和 name_en）
2. ✅ `spiciness_level` - 辣度等级
3. ✅ `pinyin` - 拼音
4. ✅ `pronunciation` - 发音
5. ✅ `allergens` - 过敏原列表
6. ✅ `description` - 简介
7. ✅ `has_animal_fats` - 是否含动物脂肪

#### 前端展示位置

**DishDetailModal 组件** (`components/DishDetailModal.tsx`):
- ✅ `name_cn` (第 42, 96 行) - 显示中文名
- ✅ `name_en` (第 43, 94 行) - 显示英文名
- ✅ `pinyin` (第 46, 109-112 行) - 显示拼音
- ✅ `pronunciation` (第 47, 114-117 行) - 显示发音
- ✅ `price` (第 50-54, 124-127 行) - 显示价格
- ✅ `description` (第 56, 157-159 行) - 显示简介
- ✅ `ingredients` (第 57, 173-191 行) - 显示食材网格
- ✅ `spiciness_level` (第 75, 196-222 行) - 显示辣度卡片
- ✅ `allergens` (第 229-235 行) - 显示过敏原标签
- ✅ `has_animal_fats` (第 141-146 行) - 显示警告提示

**结论**: 
- ✅ 详情识别阶段获取的所有字段都有完整展示

---

## 🔍 二、字段对应关系详细检查

### 2.1 菜品基本信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `name_cn` | ✅ 菜单识别 | ✅ | ✅ | ✅ | ✅ 完整 |
| `name_en` | ✅ 菜单识别 | ✅ | ✅ | ✅ | ✅ 完整 |
| `price` | ✅ 菜单识别 | ✅ | ✅ | ✅ | ✅ 完整 |

**结论**: ✅ 基本信息字段完整对应

---

### 2.2 语言辅助信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `pinyin` | ✅ 菜单识别 + 详情识别 | ✅ | ❌ 不显示 | ✅ | ⚠️ 卡片中不显示 |
| `pronunciation` | ✅ 菜单识别 + 详情识别 | ✅ | ❌ 不显示 | ✅ | ⚠️ 卡片中不显示 |

**分析**:
- ✅ 菜单识别阶段已获取 `pinyin` 和 `pronunciation`
- ⚠️ 但在 `DishCard` 中不显示（设计选择，避免卡片过于拥挤）
- ✅ 在 `DishDetailModal` 中完整显示

**建议**: 
- 当前设计合理（卡片简洁，详情完整）
- 如需在卡片中显示，可以考虑添加小图标提示

---

### 2.3 菜品描述

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `description` | ✅ 菜单识别 + 详情识别 | ✅ | ✅ (仅分析后) | ✅ | ✅ 完整 |

**分析**:
- ✅ 菜单识别阶段已获取 `description`
- ✅ `DishCard` 中仅在深度分析后显示（避免信息过载）
- ✅ `DishDetailModal` 中完整显示

**结论**: ✅ 描述字段完整对应

---

### 2.4 食材信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `ingredients` | ✅ 详情识别 | ✅ | ✅ (仅分析后，前3个) | ✅ (完整列表) | ✅ 完整 |
| `classic_ingredients` | ❌ 未获取 | ✅ | ❌ | ❌ | ⚠️ 类型定义有但未使用 |
| `potential_ingredients` | ❌ 未获取 | ✅ | ❌ | ❌ | ⚠️ 类型定义有但未使用 |

**分析**:
- ✅ 详情识别阶段获取 `ingredients`（包含 name_cn 和 name_en）
- ✅ `DishCard` 中显示前3个食材（避免卡片过长）
- ✅ `DishDetailModal` 中显示完整食材列表
- ⚠️ 类型定义中有 `classic_ingredients` 和 `potential_ingredients`，但实际未使用

**建议**:
- 当前实现使用统一的 `ingredients` 字段，设计合理
- 如果未来需要区分"主要食材"和"可能食材"，可以考虑使用 `classic_ingredients` 和 `potential_ingredients`

---

### 2.5 辣度信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `spiciness_level` | ✅ 菜单识别 + 详情识别 | ✅ (spiciness) | ✅ | ✅ | ✅ 完整 |

**分析**:
- ✅ 菜单识别阶段已获取 `spiciness_level`
- ✅ 两个组件中都完整显示
- ✅ 类型定义中使用 `spiciness`，代码中兼容 `spiciness_level`

**结论**: ✅ 辣度字段完整对应

---

### 2.6 过敏原信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `allergens` | ✅ 详情识别 | ✅ | ❌ 不显示 | ✅ | ⚠️ 卡片中不显示 |

**分析**:
- ✅ 详情识别阶段获取 `allergens`
- ❌ `DishCard` 中不显示（设计选择，避免卡片过于拥挤）
- ✅ `DishDetailModal` 中完整显示

**建议**:
- 当前设计合理（过敏原信息在详情中更合适）
- 如需在卡片中显示，可以考虑添加过敏原图标提示

---

### 2.7 健康信息

| 字段 | AI Prompt | 类型定义 | DishCard | DishDetailModal | 状态 |
|------|-----------|----------|----------|-----------------|------|
| `has_animal_fats` | ✅ 详情识别 | ✅ | ❌ 不显示 | ✅ | ⚠️ 卡片中不显示 |
| `is_vegetarian` | ❌ 未获取 | ✅ | ❌ | ❌ | ❌ 类型定义有但未使用 |

**分析**:
- ✅ 详情识别阶段获取 `has_animal_fats`
- ✅ `DishDetailModal` 中显示警告提示（红色警告框）
- ❌ `DishCard` 中不显示（设计选择）
- ❌ `is_vegetarian` 在类型定义中存在，但 AI Prompt 未获取，前端也未使用

**建议**:
- ✅ `has_animal_fats` 的展示设计合理（重要信息在详情中突出显示）
- ⚠️ 如果未来需要素食标识，可以在 AI Prompt 中添加 `is_vegetarian` 字段

---

## ⚠️ 三、发现的问题

### 3.1 冗余字段

#### 问题 1: 类型定义中的未使用字段
**位置**: `types.ts` 第 12-13 行

```typescript
classic_ingredients: Ingredient[];
potential_ingredients: Ingredient[];
```

**状态**: 
- ❌ AI Prompt 未获取
- ❌ 前端未使用
- ⚠️ 类型定义中存在

**建议**: 
- 如果未来不需要区分主要食材和可能食材，可以移除
- 或者保留以备未来使用

#### 问题 2: 类型定义中的未使用字段
**位置**: `types.ts` 第 16 行

```typescript
is_vegetarian: boolean;
```

**状态**: 
- ❌ AI Prompt 未获取
- ❌ 前端未使用
- ⚠️ 类型定义中存在

**建议**: 
- 如果未来需要素食标识，可以在 AI Prompt 中添加
- 或者移除未使用的字段

---

### 3.2 缺失字段

#### 问题 1: 菜单识别阶段未获取食材
**当前状态**:
- ✅ 菜单识别阶段获取基本信息（名称、价格、描述、辣度）
- ❌ 菜单识别阶段**未获取**食材信息
- ✅ 详情识别阶段获取完整食材信息

**分析**:
- ✅ 当前设计合理（两步识别：先快速获取基本信息，点击后再深度分析）
- ✅ 避免一次性获取过多信息导致响应慢
- ✅ `DishCard` 中仅在深度分析后显示食材（前3个）

**结论**: ✅ 当前设计合理，无需修改

---

### 3.3 字段命名不一致

#### 问题 1: spiciness vs spiciness_level
**位置**: 
- 类型定义: `spiciness: number`
- AI Prompt: `spiciness_level`
- 代码使用: `spiciness_level` 或 `spiciness`

**状态**: 
- ✅ 代码中已做兼容处理（`dish.spiciness_level || dish.spiciness`）
- ⚠️ 命名不统一

**建议**: 
- 当前兼容处理已足够
- 可以考虑统一命名（但需要修改多处代码）

#### 问题 2: pronunciation vs pronunciation_guide
**位置**: 
- 类型定义: `pronunciation_guide?: string`
- AI Prompt: `pronunciation`
- 代码使用: `pronunciation` 或 `pronunciation_guide`

**状态**: 
- ✅ 代码中已做兼容处理（`dish.pronunciation || dish.sounds_like`）
- ⚠️ 命名不统一

**建议**: 
- 当前兼容处理已足够
- 可以考虑统一命名（但需要修改多处代码）

---

## ✅ 四、总结

### 4.1 完整对应的字段

以下字段在 AI Prompt、类型定义和前端展示中**完全对应**：

1. ✅ `name_cn` - 中文菜名
2. ✅ `name_en` - 英文菜名
3. ✅ `price` - 价格
4. ✅ `description` - 简介
5. ✅ `spiciness_level` - 辣度等级
6. ✅ `ingredients` - 食材列表（详情阶段）
7. ✅ `allergens` - 过敏原列表（详情阶段）
8. ✅ `has_animal_fats` - 是否含动物脂肪（详情阶段）

### 4.2 设计选择（非问题）

以下字段在卡片中不显示，但在详情中显示（**设计选择**）：

1. ⚠️ `pinyin` - 拼音（卡片中不显示，详情中显示）
2. ⚠️ `pronunciation` - 发音（卡片中不显示，详情中显示）
3. ⚠️ `allergens` - 过敏原（卡片中不显示，详情中显示）
4. ⚠️ `has_animal_fats` - 动物脂肪警告（卡片中不显示，详情中显示）

**结论**: ✅ 这些是合理的设计选择，避免卡片信息过载

### 4.3 冗余字段

以下字段在类型定义中存在，但**未使用**：

1. ⚠️ `classic_ingredients` - 主要食材（未使用）
2. ⚠️ `potential_ingredients` - 可能食材（未使用）
3. ⚠️ `is_vegetarian` - 是否素食（未使用）

**建议**: 
- 如果未来不需要，可以移除
- 或者保留以备未来使用

### 4.4 缺失字段

**无缺失字段** - 所有 AI Prompt 获取的字段都有对应的展示位置

---

## 🎯 五、建议

### 5.1 短期建议

1. ✅ **保持当前设计** - 两步识别（快速基本信息 + 深度详情）设计合理
2. ✅ **保持卡片简洁** - 卡片中不显示拼音、发音、过敏原等详细信息是合理的设计选择
3. ⚠️ **考虑清理未使用字段** - 如果确定不需要 `classic_ingredients`、`potential_ingredients`、`is_vegetarian`，可以考虑移除

### 5.2 长期建议

1. 💡 **统一字段命名** - 考虑统一 `spiciness`/`spiciness_level` 和 `pronunciation`/`pronunciation_guide` 的命名
2. 💡 **添加素食标识** - 如果未来需要，可以在 AI Prompt 中添加 `is_vegetarian` 字段
3. 💡 **区分主要食材和可能食材** - 如果未来需要，可以使用 `classic_ingredients` 和 `potential_ingredients`

---

**检查完成时间**: 2026-01-28
**检查范围**: AI Prompt、类型定义、前端展示组件
