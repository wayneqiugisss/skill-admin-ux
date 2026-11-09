# 共用 Tab / 抽屉的「档案（profile）+ 适配器」规范 — shared-tab-profile-rule.md

当**两个业务模块的 Tab 页或抽屉高度相似**（如「编辑商品」与「编辑订单确认分组」）时，**不要复制副本**，用本规范做共用：
一套业务组件 + 每个模块一份「档案」，差异只允许落在 **键名映射** 与 **显示/文案** 两层。

判定依据：两边的差异只有两类 —— ①显示与文案（少几个字段、少一列、提示不同）；②数据模型键名（`type` vs `componentType`）。
若差异属于「业务逻辑不同」，说明不该共用，拆开写。

---

## 1. 三层结构（强制）

| 层 | 职责 | 实例 |
|---|---|---|
| **L1 业务组件（一套）** | 承载业务逻辑与交互，不含模块口径 | `BaseInfoTab` / `DynamicFieldTab` / `ServiceStructureTab` / `PricingTab` / `DynamicFieldDialog` / `PricingRuleDialog` / `QuoteJudgementDialog` |
| **L2 档案 profile（每模块一份，纯配置）** | 只描述「显示哪些 / 叫什么 / 键怎么映射」 | `PRODUCT`（商品，默认）与 `ORDER_GROUP`（订单确认分组） |
| **L3 薄入口页（每模块一个）** | 标题 / 宽度 / 加载 / 保存 / 组装 payload | `ProductFormDialog.vue`、`order/save.vue` |

> **禁止**把差异写成 `v-if="module === 'x'"` 散落在业务逻辑里；差异必须收敛到「档案对象」或「组件 props」。

---

## 2. 零回归红线（最重要）

1. **L1 组件的 props 默认值必须等于原模块现状** —— 新模块传档案，原模块不传即行为不变。
2. **改动 L1 后必须回归原模块** —— 至少覆盖：动态字段新建/配置、服务结构增删拖拽、计价规则/判定弹窗打开+提交。
3. **不改键名就加适配器，改键名就去改数据** —— 优先把两个模块的模型对齐（原型/早期阶段成本最低），键名对齐后适配器应主动变少；长期保留大量适配键说明对齐没做完。
4. **`data()` 阶段禁止读 computed**（真实踩坑）—— 组件里常写 `data() { return { form: this.createEmpty() } }`，而 `createEmpty()` 里读 `this.adapter`（computed）会在 `data()` 时崩溃（`Cannot read properties of undefined`）。`createEmpty()` 内必须直接合并 prop：`const a = Object.assign({}, DEFAULT_MODEL, this.model || {})`。
5. **「整体键」与「拆分键」同名时要防覆盖**（真实踩坑）—— 条件存储适配 `whenKey`（manage 拆成 `logic` + `conditions`；其它模块整体存 `conditions`）时，写回后不能无脑 `delete payload.conditions`，否则会把刚写入的同名键删掉。正确写法：
   ```js
   if (a.whenKey) {
       payload[a.whenKey] = when;
       if (a.whenKey !== 'logic') delete payload.logic;
       if (a.whenKey !== 'conditions') delete payload.conditions;
   } else { payload.logic = when.logic; payload.conditions = when.conditions; }
   ```

---

## 3. 已建立的档案键（可直接复用）

### 3.1 四个 Tab 组件的 profile props

| 组件 | props | 作用 |
|---|---|---|
| `BaseInfoTab` | `variant`（`product` 默认 / `group`）、`productTypes` | 同一套组件承载两套元信息；非默认档案渲染自己的表单体，`setData/getData/validate/rules` 按档案分支 |
| `DynamicFieldTab` | `fieldModel`（转发给字段抽屉）、`texts`（列名/按钮/空态）、`showScope` | 字段列表口径（如「属性名称」→「字段名称」）与列开关 |
| `ServiceStructureTab` | `showParams` | 是否显示「对应参数」 |
| `PricingTab` | `ruleModel`、`judgementModel`、`#judge-extra` 插槽 | 规则/判定弹窗的模型适配与「模块特有表单项」透传（两级透传：页面 → PricingTab → 弹窗 `#extra`） |

### 3.2 三个弹窗/抽屉的 `model` 适配键

| 组件 | 适配键 | 说明 |
|---|---|---|
| `DynamicFieldDialog` | `typeKey` / `tipKey` / `showWhenKey` / `requiredWhenKey` / `optionValueKey` / `optionValueEditable` / `optionDescription` / `booleanAsString` / `defaultType` / `defaultScope` / `componentTypes` / `scopeOptions` / `toConditionField` / `texts` | 字段模型差异（类型键、取值键、条件键、文案、类型清单、选项是否手工录入…） |
| `PricingRuleDialog` | `methodOptions` / `defaultMethod` / `basisOptions` / `defaultBasis` / `whenKey` / `allowFormula` / `texts` | 计价方式与口径选项、条件键、是否启用公式 |
| `QuoteJudgementDialog` | `whenKey` / `defaults` / `texts` + `#extra` 插槽 | 判定条件键、模块特有属性默认值与表单项 |

### 3.3 会话级共用清单（示例：订单确认分组复用商品）

- **Tab**：基础信息 / 动态字段 / 服务结构 / 计价配置 —— 与「编辑商品」同构，入口页也照抄 `el-drawer(75%) > el-container > el-main.nopadding > el-tabs + #footer`
  > 此处 `nopadding` 是**有意为之**，不违反 `drawer-layout-rule.md` §3：该 `el-main` 承载的是 `el-tabs`，各 Tab 内的表单自带 `.drawer-form` 的 16px 左右留白，再加 `.drawer-table-main` 会造成双重内边距。§3 的边距规则只约束**直接承载 `sc-table` 的 `el-main`**。
- **仅剩 5 处业务差异**（都属于「档案」而非「代码」）：字段类型清单多「日期」、选项编码/说明可手工录入、服务结构不显示「对应参数」、判定多「读取/影响范围 + 需报价服务」、规则默认计价方式不同

---

## 4. 落地步骤（照做即可）

1. **先对齐数据模型**（能改就改）：统一类型键/条件键/取值键/范围取值/规则存放位置，让两侧共用同一套语义
2. **给 L1 组件加 props**，默认值 = 原模块现状（这一步做完，原模块应零回归，先验证再继续）
3. **写档案对象**（如 `FIELD_MODEL` / `RULE_MODEL` / `JUDGEMENT_MODEL` / `FIELD_TEXTS`），放在新模块的入口页或 `mockData.js`
4. **新模块入口页照抄原入口页骨架**，只改标题/宽度/payload 组装
5. **删除新模块此前的自研实现**（自建 Tab、卡片编辑、子抽屉及其样式/方法），避免两套并存
6. **验证**：`eslint` + SFC 编译 + 数据形状断言（种子/模型符合共用组件期望）+ 关键流程手点（原模块与新模块各一遍）

---

## 5. 常见问题

- **要不要给每个模块复制一份组件？** 不要。差异用档案表达；一旦复制，后续每条需求都要做两遍，且 `fieldEngine`/`pricingEngine`/`ConditionEditor` 这类共用件会被迫二次耦合。
- **什么时候可以「不共用」？** 内容主体不同（如商品的「供应商成本/商品详情/模拟下单」Tab 与分组无关）—— 这些保留在原模块，不必强行塞进共用组件。
- **档案放在哪？** 与业务数据无关的放入口页（`FIELD_MODEL`/`RULE_MODEL`）；与种子数据同源的放模块 `mockData.js`（如 `GROUP_COMPONENT_TYPES`）。
