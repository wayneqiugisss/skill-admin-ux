# 列表页 index.vue 规范 — list-page-rule.md

## 1. 模板整体结构

### 1.1 四层结构（强制）

任何标准 CRUD 列表页自上而下**固定四层**，顺序不可调换、不可插入第五层：

| 层级 | 名称 | 载体 | 是否必需 |
|---|---|---|---|
| 第一层 | **头部 Tab** | `el-tabs`（`.page-tabs`） | 可选 — 仅当同一页需要在多个视图间切换时使用 |
| 第二层 | **检索条件** | `div.search-wrap.search-wrap--dynamic`（配置驱动，带模式标识） | 必需（无任何检索条件时可整层省略） |
| 第三层 | **按钮** | `el-header` > `.left-panel` | 可选 — 有新增/批量操作等按钮时使用 |
| 第四层 | **表格** | `el-main.nopadding` > `scTable` | 必需 |

> **判定要点**：
> - 「搜索 / 重置 / 展开收起」属于**第二层**（贴在检索条件尾部），**不是**第三层。第三层只放业务动作按钮（新增、批量删除、导入导出等）。
> - 第一层 Tab 用于切换**同一实体的不同视图**（如「待审核 / 已通过 / 已驳回」、「全部 / 我创建的」）。若切换的是不同实体，应拆成两个菜单页，不要用 Tab 硬塞。
> - Tab 切换只改变检索参数并 `reload()` 表格，**不得**为每个 Tab 复制一份表格或一份检索区。
> - 检索条件统一走**配置驱动动态形态**（§2）：`searchFields.js` 声明字段 + 单个 `el-row` v-for 渲染，任意条件数同一形态，不再有「≤2 个条件二三层合并」的例外。

### 1.2 模板骨架

```
el-container
  └─ el-container direction="vertical"  ← 【强制】必须显式设置 direction="vertical"
       ├─ 第一层：头部 Tab（div.page-tabs）        ← 可选
       │    └─ el-tabs v-model="activeTab" @tab-change="onTabChange"
       ├─ 第二层：检索条件（div.search-wrap.search-wrap--dynamic，左缘主色竖条模式标识）
       │    ├─ el-row.search-fields：v-for 全部可见条件（每行 3 格自动换行，row-gap 保留行间距）
       │    └─ 末行 el-row：搜索 + 重置 +（展开/收起，仅可见条件数 > 3 时渲染）
       ├─ 第三层：按钮（el-header）                ← 可选，无按钮时整层省略
       │    └─ .left-panel（新增按钮、批量操作等）
       └─ 第四层：表格（el-main.nopadding）
            └─ scTable（远程分页表格）
               ├─ 数据列
               └─ 操作列（固定右侧）
       └─ save 组件（条件渲染 v-if="dialog.save"）
```

> **强制要求**：内层 `<el-container>` 必须添加 `direction="vertical"` 属性，固定垂直布局。原因是 Element Plus 的 `<el-container>` 默认根据直接子元素自动检测方向：如果子元素包含 `<el-header>` 或 `<el-footer>` 则自动为 `column`，否则为 `row`。当第三层 `el-header` 被省略时，会导致检索区与表格区意外左右排列。`direction="vertical"` 可消除这种隐式依赖。

> **左右布局（分类面板 + 列表）**：若业务存在稳定的分类维度（标签组→标签、单位类型→单位、部门→人员），整个页面改为「左分类 + 右列表」，左侧面板一律按 **§11** 实现，右侧仍是本节四层结构、时序完全沿用以下规范。


### 1.3 第一层：头部 Tab（可选）

仅当同一页需要切换**同一实体的不同视图**时才加这一层；无切换需求时整层省略，检索条件直接成为页面第一层。

```html
<!-- # 第一层：头部 Tab -->
<div class="page-tabs">
	<el-tabs v-model="activeTab" @tab-change="onTabChange">
		<el-tab-pane label="待审核" name="0"></el-tab-pane>
		<el-tab-pane label="已通过" name="1"></el-tab-pane>
		<el-tab-pane label="已驳回" name="2"></el-tab-pane>
		<el-tab-pane label="全部" name=""></el-tab-pane>
	</el-tabs>
</div>
```

```js
data() {
	return {
		activeTab: '0',
		// ...
	};
},
methods: {
	// Tab 切换只改检索参数并重载表格，不复制检索区/表格
	onTabChange() {
		this.search.auditStatus = this.activeTab;
		this.$refs.table.reload({ auditStatus: this.activeTab });
	}
}
```

> **强制约定**：
> - `el-tab-pane` 只写 `label` + `name`，**内容为空** —— Tab 只做筛选切换，不要把表格塞进 `el-tab-pane` 里。表格始终是第四层那一份，由 `activeTab` 驱动参数。
> - Tab 值必须与后端筛选字段取值一致（如 `auditStatus` 的 `'0'/'1'/'2'`），「全部」用空字符串 `''`。
> - 切换用 `reload()`（替换参数并回到第一页、清空选中/排序/筛选），**不要用 `upData()`**（`upData` 是合并参数，会残留上一个 Tab 的条件）。
> - Tab 与第二层检索条件同时存在时，Tab 的字段不要再在检索条件里重复出现一遍。
> - `el-tabs` 默认 `tab-position="top"`，不需要显式写。

---

## 2. 第二层：检索条件规范（配置驱动动态检索区）

> 本节为头部检索条件的**唯一处理方案**，取代旧版「手写多个 el-row 按行切条件」与「≤2 个条件二三层合并」两套形态。真实参照：`eXproduct/products/manage/index.vue` + 同目录 `searchFields.js`；可复制代码：`demos/search-fields-demo.js` + `demos/index.vue`。

### 2.1 单一事实来源：searchFields.js（强制）

**全部检索条件声明在 index.vue 同目录的 `searchFields.js`**，导出 `SEARCH_FIELDS`（字段描述数组）与 `createSearch()`（初始值工厂）。页面模板、展开收起、重置初始值、搜索入参构造全部由这份配置派生——**增删一个字段只改这一个文件**，布局自动整体重排，行内永不留缺格。

字段描述契约：

| 键 | 必需 | 说明 |
|---|---|---|
| `key` | ✅ | `search` 模型键（v-model 落点），camelCase |
| `label` | ✅ | prefix 文案（§3） |
| `type` | ✅ | 控件类型：`input` / `select` / `dict` / `cascader` / `daterange` / `number` |
| `placeholder` | 建议 | 占位文案（**input / number 默认「请输入」+ 字段名**，见 §3.5；`daterange` 用组件内置起止占位；`number` 不支持 prefix，靠它承载字段名） |
| `hiddenKey` | 可选 | 内置字段隐藏清单键（与表格列 `showField` 同口径）；不配置则常显 |
| `optionsKey` | select/cascader | 下拉数据源在页面 `options` 里的键 |
| `optionLabel` / `optionValue` | select | 选项对象的显示名 / 值键（如 `name` / `id`） |
| `dictCode` | dict | 字典编码，取模块 `dict.js` 常量（禁字面量，见 `dict-rule.md`） |
| `props` | cascader | `el-cascader` 的 props（级联单选 / 父子联动多选等） |
| `multiple` | 可选 | 级联多选标记，驱动 `collapse-tags` / `collapse-tags-tooltip` |
| `initial` | ✅ | 重置初始值（`createSearch` 据此生成，数组自动克隆） |
| `paramKey` | 可选 | 搜索入参键，缺省同 `key`（如 `scopeIdList` → `scopeIds`） |
| `normalize` | ✅ | 草稿值 → 搜索入参的折算函数（空值收敛、区间拼串、单值转 List 等） |

```js
// searchFields.js —— 检索条件配置（单一事实来源）
export const SEARCH_FIELDS = [
	{ key: 'taxName', label: '税率名称', type: 'input', placeholder: '请输入税率名称', initial: '', normalize: value => value || null },
	{ key: 'taxStatus', label: '状态', type: 'dict', dictCode: DISABLED_STATUS_DICT_CODE, placeholder: '状态', initial: null,
		paramKey: 'taxStatusList', normalize: value => (value === null || value === '' ? null : [value]) },
	{ key: 'createTimeRange', label: '创建时间', type: 'daterange', initial: null,
		normalize: value => (value && value.length === 2 ? value.join(',') : null) }
	// …新增 / 删除字段只改这份清单
];

// 搜索条件初始值：data 与重置共用同一份，随配置增删自动跟随，避免两处漂移
export const createSearch = () => {
	const search = {};
	SEARCH_FIELDS.forEach(field => {
		search[field.key] = Array.isArray(field.initial) ? [...field.initial] : field.initial;
	});
	return search;
};
```

> **控件类型白名单**：`input`（el-input）/ `select`（el-select + el-option）/ `dict`（dict-select）/ `cascader`（el-cascader）/ `daterange`（sc-date-picker）/ `number`（el-input-number，不支持 prefix，用 placeholder）。新增控件类型必须先在模板补齐 `v-else-if` 渲染分支并登记到本表，禁止页面绕过配置私写控件。
> **normalize 口径**：文本 `value || null`（空串不下发）；字典 / 级联单选 `value || null`；多选数组 `value && value.length ? value : null`；日期区间 `value && value.length === 2 ? value.join(',') : null`；后端要 List 的在 normalize 里包数组并配 `paramKey`。

### 2.2 渲染：单个 el-row + v-for（强制）

**全部条件渲染在同一个 `el-row.search-fields` 里**，`v-for="(field, index) in visibleSearchFields"`，每格 `<el-col :span="8">` 按配置顺序自动换行（每行 3 格）：

- `span` 固定 8（24 ÷ 3），**禁止** 6 / 12 / 16 / 24，禁止空 `el-col` 占位
- **禁止手写多个 el-row 按行切条件**——增删 / 隐藏字段后 v-for 整体重排，空缺天然落在行尾，不存在「删一个字段中间缺一格」
- **行间距必须保留**：`.search-fields { row-gap: 10px; margin-bottom: 10px; }`——换行产生的行与行之间保持 10px，不能贴死；条件区与按钮行之间同样 10px（样式见 `style-css-rule.md` §1）
- 容器统一 `class="search-wrap search-wrap--dynamic"`，禁止行内容器 style；控件按 `field.type` 分发（完整模板见 `demos/index.vue`）
- **模式标识必须挂**：`search-wrap--dynamic` 修饰类渲染左缘 3px 主色圆角竖条（落在左 padding 留白内，不占控件位），明显但隐蔽，用于与旧版手写固定行检索区区分——旧形态页面不带此修饰类，禁止给旧形态页面补挂（样式见 `style-css-rule.md` §1）：

```html
<!-- # 第二层：检索条件（配置驱动：全部条件同一个 el-row，每行 3 格自动换行） -->
<div class="search-wrap search-wrap--dynamic">
	<el-row :gutter="20" class="search-fields">
		<el-col
			v-for="(field, index) in visibleSearchFields"
			:key="field.key"
			:span="8"
			:class="{ 'default-hide': !searchExpanded && index >= 3 }"
		>
			<el-input v-if="field.type === 'input'" v-model="search[field.key]" :placeholder="field.placeholder" clearable @keyup.enter="upsearch">
				<template #prefix><span class="prefix-label">{{ field.label }}</span></template>
			</el-input>
			<dict-select
				v-else-if="field.type === 'dict'"
				v-model="search[field.key]"
				:dict-code="field.dictCode"
				:placeholder="field.placeholder"
				clearable
				style="width: 100%;"
				need-prefix
				:prefix="field.label"
			></dict-select>
			<!-- select / cascader / daterange / number 分支同构，见 demos/index.vue -->
		</el-col>
	</el-row>

	<!-- # 末行：搜索 + 重置 +（展开/收起，仅可见条件 > 3 时渲染） -->
	<el-row :gutter="20">
		<el-col :span="24">
			<div style="display: flex;">
				<el-button type="primary" icon="el-icon-search" @click="upsearch">搜索</el-button>
				<el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
				<el-button
					v-if="searchCollapsible"
					type="text"
					:icon="searchExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
					style="margin-right: 10px;"
					@click="searchExpanded = !searchExpanded"
				>{{ searchExpanded ? '收起' : '展开' }}</el-button>
			</div>
		</el-col>
	</el-row>
</div>
```

### 2.3 展开 / 收起（按可见条件数动态判定）

判定基于**可见条件**（配置清单经隐藏清单过滤后），不是配置总数：

```js
computed: {
	// 可见检索条件：按 hiddenKey 过滤（与表格列 showField 同口径）；无隐藏机制的页面直接返回 SEARCH_FIELDS
	visibleSearchFields() {
		return SEARCH_FIELDS.filter(field => !field.hiddenKey || this.showField(field.hiddenKey));
	},
	// 可见条件 > 3 才需要折叠；动态裁剪到 ≤ 3 时展开入口自动消失、条件全量展示
	searchCollapsible() {
		return this.visibleSearchFields.length > 3;
	}
}
```

| 可见条件数 | 展示 | 展开/收起按钮 |
|---|---|---|
| ≤ 3 | 单行全显 | `v-if="searchCollapsible"` 自动不渲染 |
| > 3 | 收起时前 3 个，其余 `default-hide` | 自动渲染 |

> 与旧规范的关键差异：`searchExpanded` / `searchCollapsible` / `.default-hide` 是**常驻骨架**，条件数变化（含运行时隐藏清单回填）自动适配，**不再需要**「≤3 个时手工删按钮 / 删 computed / 删样式」——配置驱动下条件数本来就是动态的。
> 收起态判定统一写 `:class="{ 'default-hide': !searchExpanded && index >= 3 }"`（index 是可见清单内的序号，不是配置序号）。

### 2.4 搜索 / 重置与入参构造（配置派生）

- 搜索按钮 `type="primary"` + `icon="el-icon-search"`；**重置按钮必须紧跟其后**，`icon="el-icon-refresh"`；展开/收起排最后，是第二层唯一允许 `type="text"` 的按钮
- 入参构造**遍历可见字段按 `normalize` 折算**，禁止 `{...this.search}` 直传——被隐藏的字段不下发，新增字段只需在配置里声明 normalize：

```js
// 读取草稿条件（仅点「搜索」时调用）：隐藏字段不入参
buildFilters() {
	const filters = {};
	this.visibleSearchFields.forEach(field => {
		filters[field.paramKey || field.key] = field.normalize(this.search[field.key]);
	});
	return filters;
},
upsearch() {
	this.$refs.table.upData(this.buildFilters());
},
// 重置：初始值由配置派生，禁止手写第二份字面量
resetSearch() {
	this.search = createSearch();
	this.searchExpanded = false;
	this.$refs.table.upData({});
}
```

- 与字段绑定的搜索前提示（如「父级品类精确匹配」警告）须先判该字段是否可见，隐藏时跳过
- 本地数据表格（无 apiObj）同口径：`buildFilters` 结果存入已生效筛选态，供列表与 Tab 计数共用

### 2.5 动态字段来源与增删流程

1. **增删字段**：只改 `searchFields.js`（布局 / 折叠 / 重置 / 入参全自动跟随）；下拉数据源在页面 `options` 补对应 `optionsKey`。
2. **隐藏裁剪**：`hiddenKey` 与表格列 `showField` 同口径（租户模板 prop ∪ 模板 DB 配置）；隐藏后布局自动重排、入参自动剔除。隐藏清单来自接口时，`visibleSearchFields` 必须依赖响应式来源（data / computed），保证回填后视图跟随。
3. **后端下发动态字段**：把接口返回映射成同构字段描述（key / label / type / options / initial / normalize）后并入清单，渲染层零改动。
4. **存量页面**：admin/src/views 全量 index.vue 检索区已完成配置驱动改造（117 页，含双容器/页签裁剪等特殊形态），一律按本节口径维护，**禁止回退为手写固定行**；旧形态（手写多 el-row、≤2 条件合并行）仅作为历史参照。
5. **特殊形态映射**（存量改造已验证的口径）：
   - **双检索容器**（双 Tab 各自一份检索，如 credit/deposit manage）：`searchFields.js` 导出两份清单（`ACCT_SEARCH_FIELDS` / `ADJUST_SEARCH_FIELDS`）+ 各自 `create*Search()`，另导出 `SEARCH_FIELDS` 别名指向主清单；每容器一份 `visible*SearchFields` / `*SearchCollapsible` 与展开切换，共用一个 `searchExpanded`。
   - **控件随页签裁剪**（如 rebate/pool）：字段加 `tab: 'account'` 标记，`visibleSearchFields` 追加 `(!field.tab || field.tab === this.activeTab)` 过滤；入参需全量下发时遍历 `SEARCH_FIELDS` 而非可见清单（upData 合并语义，空值也要显式带上）。
   - **日期拆分双键 / 复杂入参**：字段标 `skipParam: true`，循环跳过，拆分代码原样保留在入参方法内（别名展开为 `this.search.*`）。
   - **状态 Tab spread**（`...this.tabParams`）：spread 与分页键作为初始化 extras 保留，检索字段逐键折算进 `normalize`（含 forEach 批量 Number / 单键 if 守卫）。
   - **常驻骨架**：`searchExpanded` 必须保留在 data（模板双向绑定需响应式声明，computed 只接管可见清单/折叠判定）；≤3 条件时展开入口由 `v-if="searchCollapsible"` 自动不渲染，不手工删结构。
   - **≤2 条件配置驱动合并行**（如 setting/role、setting/dept、customers/area、merchants/area 及其镜像 eXmerchant/base/area）：检索与第三层合并为单个 `el-header`，左 `.left-panel` 置功能按钮（普通页）或上下文提示（左右布局页的区域路径 + 计数），右 `.right-panel > .right-panel-search` 置筛选；控件仍由 `v-for visibleSearchFields` 按 `field.key` 分发（配置驱动不变，模型/重置/入参随清单跟随），搜索 + 重置按钮带文案置最右；不挂 `search-wrap--dynamic`、不写检索区页面样式（全局 fix.scss / app.scss 已覆盖），豁免 prefix 与展开收起；`searchExpanded` 仍常驻 data，`searchCollapsible` 可省。仅适用于条件稳定 ≤2 的页面，条件跨过 2↔3 时整体换回动态骨架。
   - **normalize 纯函数红线**：`searchFields.js` 的 normalize 必须是入参 value 的纯函数——禁止引用模块外自由变量（如守卫里的 `status`）、禁止 `this.*`（模块级箭头函数 this 不指向组件）、禁止折叠成常量（`() => null` / `() => true` 会丢失条件或恒下发）；守卫逻辑（Number 归一 + 枚举判定、trim、勾选才带参）必须完整折进 `value => ...` 体内，页面入参方法里被接管的补偿块同步删除。审计探针：`normalize:\s*(\(\)\s*=>|value\s*=>\s*\(this\.)` 全仓零命中。


---

## 3. 筛选组件 prefix 前缀规范（强制）

**所有筛选组件必须使用 prefix（原生插槽或组件 props）。**

> prefix 文案由字段配置的 `label` 统一下发（`<span class="prefix-label">{{ field.label }}</span>` / `:prefix="field.label"`），不在模板里逐处硬编码；`number` 类控件不支持 prefix，用 `placeholder` 承载字段名。
> **placeholder 口径见 §3.5**：input 类检索条件占位文案默认「请输入」+ 字段名。

| 组件 | prefix 方式 | 推荐写法 |
|---|---|---|
| `el-input` | `#prefix` 插槽 | 见 3.1 |
| `DictSelect` | `need-prefix` + `prefix` prop | 见 3.2 |
| `el-input-number` | 不支持 prefix 插槽，改用 `placeholder` | 见 3.3 |
| `sc-date-picker` | `need-prefix` + `prefix` prop | 见 3.4 |

### 3.1 el-input（#prefix 插槽）

```html
<el-input
  v-model="search.taxName"
  placeholder="请输入税率名称"
  clearable
  @keyup.enter="upsearch"
>
  <template #prefix>
    <span class="prefix-label">税率名称</span>
  </template>
</el-input>
```

> `#prefix` 插槽是 Element Plus 原生支持的。文字统一用 `<span class="prefix-label">`，颜色 `#909399` 由 `.prefix-label` 提供（样式见 `style-css-rule.md` §1）——**禁止**在每处 prefix 上重复写行内 `style="color: #909399;"`。
> 文本类条件建议加 `@keyup.enter="upsearch"`，回车即搜。
> **字段名必须使用 camelCase**（如 `taxName` 而非 `tax_name`），详见 `field-naming-rule.md`。

### 3.2 DictSelect（need-prefix + prefix prop）

```html
<dict-select
  v-model="search.taxStatus"
  dict-code="disabled_status"
  placeholder="状态"
  clearable
  style="width: 100%;"
  need-prefix
  prefix="状态"
></dict-select>
```

### 3.3 el-input-number（controls-position + placeholder）

```html
<el-input-number
  v-model="search.taxSort"
  :min="0"
  :step="1"
  placeholder="请输入排序"
  style="width: 100%;"
  clearable
  controls-position="right"
></el-input-number>
```

> **强制规则**：
> - 数字组件**必须**使用 `el-input-number`，禁止使用 `el-input type="number"`
> - **必须**添加 `controls-position="right"`（+/- 按钮在右侧）

### 3.4 sc-date-picker（need-prefix + prefix prop）

```html
<sc-date-picker
  v-model="search.createTimeRange"
  type="daterange"
  range-separator="至"
  start-placeholder="开始"
  end-placeholder="结束"
  value-format="YYYY-MM-DD"
  style="width: 100%;"
  clearable
  need-prefix
  prefix="创建时间"
/>
```

> 日期组件**必须**使用 kebab-case `<sc-date-picker>`，禁止使用 PascalCase `<ScDatePicker>`。

### 3.5 placeholder 占位文案口径（强制）

**检索条件中凡是输入类控件（`el-input` / `el-input-number`），placeholder 默认加「请输入」前缀 + 字段名**，与 prefix 的字段名形成「标签 + 动作提示」的完整语义：

| 控件类型 | placeholder 口径 | 示例 |
|---|---|---|
| `input`（el-input） | **「请输入」+ 字段名**（默认强制） | `请输入商品标题` / `请输入税率名称` |
| `number`（el-input-number） | **「请输入」+ 字段名**（无 prefix，占位承载字段名） | `请输入排序` |
| `select` / `dict` / `cascader` | 选择类口径不变：「全部xx」或「请选择xx」 | `全部品牌` / `请选择状态` |
| `daterange` | 组件内置起止占位，不另配 | `开始日期` / `结束日期` |

```js
// searchFields.js —— input 类占位一律「请输入」前缀
{ key: 'title', label: '商品标题', type: 'input', placeholder: '请输入商品标题', initial: '', normalize: value => value }
```

> - 配置驱动页面只改 `searchFields.js` 的 `placeholder`，模板 `:placeholder="field.placeholder"` 自动跟随；旧形态手写检索区的 input 同口径补齐；utils 里的检索字段工厂（如 `priceSearchFields`）与左侧面板过滤输入框同口径。
> - **i18n 页面**：复用字段 label 的绑定改包一层公共键 `:placeholder="$t('common.inputOf', { name: field('xxx') })"`（`common.inputOf = '请输入{name}'`，与 `common.allOf` 同层）；专属占位键（`xxxPlaceholder` / `searchPlaceholder`）直接在语言包值里加前缀；禁止改 `field.*` 字段名本身（表格列头共用）。
> - 已有「请输入」前缀的不重复叠加（禁止「请输入请输入xx」）；带业务限定的占位（如「请输入手机号 / 邮箱」）保留限定部分，只确保前缀存在。
> - 本口径只约束**检索条件**；表单（save.vue / 抽屉）内的 placeholder 不受此条强制。

---

## 4. 第三层：按钮（操作栏，可选）

> 第三层 `el-header` 为**可选结构**：有新增、批量操作等按钮时添加，无按钮时直接省略。
> 本层只放**业务动作按钮**；「搜索 / 重置 / 展开收起」属于第二层，不要挪到这里。

### 4.1 有操作按钮时（新增、批量操作等）

第二层为独立 `.search-wrap`（配置驱动检索区，§2）。

```html
<el-header style="height: auto;">
  <div class="left-panel">
    <el-button type="primary" icon="el-icon-plus" @click="add">新增模块名</el-button>
    <!-- 可扩展：批量删除、导出、导入等操作按钮 -->
  </div>
</el-header>
```

### 4.2 无操作按钮时（省略 el-header）

不添加 `el-header`，第二层 `.search-wrap` 下方直接接第四层 `el-main.nopadding` 即可。此时内层 `<el-container>` 的 `direction="vertical"` 尤其不能省（§1.2）。

---

## 5. 第四层：表格（scTable）规范

### 5.1 scTable 配置

```html
<scTable
  ref="table"
  stripe
  border
  remoteSort
  :apiObj="apiObj"
  remoteFilter
  row-key="主键字段"
>
```

| 属性 | 说明 | 必填 |
|---|---|---|
| `ref="table"` | 表格引用 | 是 |
| `stripe` | 斑马纹 | 是 |
| `border` | 边框 | 是 |
| `remoteSort` | 远程排序 | 是 |
| `:apiObj` | 绑定 API 对象 | 是 |
| `remoteFilter` | 远程筛选 | 是 |
| `row-key` | 行数据主键 | 推荐 |

### 5.2 apiObj 绑定

```javascript
data() {
  return {
    apiObj: this.$API.模块名.list,
  };
}
```

`apiObj` 直接绑定模块的 `list` API 对象（包含 `url` 和 `get` 方法）。

### 5.3 普通数据列

```html
<el-table-column label="税率编码" prop="taxCode" width="180"></el-table-column>
<el-table-column label="税率名称" prop="taxName" min-width="180"></el-table-column>
```

> **prop 必须使用 camelCase**（与 Java 接口返回字段名一致），禁止使用 snake_case（如 `tax_code`）。

### 5.4 格式化列（金额、税率、日期段等）

```html
<el-table-column label="税率值" prop="taxValue" width="120">
  <template #default="scope">
    {{ (scope.row.taxValue * 100).toFixed(2) }}%
  </template>
</el-table-column>
```

> 格式化列中 `scope.row` 的字段名也必须是 camelCase。

### 5.5 状态列（el-switch 行内切换）

```html
<el-table-column label="状态" prop="taxStatus" width="100">
  <template #default="scope">
    <el-switch
      v-model="scope.row.taxStatus"
      @change="changeStatus($event, scope.row)"
      :loading="scope.row.$switch_status"
      :active-value="1"
      :inactive-value="0"
    ></el-switch>
  </template>
</el-table-column>
```

> 状态列使用 `el-switch` 组件，配合 `changeStatus` 方法实现行内切换，无需打开抽屉。

### 5.6 创建/更新信息列（规范格式）

```html
<el-table-column label="创建时间" prop="createTime" width="170"></el-table-column>
<el-table-column label="更新时间" prop="updateTime" width="170"></el-table-column>
```

> 系统通用字段使用 camelCase：`createTime`、`updateTime`、`createBy`、`updateBy`。

### 5.7 字典值列（状态 / 类型 / 来源）

字典值的文案与颜色**不写在页面里**，统一用全局组件 `<sc-dict-label>`（无需 import）：

```javascript
// columns.js —— 字典列只标 dictCode，编码引用模块 dict.js 的常量
import { SOURCE_AUTH_STATUS_DICT_CODE, SOURCE_TYPE_DICT_CODE } from '../../customers/source/dict';

export const tableColumns = [
	{ prop: 'custName', field: 'custName', minWidth: 240 },
	{ prop: 'sourceType', field: 'sourceType', width: 110, align: 'center', dictCode: SOURCE_TYPE_DICT_CODE },
	{ prop: 'certStatus', field: 'certStatus', width: 110, align: 'center', dictCode: SOURCE_AUTH_STATUS_DICT_CODE }
];
```

```html
<el-table-column v-for="col in tableColumns" :key="col.prop" :prop="col.prop" :label="field(col.field)" :width="col.width" :align="col.align">
	<template #default="scope">
		<scDictLabel v-if="col.dictCode" :dict-code="col.dictCode" :model-value="scope.row[col.prop]" />
		<template v-else>{{ scope.row[col.prop] }}</template>
	</template>
</el-table-column>
```

禁止写法与完整契约见 `dict-rule.md` §3：不写 `<el-tag>{{ $DICT.getDictName(...) }}</el-tag>`、不留 `xxxText`/`xxxTagType` 双方法、一列一个具名 slot。

---

## 6. 操作列规范

固定在表格右侧。**默认**包含「查看」「编辑」「删除」三个按钮，但**按业务裁剪**：

- 配置类页面（配置抽屉承载全部编辑）行操作统一用「**配置**」，不再写「编辑」
- 业务上不允许删除/查看的列表（如订单确认分组）可以只留「编辑/配置」一个按钮，此时列宽收到 `100px` 左右并去掉 `el-button-group` 包裹
- 「查看」模式（`readonly`）仍须由 save 组件支持（`open('view')`），只是不一定暴露行按钮

标准三按钮写法：

```html
<el-table-column :label="$t('common.operation')" fixed="right" width="200">
  <template #default="scope">
    <el-button-group>
      <el-button text type="primary" size="small" @click="table_view(scope.row)">
        {{ $t('common.view') }}
      </el-button>
      <el-button text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">
        {{ $t('common.edit') }}
      </el-button>
      <el-button text type="primary" size="small" @click="table_del(scope.row, scope.$index)">
        {{ $t('common.delete') }}
      </el-button>
    </el-button-group>
  </template>
</el-table-column>
```

> **删除规则**：使用 `this.$confirm()` 二次确认，禁止使用 `el-popconfirm`，禁止直接删除。
> 确认逻辑写在 `table_del` 方法内部（见 7.3），模板中按钮直接绑定 `@click="table_del"`。

### 6.1 条件显示的删除按钮

当删除按钮需要根据行状态控制显隐时，将 `v-if` 直接写在 `el-button` 上：

```html
<el-button
  v-if="scope.row.status === 0"
  text type="primary" size="small"
  @click="table_del(scope.row, scope.$index)"
>{{ $t('common.delete') }}</el-button>
```

> **禁止**：不要用 `el-popconfirm` 包裹后再加 `v-if`，直接在 `el-button` 上控制显隐。

---

## 7. Script 骨架规范

### 7.1 导入与组件注册

```javascript
import save from "./save";
// 按需引入非全局注册组件
import DictSelect from "@/components/DictSelect/index.vue";
import ScDatePicker from "@/components/ScDatePicker/index.vue";

export default {
  name: "platform-base-setting-tax-rate",
  components: {
    save,
    DictSelect,    // 如果使用了 DictSelect
    ScDatePicker,  // 如果使用了 sc-date-picker
  },
```

### 7.2 data 数据结构

```javascript
data() {
  return {
    dialog: {
      save: false,
    },
    apiObj: this.$API.system.taxRate.list,
    // search 初始值由配置派生（searchFields.js 的 createSearch），禁止手写第二份字面量
    search: createSearch(),
    // 展开状态常驻声明：可见条件数动态变化，折叠骨架自动适配（§2.3）
    searchExpanded: false,
  };
}
```

```javascript
computed: {
  // 可见检索条件：按 hiddenKey 过滤（与表格列 showField 同口径）；无隐藏机制的页面直接返回 SEARCH_FIELDS
  visibleSearchFields() {
    return SEARCH_FIELDS.filter(field => !field.hiddenKey || this.showField(field.hiddenKey));
  },
  // 可见条件 > 3 才需要折叠；裁剪到 ≤ 3 时展开入口自动消失，无需手改模板
  searchCollapsible() {
    return this.visibleSearchFields.length > 3;
  }
}
```

> **search 字段名必须使用 camelCase**，与 Java 接口查询参数保持一致。
> **展开/收起由可见条件数动态判定**：`searchExpanded` / `searchCollapsible` / `.default-hide` 常驻骨架，条件增删或隐藏清单回填后自动适配（详见 §2.3）。

### 7.3 方法定义

```javascript
methods: {
  // 新增
  add() {
    this.dialog.save = true;
    this.$nextTick(() => {
      this.$refs.saveDialog.open();
    });
  },

  // 查看
  async table_view(row) {
    this.dialog.save = true;
    await this.$nextTick();
    const dialog = await this.$refs.saveDialog.open("view");
    dialog.setData(row);
  },

  // 编辑
  async table_edit(row) {
    this.dialog.save = true;
    await this.$nextTick();
    const dialog = await this.$refs.saveDialog.open("mod");
    dialog.setData(row);
  },

  // 删除（局部删除，$confirm 二次确认）
  async table_del(row, index) {
    try {
      await this.$confirm('确定要删除该记录吗？', '提示', { type: 'warning' });
    } catch {
      return; // 用户取消
    }
    var res = await this.$API.system.taxRate.delete.delete(row.id);
    if (res.code == 200) {
      this.$refs.table.tableData.splice(index, 1);
      this.$message.success(this.$t('common.deleteSuccess'));
    } else {
      this.$alert(res.message, this.$t('common.operationFailed'), { type: "error" });
    }
  },

  // 状态切换
  async changeStatus(val, row) {
    var oldStatus = val === 1 ? 0 : 1;
    row.taxStatus = oldStatus;
    row.$switch_status = true;
    try {
      var submitData = { id: row.id, taxStatus: val };
      var res = await this.$API.system.taxRate.mod.put(submitData);
      if (res.code == 200) {
        delete row.$switch_status;
        row.taxStatus = val;
        this.$message.success(this.$t('common.operationSuccess'));
      } else {
        row.taxStatus = oldStatus;
        delete row.$switch_status;
        this.$alert(res.message, this.$t('common.tip'), { type: 'error' });
      }
    } catch (error) {
      row.taxStatus = oldStatus;
      delete row.$switch_status;
      this.$message.error(this.$t('common.operationFailed'));
    }
  },

  // 搜索：遍历可见字段按 normalize 折算入参（空值收敛 / 单值转 List / 区间拼串都在配置里），
  // 被隐藏的字段不下发；禁止 {...this.search} 直传
  upsearch() {
    const params = {};
    this.visibleSearchFields.forEach(field => {
      params[field.paramKey || field.key] = field.normalize(this.search[field.key]);
    });
    this.$refs.table.upData(params);
  },

  // 重置搜索条件：初始值由配置派生，再清空参数重载表格
  resetSearch() {
    this.search = createSearch();
    this.searchExpanded = false;
    this.$refs.table.upData({});
  },

  // 操作结果回调
  async handleSuccess(data, mode) {
    if (mode == "add") {
      this.$refs.table.refresh();
    } else if (mode == "mod") {
      // 重新查询后端最新数据，确保所有字段（含计算字段、状态文本等）与数据库一致
      var res = await this.$API.system.taxRate.get.get(data.id);
      if (res.code == 200) {
        this.$refs.table.tableData
          .filter(item => item.id == data.id)
          .forEach(item => Object.assign(item, res.data));
      }
    }
  },
},
```

---

## 8. 强制要求

| # | 要求 |
|---|---|
| ✅ | 页面自上而下固定四层：头部 Tab（可选）→ 检索条件 → 按钮（可选）→ 表格（§1.1） |
| ✅ | **检索条件配置驱动**：`searchFields.js` 的 `SEARCH_FIELDS` 是唯一事实来源，单个 `el-row.search-fields` + `v-for="visibleSearchFields"` 渲染，每格 `:span="8"` 自动换行（§2.1–§2.2） |
| ✅ | **行间距必须保留**：`.search-fields { row-gap: 10px; margin-bottom: 10px; }`，换行后行与行之间不能贴死（§2.2） |
| ✅ | 增删 / 隐藏字段后布局自动整体重排，行内不留缺格；字段增删只改 `searchFields.js`（§2.5） |
| ✅ | 展开/收起由 `searchCollapsible`（可见条件数 > 3）动态判定，收起时 `index >= 3` 挂 `default-hide`；≤ 3 时入口自动不渲染，无需手工删结构（§2.3） |
| ✅ | `visibleSearchFields` 按 `hiddenKey` 过滤（与表格列 `showField` 同口径）；入参遍历可见字段按 `normalize` 折算，隐藏字段不下发（§2.3–§2.4） |
| ✅ | 第二层容器统一用 `class="search-wrap search-wrap--dynamic"`（左缘主色竖条模式标识，区分新旧形态），禁止把容器样式写成行内 `style`（§2.2） |
| ✅ | 搜索按钮后面必须紧跟重置按钮；`resetSearch` 用 `createSearch()` 派生初始值，禁止手写第二份字面量（§2.4） |
| ✅ | 头部 Tab 只写 `label`+`name`，内容为空；切换用 `reload()` 而非 `upData()`（§1.3） |
| ✅ | 所有筛选组件必须加 prefix（按 3.1-3.4 规范），文案由字段配置 `label` 下发 |
| ✅ | 检索条件 input / number 的 placeholder 默认「请输入」+ 字段名（§3.5），选择类维持「全部xx / 请选择xx」 |
| ✅ | 数字组件必须用 `el-input-number` + `controls-position="right"` |
| ✅ | 删除/危险操作必须使用 `this.$confirm()` 二次确认，禁止使用 `el-popconfirm` |
| ✅ | 删除后使用 `splice` 局部删除，不触发表格整页重载 |
| ✅ | 操作结果回调（`handleSuccess`）按 7.3 实现 |
| ✅ | mod 成功后必须通过 `get.get(data.id)` 重新查询后端最新数据并更新行，禁止直接用 `submitData` 覆盖行数据 |
| ✅ | 状态列使用 `el-switch` + `changeStatus` 行内切换 |
| ✅ | 所有字段名使用 camelCase，禁止 snake_case |
| ✅ | 第三层 `el-header` 可选，有按钮时添加，无按钮时省略 |
| ✅ | 左右布局页面的左侧面板必须用 `side-*` 统一 class 与结构（§11），行高由全局 `.el-tree.menu` 提供 |
| ✅ | delete 调用使用 `.delete(row.id)`，mod 调用使用 `.put(submitData)` |
| ❌ | 禁止手写多个 `el-row` 按行切检索条件、禁止空 `el-col` 占位、禁止把 `span` 写成 6/12/16/24 来凑行 |
| ❌ | 禁止行间距贴死（漏写 `.search-fields` 的 `row-gap: 10px`） |
| ❌ | 禁止绕过 `searchFields.js` 直接在模板 / `search` 字面量里增删条件（布局、折叠、重置、入参会随之漂移） |
| ❌ | 禁止 `{...this.search}` 直传搜索入参（隐藏字段会泄漏下发，空值口径失控） |
| ❌ | 禁止回退为手写固定行的旧版合并形态；≤2 条件可用配置驱动合并行（见 §2.5 第 5 条，控件必须 v-for 分发） |
| ❌ | 禁止把表格塞进 `el-tab-pane`，或为每个 Tab 复制一份检索区/表格 |
| ❌ | 无按钮时禁止保留空 `el-header`（直接省略即可） |
| ❌ | 禁止使用 `el-input type="number"` 代替 `el-input-number` |
| ❌ | 禁止 mod 成功后直接用 `submitData` / `data` 覆盖行数据（`Object.assign(item, data)`），必须调 `get` 接口重新查询 |
| ❌ | 禁止在 prop / v-model / search 中使用 snake_case 字段名 |
| ❌ | 禁止给左侧面板按业务另起 class 名（如 `group-aside`/`type-aside`/`category-aside`）或在页面内自定义树行高 |


---

## 9. save 组件

```html
<save
  v-if="dialog.save"
  ref="saveDialog"
  @success="handleSuccess"
  @closed="dialog.save = false"
></save>
```

- 使用 `v-if` 条件渲染，通过 `dialog.save` 控制显隐
- `@success` 绑定 `handleSuccess` 方法
- `@closed` 将 `dialog.save` 重置为 `false`

---

## 10. 完整示例

- **配置驱动检索区（任意条件数同一形态）**：参见 `demos/search-fields-demo.js` + `demos/index.vue`
- **真实参照（含 hiddenKey 裁剪与入参折算）**：项目内 `src/views/eXproduct/products/manage/index.vue` + 同目录 `searchFields.js`

---

## 11. 左右布局：左侧分类面板（side panel）

当业务存在一个稳定的**分类维度**（标签组→标签、单位类型→单位、部门→人员、商品分组→商品）时，列表页改为**左右布局**：左侧分类面板承担第一层筛选与分类维护，右侧仍是标准列表页。这种形态在项目里已有多个实现（框架侧 `setting/user`、`setting/menu`、`product/group`；业务侧 `baice/wecom/tag`、`baice/organization/manage`），**必须按本节统一**，不得各页自写一套。

### 11.1 结构骨架（强制）

```
el-container                                  ← 根容器（横向）
  ├─ el-aside width="280px" class="side-aside"
  │    └─ el-container direction="vertical"    ← 【强制】显式 vertical
  │         ├─ el-header.side-header            ← 过滤输入（必须）
  │         │    ├─ el-input.side-filter-input
  │         │    └─ el-button-group.side-actions（可选：全部展开/折叠）
  │         ├─ div.side-add-row                 ← 可选：单字段内联新增行
  │         ├─ el-main.nopadding
  │         │    └─ div.side-tree-wrap
  │         │         └─ el-tree.menu.side-tree  ← 【强制】class 含 menu（全局 36px 行高）
  │         │              └─ #default: span.side-node
  │         │                   ├─ span.side-node__name   必须：flex:1 + 省略号
  │         │                   ├─ span.side-node__meta   可选：尾部数量/统计
  │         │                   └─ span.side-node__do     可选：行操作（hover 才显示）
  │         └─ el-footer style="height: 51px;"   ← 可选：面板唯一常驻按钮「新增 xx」
  └─ el-container direction="vertical"           ← 右侧列表区，规范同 §1~§10
```

### 11.2 class 命名（强制统一）

所有页面**必须**使用这套 `side-` 前缀 class，样式块在各页 `<style scoped>` 内**逐字复制**，只允许改注释：

| class | 位置 | 职责 | 关键数值 |
|---|---|---|---|
| `.side-aside` | `el-aside` | 面板底色 + 右分隔线 | `background: var(--el-bg-color); border-right: 1px solid var(--el-border-color-light);` |
| `.side-header` | `el-header` | 过滤行 | `display:flex; align-items:center; gap:6px; padding:0 10px; border-bottom:1px solid var(--el-border-color-light);` |
| `.side-filter-input` | `el-input` | 输入框撑满 | `flex: 1` |
| `.side-add-row` | 内联新增容器 | 可选 | `padding: 10px 15px; border-bottom: 1px solid var(--el-border-color-light);` |
| `.side-tree-wrap` | 树外层容器 | 滚动 + 内边距 | `height:100%; overflow:auto; padding:6px; box-sizing:border-box;` |
| `.side-tree` | `el-tree` | 只补圆角/hover/选中态 | `border-radius:4px; padding-right:4px;`；hover `--el-fill-color-light`；选中 `--el-color-primary-light-9` + 主色字 |
| `.side-node` | 节点内容根 | 横向排版 | `display:flex; align-items:center; flex:1; min-width:0; padding-right:6px; font-size:13px;` |
| `.side-node__name` | 名称 | **主信息优先占位** | `flex:1; min-width:0;` + nowrap/hidden/ellipsis，必须绑定 `:title` |
| `.side-node__meta` | 数量/统计 | 靠右不被压 | `flex-shrink:0; max-width:40%; margin-left:6px; font-size:12px; color:var(--el-text-color-secondary);` + ellipsis |
| `.side-node__do` | 行操作 | hover 才出，不占常驻宽度 | `display:none; margin-left:6px; flex-shrink:0;`；`.side-node:hover .side-node__do{ display:inline-flex; }` |

> **禁止**：① 按业务另起 class（`group-aside` / `type-aside` / `category-aside` 等历史写法已统一为 `side-*`）；② 在页面 `:deep()` 里写 `height: 34px/40px` 等自定义行高——行高只有一个来源，即全局 `src/style/fix.scss` 的 `.el-tree.menu .el-tree-node__content { height: 36px }`，因此 `el-tree` 必须同时带 `menu` 与 `side-tree` 两个 class。

### 11.3 尺寸档位

| 项 | 值 | 说明 |
|---|---|---|
| `el-aside` 宽度 | **280px**（默认） | 与框架 `setting/user` 同源；名称较长可取 320px，多层级/信息密的可取 400px，不出现中间值 |
| 树行高 | **36px** | 全局 `.el-tree.menu` 提供，页面不写 |
| header 高度 | 默认 60px | 不自定义 |
| footer 高度 | 51px（内联） | `<el-footer style="height: 51px;">`，与右侧操作栏同款 |
| 字号 | 名称 13px / 统计 12px | 与列表正文口径一致 |

### 11.4 行为约定

1. **首项「全部」虚拟节点**：需要「不分类」视图时在数据头部插入 `{ id: '', name: '全部xx' }`，它必须：不可拖动（`allow-drag` 返回 false）、不可作为落点（`allow-drop` 返回 false）、不显示行操作（`v-if="data.id !== ''"`）、过滤时恒显。
2. **拖拽排序**：单层分类整行即拖动区，不加句柄 icon；存在行内重命名输入框时 `:draggable` 必须临时置 `false`；`node-drop` 里按新顺序重写 `order`（值大靠前）并 `this.$refs.table.refresh()` 同步右侧。
3. **点击联动**：`node-click` 用 `this.$refs.table.reload(params)`（切分类需清空旧条件，不用 `refresh`）；选中态由 `:current-node-key` + `:highlight-current` 承担，不手写背景 class。
4. **行操作按钮**：一律收在 `.side-node__do`，`size="small" circle` + `icon` + `title`，并 `@click.stop` 防止冒泡触发 `node-click`；按钮多于 3 个时改用下拉，不撑宽面板。
5. **新增入口**：单字段分类可用 `.side-add-row` 内联新增；两个及以上字段必须走 `save.vue` 抽屉（红线 4），左侧不写内联行。
6. **删除分类**：`$confirm` 二次确认，`confirmButtonText` 用 `common.delete`；成功后局部 `splice` 移除节点；若删的是当前选中分类则回退到「全部」并 `reload`；分类下仍有实体时由后端拦截，前端 `$alert` 展示原因。
7. **右侧搜索区**：已由左侧承担的分类维度不再重复出现在右侧筛选条件里（例如左侧已是标签组，右侧就不再放「标签组」下拉）。

### 11.5 完整参考

`demos/side-panel.vue`：左侧面板可复制骨架（模板 + 过滤/拖拽/删除交互 + 统一样式块）。
