# 列表页 index.vue 规范 — list-page-rule.md

## 1. 模板整体结构

### 1.1 四层结构（强制）

任何标准 CRUD 列表页自上而下**固定四层**，顺序不可调换、不可插入第五层：

| 层级 | 名称 | 载体 | 是否必需 |
|---|---|---|---|
| 第一层 | **头部 Tab** | `el-tabs`（`.page-tabs`） | 可选 — 仅当同一页需要在多个视图间切换时使用 |
| 第二层 | **检索条件** | `div.search-wrap` | 必需（无任何检索条件时可整层省略） |
| 第三层 | **按钮** | `el-header` > `.left-panel` | 可选 — 有新增/批量操作等按钮时使用 |
| 第四层 | **表格** | `el-main.nopadding` > `scTable` | 必需 |

> **判定要点**：
> - 「搜索 / 重置 / 展开收起」属于**第二层**（贴在检索条件尾部），**不是**第三层。第三层只放业务动作按钮（新增、批量删除、导入导出等）。
> - 第一层 Tab 用于切换**同一实体的不同视图**（如「待审核 / 已通过 / 已驳回」、「全部 / 我创建的」）。若切换的是不同实体，应拆成两个菜单页，不要用 Tab 硬塞。
> - Tab 切换只改变检索参数并 `reload()` 表格，**不得**为每个 Tab 复制一份表格或一份检索区。
> - **检索条件 ≤ 2 个时，第二层与第三层合并为一行**：单个 `el-header`，功能按钮置左、筛选条件置右。此时不再有独立的 `.search-wrap`，也**不走** `el-row` / `el-col` 三格栅格。这是四层结构唯一的合并例外，详见 **§2.5**。

### 1.2 模板骨架

```
el-container
  └─ el-container direction="vertical"  ← 【强制】必须显式设置 direction="vertical"
       ├─ 第一层：头部 Tab（div.page-tabs）        ← 可选
       │    └─ el-tabs v-model="activeTab" @tab-change="onTabChange"
       ├─ 第二层：检索条件（div.search-wrap）
       │    ├─ 第1行 el-row：3个筛选条件（常显）
       │    ├─ 第2行 el-row：3个筛选条件（可折叠，仅条件数 > 3 时存在）
       │    ├─ 第N行 el-row：3个筛选条件（同上）
       │    └─ 末行 el-row：搜索 + 重置 +（展开/收起，仅条件数 > 3 时渲染）
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

> **合并骨架（检索条件 ≤ 2 个时）**：第二层与第三层塌缩为同一个 `el-header`，页面从四层变三层。**功能置左、筛选置右**：
>
> ```
> el-container
>   └─ el-container direction="vertical"
>        ├─ 第一层：头部 Tab（div.page-tabs）        ← 仍可选，规则不变
>        ├─ 第二层+第三层合并（el-header）
>        │    ├─ .left-panel            ← 功能按钮（新增/批量操作），靠左
>        │    └─ .right-panel > .right-panel-search
>        │         ├─ 筛选组件 1..2 个   ← 靠右
>        │         └─ 搜索按钮          ← 固定在最右
>        └─ 第四层：表格（el-main.nopadding）> scTable
> ```
>
> 完整写法、间距与宽度约定、以及与 prefix / 重置按钮两条红线的豁免关系见 **§2.5**。


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

## 2. 第二层：检索条件规范

### 2.1 一行三个（强制）

**检索条件每行恰好 3 个，按声明顺序从左到右连续填满，不允许中间留空。**

- 每行 `<el-row :gutter="20" style="margin-bottom: 10px;">`
- 每个条件占 `<el-col :span="8">` —— `span` 固定为 8（24 ÷ 3），**禁止**写成 6 / 12 / 16 / 24
- 条件按 `search` 对象里的声明顺序每 3 个切一行
- **只有最后一行允许少于 3 个，且空缺只能落在行尾（右侧）**；中间行必须满 3 个
- **禁止**用空 `el-col` 占位、禁止空出中间格把条件往后挪

```html
<!-- ✅ 正确：4 个条件 → 第1行满 3 个，第2行 1 个（空缺在行尾） -->
<el-row :gutter="20" style="margin-bottom: 10px;">
	<el-col :span="8"><!-- 条件1 --></el-col>
	<el-col :span="8"><!-- 条件2 --></el-col>
	<el-col :span="8"><!-- 条件3 --></el-col>
</el-row>
<el-row :gutter="20" style="margin-bottom: 10px;" :class="{'default-hide': !searchExpanded}">
	<el-col :span="8"><!-- 条件4 --></el-col>
</el-row>

<!-- ❌ 错误：第1行只放 2 个，中间空一格 -->
<el-row :gutter="20">
	<el-col :span="8"><!-- 条件1 --></el-col>
	<el-col :span="8"><!-- 条件2 --></el-col>
	<el-col :span="8"><!-- 空占位 --></el-col>
</el-row>
<el-row :gutter="20">
	<el-col :span="16"><!-- 条件3 拉宽补位 --></el-col>
</el-row>
```

> **新增 / 删除 / 调整条件后必须整体重排**：不能只在末尾追加一行，导致上一行出现空洞。重排后仍须满足「每行 3 个、只有末行可缺、缺在行尾」。
> Code Review 时用「逐行数 `el-col`」的方式核对，任何一行数量不是 3（末行除外）即为不合格。

### 2.2 容器与完整结构

第二层容器统一使用 `class="search-wrap"`（样式见 `style-css-rule.md`），**禁止**把容器样式写成行内 `style`：

```html
<!-- # 第二层：检索条件 -->
<div class="search-wrap">
	<!-- # 第1行 - 常显条件（满 3 个） -->
	<el-row :gutter="20" style="margin-bottom: 10px;">
		<el-col :span="8">
			<!-- 筛选组件（el-input / dict-select / sc-date-picker 等，prefix 见 §3） -->
		</el-col>
		<el-col :span="8"><!-- 筛选组件 --></el-col>
		<el-col :span="8"><!-- 筛选组件 --></el-col>
	</el-row>

	<!-- # 第2行 - 可折叠条件（满 3 个；仅条件数 > 3 时才存在本行） -->
	<el-row :gutter="20" style="margin-bottom: 10px;" :class="{'default-hide': !searchExpanded}">
		<el-col :span="8"><!-- 筛选组件 --></el-col>
		<el-col :span="8"><!-- 筛选组件 --></el-col>
		<el-col :span="8"><!-- 筛选组件 --></el-col>
	</el-row>

	<!-- # 末行：搜索 + 重置 +（展开/收起，仅条件数 > 3 时渲染） -->
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

> **行与行之间用注释分隔**，注释格式：`<!-- # 第N行 - 说明 -->`。

### 2.3 展开 / 收起（强制按条件数出现）

**展开/收起按钮只在检索条件超过一行（即 > 3 个）时出现；条件数 ≤ 3 时必须完全不渲染。**

| 条件数 | 行数 | 第 2 行起 `default-hide` | 展开/收起按钮 | `searchExpanded` / `searchCollapsible` |
|---|---|---|---|---|
| ≤ 3 | 1 行 | 不存在第 2 行 | **不渲染** | 都不声明 |
| > 3 | ≥ 2 行 | 必须加 | **必须渲染** | 都必须声明 |

判定统一交给 computed，条件增减后自动生效，避免「加了条件忘了改按钮」：

```js
computed: {
	// 检索条件超过一行（3 个）才需要折叠
	searchCollapsible() {
		return Object.keys(this.search).length > 3;
	}
},
data() {
	return {
		// search 里只放检索条件字段，不放其它状态；searchCollapsible 依赖这一约定
		search: { /* ... */ },
		searchExpanded: false,
	};
}
```

> **≤ 3 个条件时的写法**：删掉第 2 行 `el-row`、删掉展开/收起 `el-button`、data 里删掉 `searchExpanded`、computed 里删掉 `searchCollapsible`，`<style>` 里的 `.default-hide` 也一并删除。不要留「按钮渲染了但点了没反应」的死结构。
>
> **> 3 个条件时的写法**：第 2 行起每行都挂 `:class="{'default-hide': !searchExpanded}"`，按钮挂 `v-if="searchCollapsible"`。

### 2.4 搜索按钮与重置按钮

- 搜索按钮 `type="primary"` + `icon="el-icon-search"`，绑定 `upsearch`
- **重置按钮必须紧跟在搜索按钮后面**，`icon="el-icon-refresh"`，绑定 `resetSearch`
- `resetSearch` 必须把 `search` 对象**所有字段**重置为初始值，再调 `this.$refs.table.upData({})` 重新加载表格
- 展开/收起按钮排在重置按钮之后，且它是第二层里唯一允许 `type="text"` 的按钮

> 本节适用于**独立 `.search-wrap` 形态**（条件数 ≥ 3）。条件数 ≤ 2 走 §2.5 合并形态时，重置按钮与展开/收起按钮均不渲染。

### 2.5 检索条件 ≤ 2 个：与第三层按钮合并为一行（强制）

**当检索条件数量 ≤ 2 个时，第二层与第三层必须合并为同一行 `el-header`：功能按钮置左、筛选条件置右。**

条件很少时单独占两层会留大片空白，合并后整个检索+操作区压到一行，表格上移，是本项目既有的统一做法。

#### 2.5.1 三档形态对照

判定与 §2.3 折叠判定同源，都数 `Object.keys(this.search).length`：

| 条件数 | 形态 | 容器 | 栅格 | 展开/收起 | 重置按钮 | prefix |
|---|---|---|---|---|---|---|
| **≤ 2** | **二三层合并一行** | `el-header` > `.left-panel` + `.right-panel` > `.right-panel-search` | **不用** `el-row`/`el-col` | 不渲染 | **不渲染** | **不用**，改 `placeholder` |
| 3 | 独立第二层单行 | `div.search-wrap` | `el-col :span="8"` ×3 | 不渲染 | 渲染 | 必须 |
| > 3 | 独立第二层多行 | `div.search-wrap` | `el-col :span="8"`，每行 3 个 | 必须渲染 | 渲染 | 必须 |

#### 2.5.2 标准写法

```html
<el-container direction="vertical">
	<!-- # 第二层 + 第三层合并：功能置左、筛选置右（仅条件数 ≤ 2 时使用） -->
	<el-header>
		<div class="left-panel">
			<el-button type="primary" icon="el-icon-plus" @click="add">新增</el-button>
			<!-- 可扩展：批量删除、导出、导入等业务动作按钮 -->
		</div>
		<div class="right-panel">
			<div class="right-panel-search">
				<dict-select
					dict-code="sys_portal_type"
					v-model="search.portalType"
					placeholder="所属端"
					clearable
					style="width: 160px;"
				></dict-select>
				<el-input
					v-model="search.keyword"
					placeholder="名称"
					clearable
					@keyup.enter="upsearch"
				></el-input>
				<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
			</div>
		</div>
	</el-header>

	<!-- # 第四层：表格 -->
	<el-main class="nopadding">
		<scTable ref="table" :apiObj="apiObj" row-key="id" stripe></scTable>
	</el-main>
</el-container>
```

对应 `<style scoped>` **一条都不用写** —— 合并形态的布局与间距全部由全局样式提供（见 2.5.3），页面里再写 `.left-panel` / `.right-panel` / `.right-panel-search` 属于重复定义。

#### 2.5.3 强制约定

- **左右分工不用自己写**：全局 `.el-header { display:flex; justify-content:space-between; align-items:center; padding:13px 15px }`（`src/style/fix.scss:31`）已把两个 panel 顶到两端；`.left-panel` / `.right-panel` 的 `display:flex; align-items:center` 由 `fix.scss:32-33` 提供，`.right-panel` 子元素间距由 `fix.scss:34` 提供。**页面内禁止重写这些 flex 样式**。
- **禁止给 `el-header` 加 `style="height: auto;"`**：合并行只有一排控件，用 Element Plus 默认 60px 高度即可。`height: auto` 是独立 `.search-wrap` 多行形态才需要的（§4.1）。
- **组件间距不用自己写**：全局 `.right-panel-search > * + * { margin-left: 10px }`（`src/style/app.scss:79-80`）已负责筛选组件之间、以及组件与搜索按钮之间的间距。**禁止**再补 `margin-right` / `margin-left` 凑间距（历史页面出现过 `style="width: 160px; margin-right: 8px;"`，其中 `margin-right` 是多余的，新页面不要照抄）。
- **只有宽度需要行内声明**：`dict-select` / `sc-date-picker` 等下拉与日期组件给固定 `style="width: 160px;"`（区间日期可放宽到 `220px`～`240px`），`el-input` 用组件默认宽度即可，不要写 `width: 100%`（合并行不是栅格，`100%` 会撑爆 `.right-panel`）。
- **搜索按钮固定在最右**，`type="primary"` + `icon="el-icon-search"`、只留图标不带文字，绑定 `upsearch`；文本类筛选组件加 `@keyup.enter="upsearch"` 回车即搜。
- **`.left-panel` 只放业务动作按钮**，不要把搜索/重置挪进来；没有业务按钮时整个 `.left-panel` 省略，`.right-panel` 会被 `space-between` 推到左侧，此时改为在 `.right-panel` 上补 `margin-left: auto` 保持筛选靠右。
- **每个筛选组件必须 `clearable`** —— 合并形态不渲染重置按钮，`clearable` 是唯一的清空手段。

#### 2.5.4 两条红线的豁免（重要）

合并形态是**唯一**可以豁免下面两条红线的场景，Code Review 时不要按红线判不合格：

| 红线 | 独立 `.search-wrap` 形态 | 合并形态（≤ 2 条件） | 豁免理由 |
|---|---|---|---|
| 红线 2 / §3：筛选组件必须加 prefix | 必须 | **不加 prefix，改用 `placeholder`** | 一行里要塞下按钮 + 筛选 + 搜索，prefix 文字与 placeholder 语义重复且挤占宽度 |
| 红线 22 / §2.4：搜索后必须紧跟重置 | 必须 | **不渲染重置按钮** | 条件 ≤ 2 且全部 `clearable`，逐个清空成本低于多放一个按钮 |

> 条件数从 2 增到 3 时，必须整体改回独立 `.search-wrap` 形态：补回 `el-row`/`el-col :span="8"` 栅格、补回 prefix、补回重置按钮，并删掉 `el-header` 合并行。**不能只在合并行里再塞一个组件**，一行放 3 个筛选 + 搜索 + 功能按钮会溢出。
>
> 反向同理：条件从 3 减到 2，必须塌缩成合并行，不能留着只有 2 个 `el-col` 的 `.search-wrap` 空占一行。

#### 2.5.5 现有参照页面

本项目已按此形态实现的页面（可直接对照抄结构）：`setting/position`、`setting/role`、`setting/dept`、`setting/tenant`、`setting/fileConfig`、`setting/message/smsTemplate`、`setting/message/site`、`setting/message/mailAccount`。其中 **`setting/role/index.vue` 是「2 个筛选条件（dict-select + el-input）+ 新增按钮」的标准样例**。


---

## 3. 筛选组件 prefix 前缀规范（强制）

**所有筛选组件必须使用 prefix（原生插槽或组件 props）。**

> **唯一豁免**：检索条件 ≤ 2 个、走 §2.5「二三层合并一行」形态时，筛选组件**不加 prefix，改用 `placeholder`**。本节其余规则只约束独立 `.search-wrap` 形态。

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
  placeholder="税率名称"
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
  placeholder="排序"
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

---

## 4. 第三层：按钮（操作栏，可选）

> 第三层 `el-header` 为**可选结构**：有新增、批量操作等按钮时添加，无按钮时直接省略。
> 本层只放**业务动作按钮**；「搜索 / 重置 / 展开收起」属于第二层，不要挪到这里。
> **例外**：检索条件 ≤ 2 个时二三层合并，搜索按钮随筛选组件一起进 `el-header` 的 `.right-panel-search`，此时**不写** `style="height: auto;"` —— 详见 §2.5，合并形态的完整写法以 §2.5.2 为准，不要用本节 4.1 的骨架。

### 4.1 有操作按钮时（新增、批量操作等）

适用条件：检索条件 **≥ 3 个**，第二层是独立的 `.search-wrap`。

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

### 4.3 检索条件 ≤ 2 个时（二三层合并，不单独写第三层）

不再有「只有 `.left-panel` 的第三层」，功能按钮与筛选条件同处一个 `el-header`，骨架见 **§2.5.2**。要点复述：

- 无 `style="height: auto;"`
- 无 `.search-wrap`、无 `el-row`/`el-col`
- `.left-panel` 功能按钮置左，`.right-panel` > `.right-panel-search` 筛选 + 搜索按钮置右
- 页面 `<style scoped>` 里不写任何相关样式，全局已覆盖

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
    // search 里只放检索条件字段，不放其它状态；searchCollapsible 依赖这一约定
    // 字段按声明顺序每 3 个切一行，只有末行可以不满
    search: {
      // 第1行（常显，满 3 个）
      taxName: "",
      taxCode: "",
      taxStatus: null,
      // 第2行（可折叠，2 个，空缺在行尾）
      unitType: null,
      createTimeRange: null,
    },
    // 仅在检索条件 > 3 个时声明；≤ 3 个时删掉本行
    searchExpanded: false,
  };
}
```

```javascript
computed: {
  // 仅在检索条件 > 3 个时声明；条件增减后展开/收起按钮自动跟随，无需手改模板
  searchCollapsible() {
    return Object.keys(this.search).length > 3;
  }
}
```

> **search 字段名必须使用 camelCase**，与 Java 接口查询参数保持一致。
> **`search` 的字段数决定展开/收起按钮是否出现**：上例 5 个字段 > 3，故渲染按钮；若裁到 3 个以内，需同时删掉第 2 行 `el-row`、展开/收起按钮、`searchExpanded` 与 `searchCollapsible`（详见 §2.3）。

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

  // 搜索
  upsearch() {
    const params = { ...this.search };
    // 处理状态查询：单值转 List
    if (params.taxStatus === null || params.taxStatus === '') {
      delete params.taxStatus;
    } else {
      params.taxStatusList = [params.taxStatus];
      delete params.taxStatus;
    }
    // 日期范围数组转逗号分隔字符串
    if (params.createTimeRange && Array.isArray(params.createTimeRange)) {
      params.createTimeRange = params.createTimeRange.join(',');
    }
    this.$refs.table.upData(params);
  },

  // 重置搜索条件
  resetSearch() {
    this.search = {
      // 将所有字段重置为初始值
      taxName: "",
      taxCode: "",
      taxStatus: null,
      unitType: null,
      createTimeRange: null,
    };
    // 清空搜索参数并重新加载表格
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
| ✅ | 页面自上而下固定四层：头部 Tab（可选）→ 检索条件 → 按钮（可选）→ 表格（§1.1）；**检索条件 ≤ 2 个时二三层合并为一行，页面变三层（§2.5）** |
| ✅ | 检索条件必须一行 3 个（`:span="8"`），按声明顺序从左到右填满（§2.1）——**仅适用于独立 `.search-wrap` 形态（条件 ≥ 3）** |
| ✅ | **条件 ≤ 2 个时必须合并为一行：`.left-panel` 功能按钮置左、`.right-panel` > `.right-panel-search` 筛选 + 搜索按钮置右（§2.5）** |
| ✅ | **合并形态下筛选组件必须 `clearable`（它是不渲染重置按钮后唯一的清空手段）（§2.5.3）** |
| ✅ | 只有最后一行允许少于 3 个，且空缺只能在行尾；中间行必须满 3 个（§2.1） |
| ✅ | 新增/删除/调整检索条件后必须整体重排，仍满足一行 3 个（§2.1） |
| ✅ | **条件数跨越 2↔3 时必须整体切换形态，不能只增删一个组件（§2.5.4）** |
| ✅ | 展开/收起按钮**只在检索条件 > 3 个时渲染**；≤ 3 个时必须完全不渲染（§2.3） |
| ✅ | 条件 > 3 个时，第 2 行起必须挂 `:class="{'default-hide': !searchExpanded}"`（§2.3） |
| ✅ | 展开/收起的出现与否统一由 `searchCollapsible` computed 判定，禁止手写死 `v-if="true/false"`（§2.3） |
| ✅ | 第二层容器统一用 `class="search-wrap"`，禁止把容器样式写成行内 `style`（§2.2）——合并形态不用 `.search-wrap` |
| ✅ | 搜索按钮后面必须紧跟重置按钮（**合并形态豁免，不渲染重置按钮**，§2.5.4） |
| ✅ | 头部 Tab 只写 `label`+`name`，内容为空；切换用 `reload()` 而非 `upData()`（§1.3） |
| ✅ | 所有筛选组件必须加 prefix（按 3.1-3.4 规范）——**合并形态豁免，改用 `placeholder`**（§2.5.4） |
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
| ❌ | 禁止中间留空或用空 `el-col` 占位、禁止把 `span` 写成 6/12/16/24 来凑行 |
| ❌ | 禁止在 ≤ 3 个条件时渲染展开/收起按钮（点了无反应的死结构） |
| ❌ | 禁止在 > 3 个条件时漏掉展开/收起按钮（折叠行将永远无法展开） |
| ❌ | **禁止在条件 ≤ 2 个时仍拆成 `.search-wrap` + `el-header` 两层（会留大片空白）** |
| ❌ | **合并形态禁止给 `el-header` 加 `style="height: auto;"`（默认 60px 够用，`height:auto` 只属于多行 `.search-wrap` 形态）** |
| ❌ | **合并形态禁止在页面 `<style scoped>` 重写 `.left-panel` / `.right-panel` / `.right-panel-search` 的 flex 与间距（全局 `fix.scss:31-34`、`app.scss:79-80` 已覆盖）** |
| ❌ | **合并形态禁止用 `margin-right`/`margin-left` 凑组件间距；`el-input` 禁止 `width: 100%`（会撑爆 `.right-panel`）** |
| ❌ | **禁止在合并行里塞第 3 个筛选组件（按钮 + 3 筛选 + 搜索必然溢出，应整体改回 `.search-wrap` 形态）** |
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

- **条件 > 3（独立 `.search-wrap` 多行 + 展开收起）**：参见 `demos/index.vue`
- **条件 ≤ 2（二三层合并一行，功能置左、筛选置右）**：参见项目内 `src/views/setting/role/index.vue`（2 个筛选条件 + 新增按钮的标准样例），骨架与约定见 §2.5.2

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
