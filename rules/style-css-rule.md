# 全局样式约定 — style-css-rule.md

本文件给出列表页 `<style scoped>` 的**权威样式块**。四层结构（头部 Tab / 检索条件 / 按钮 / 表格）见 `list-page-rule.md` §1.1，本文只负责样式落点。

---

## 1. 列表页标准样式块（逐字复制）

标准 CRUD 列表页的 `<style scoped>` 只有下面这些，不要按页另起一套：

```css
<style scoped>
/* 第一层：头部 Tab（无 Tab 时连同 .page-tabs 一起删除） */
.page-tabs {
	width: 100%;
	padding: 0 15px;
	box-sizing: border-box;
	background-color: var(--el-bg-color);
	border-bottom: 1px solid var(--el-border-color-light);
}

/* 第二层：检索条件容器 */
.search-wrap {
	width: 100%;
	padding: 10px 15px;
	box-sizing: border-box;
}

/* 第二层：筛选组件 prefix 文字 */
.prefix-label {
	color: #909399;
}

/* 第三层：按钮区（无按钮时连同 .left-panel 一起删除） */
.left-panel {
	display: flex;
	align-items: center;
}

/* 第二层：检索条件折叠行（条件数 ≤ 3 时删除） */
.default-hide {
	display: none;
}
</style>
```

> **按需裁剪**：第一层无 Tab → 删 `.page-tabs`；第三层无按钮 → 删 `.left-panel`；检索条件 ≤ 3 个 → 删 `.default-hide`。**检索条件 ≤ 2 个走「二三层合并一行」形态时，上面整块样式一条都不用写**（`.search-wrap` / `.prefix-label` / `.left-panel` / `.default-hide` 全删），布局与间距全部由全局提供，见 §2.3.1。裁完若一条不剩，可保留空的 `<style scoped></style>` 或整段删除，**不要留无对应 DOM 的死样式**。

---

## 2. 各层落点

### 2.0 el-container 垂直布局（强制）

内层 `<el-container>` **必须**显式设置 `direction="vertical"`：

```html
<el-container direction="vertical">
```

> **原因**：Element Plus 的 `<el-container>` 默认根据直接子元素自动检测方向。若子元素包含 `<el-header>` 或 `<el-footer>` 则为 `column`（垂直排列），否则为 `row`（水平排列）。第三层 `el-header` 被省略时会退化成水平布局，导致检索区与表格区意外左右排列。显式 `direction="vertical"` 消除这种隐式依赖。

### 2.1 第一层：头部 Tab

```html
<div class="page-tabs">
	<el-tabs v-model="activeTab" @tab-change="onTabChange">
		<el-tab-pane label="待审核" name="0"></el-tab-pane>
	</el-tabs>
</div>
```

- 容器 class 固定 `page-tabs`，左右 `15px` 与 `.search-wrap` 对齐
- 底边框用 `var(--el-border-color-light)`，禁止硬编码色值
- `el-tabs` 自带的下边距已够用，不要再在 `.page-tabs` 里加 `margin-bottom`

### 2.2 第二层：检索条件容器

```html
<div class="search-wrap">
	<!-- el-row 若干 + 末行按钮 -->
</div>
```

- **禁止**把容器样式写成行内 `style="height: auto; width: 100%; padding: ..."`，一律用 `.search-wrap`
- 行间距写在 `el-row` 的行内 `style="margin-bottom: 10px;"` 上，**末行（按钮行）不加** `margin-bottom`
- 每行 3 个 `<el-col :span="8">`，规则见 `list-page-rule.md` §2.1

### 2.3 第三层：按钮区（可选）

```html
<!-- 有按钮时（检索条件 ≥ 3，第二层是独立 .search-wrap） -->
<el-header style="height: auto;">
	<div class="left-panel">
		<el-button type="primary" icon="el-icon-plus" @click="add">新增模块名</el-button>
	</div>
</el-header>

<!-- 无按钮时：整层省略，第二层下方直接接 el-main -->
```

> `el-header` 的高度用行内 `style="height: auto;"` 覆盖 Element Plus 默认的 `60px`；`.left-panel` 负责按钮的水平排列与垂直居中。

#### 2.3.1 二三层合并形态（检索条件 ≤ 2 个）——不写任何页面样式

条件 ≤ 2 个时第二层与第三层合并为一行，**功能置左、筛选置右**：

```html
<el-header>
	<div class="left-panel">
		<el-button type="primary" icon="el-icon-plus" @click="add">新增</el-button>
	</div>
	<div class="right-panel">
		<div class="right-panel-search">
			<dict-select dict-code="sys_portal_type" v-model="search.portalType" placeholder="所属端" clearable style="width: 160px;"></dict-select>
			<el-input v-model="search.keyword" placeholder="名称" clearable @keyup.enter="upsearch"></el-input>
			<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
		</div>
	</div>
</el-header>
```

样式全部来自全局，页面 `<style scoped>` 里**一条都不要写**：

| 能力 | 全局来源 | 页面是否要写 |
|---|---|---|
| 左右两端对齐、垂直居中、`padding:13px 15px` | `src/style/fix.scss:31` `.el-header` | 禁止重写 |
| `.left-panel` / `.right-panel` 的 `display:flex; align-items:center` | `src/style/fix.scss:32-33` | 禁止重写 |
| `.right-panel` 子元素间距 `margin-left:10px` | `src/style/fix.scss:34` | 禁止重写 |
| `.right-panel-search` 的 flex + 子元素间距 | `src/style/app.scss:79-80` | 禁止重写 |
| 窄屏自动换行堆叠 | `src/style/media.scss:24-31` `.headerPublic` | 禁止重写 |

三条易错点：

- **不要加 `style="height: auto;"`** —— 合并行只有一排控件，默认 `60px` 够用；`height: auto` 只属于 §2.3 的独立 `.search-wrap` 形态。
- **不要用 `margin-right` 凑间距** —— 间距由 `> * + *` 统一给。历史页面有 `style="width: 160px; margin-right: 8px;"`，那个 `margin-right` 是多余的，新页面别照抄。
- **`el-input` 不要写 `width: 100%`** —— 合并行不是栅格容器，`100%` 会撑爆 `.right-panel`；只有 `dict-select` / `sc-date-picker` 需要给固定宽度（`160px`，区间日期 `220px`～`240px`）。

> 合并形态同时豁免 prefix（改用 `placeholder`）与重置按钮两条红线，理由与完整规范见 `list-page-rule.md` §2.5。

### 2.4 第四层：表格区

```html
<el-main class="nopadding">
```

> `nopadding` 是项目已有的全局样式类，去除 `el-main` 默认 padding。

### 2.5 左侧分类面板（左右布局页专用）

「左分类 + 右列表」页面的左侧面板使用统一 class（`side-aside` / `side-header` / `side-filter-input` / `side-add-row` / `side-tree-wrap` / `side-tree` / `side-node` / `side-node__name` / `side-node__meta` / `side-node__do`），样式块在页面 `<style scoped>` 内**逐字复制**，完整数值表与代码见 `list-page-rule.md` §11 与 `demos/side-panel.vue`。

两条与全局样式的衔接约束：

- **树行高不写在页面里**：`el-tree` 必须带 `menu` class，行高 36px 来自全局 `src/style/fix.scss` 的 `.el-tree.menu .el-tree-node__content { height: 36px }`（与 `setting/menu`、`setting/user` 同源）；页面内只补 `border-radius` / hover / 选中态。历史上各页自写 34px、40px 导致同形面板跨页不一致。
- **颜色一律用 CSS 变量**：`var(--el-bg-color)`、`var(--el-border-color-light)`、`var(--el-fill-color-light)`、`var(--el-color-primary-light-9)`、`var(--el-text-color-secondary)`，禁止硬编码色值，以保证暗色主题跟随。

---

## 3. 组件级样式约定

### 3.1 prefix 文字颜色

`el-input` 的 `#prefix` 插槽内统一用 `<span class="prefix-label">字段名</span>`，颜色由 `.prefix-label` 提供（`#909399`）。

```html
<el-input v-model="search.taxName" placeholder="税率名称" clearable>
	<template #prefix>
		<span class="prefix-label">税率名称</span>
	</template>
</el-input>
```

> 禁止在每处 prefix 上重复写行内 `style="color: #909399;"`。`DictSelect` / `sc-date-picker` 走 `need-prefix` + `prefix` prop，由组件内部渲染，不需要 `.prefix-label`。

### 3.2 el-input-number 宽度

`el-input-number` 在检索区或表单中必须设置 `style="width: 100%;"`，确保占满 `el-col`。

### 3.3 el-select / dict-select / sc-date-picker 宽度

同上，一律 `style="width: 100%;"`，否则组件默认宽度会撑不满 8 栅格，同一行出现长短不齐。
