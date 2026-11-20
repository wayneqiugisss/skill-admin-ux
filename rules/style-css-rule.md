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

/* 第二层：配置驱动检索区模式标识——左缘 3px 主色圆角竖条（落在左 padding 留白内，不占控件位），
   明显但隐蔽，用于与旧版手写固定行检索区区分；容器挂 search-wrap--dynamic 修饰类 */
.search-wrap--dynamic {
	position: relative;
}
.search-wrap--dynamic::before {
	content: '';
	position: absolute;
	left: 5px;
	top: 10px;
	bottom: 10px;
	width: 3px;
	border-radius: 2px;
	background: var(--el-color-primary);
	opacity: 0.6;
}

/* 第二层：全部条件同一 el-row 自动换行——row-gap 保留行间距（行与行不能贴死），
   条件区与按钮行之间留 10px */
.search-fields {
	row-gap: 10px;
	margin-bottom: 10px;
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

/* 第二层：检索条件折叠（收起时第 4 个起隐藏） */
.default-hide {
	display: none;
}
</style>
```

> **按需裁剪**：第一层无 Tab → 删 `.page-tabs`；第三层无按钮 → 删 `.left-panel`。配置驱动检索区（`list-page-rule.md` §2）下 `.search-wrap` / `.search-wrap--dynamic` / `.search-fields` / `.prefix-label` / `.default-hide` **常驻不裁剪**——可见条件数动态变化，折叠骨架随时可能生效。裁完若一条不剩，可保留空的 `<style scoped></style>` 或整段删除，**不要留无对应 DOM 的死样式**。

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

### 2.2 第二层：检索条件容器（配置驱动，单 el-row）

```html
<div class="search-wrap search-wrap--dynamic">
	<!-- 全部条件同一个 el-row：v-for 每行 3 格自动换行 -->
	<el-row :gutter="20" class="search-fields">…</el-row>
	<!-- 末行按钮：搜索 + 重置 +（展开/收起） -->
	<el-row :gutter="20">…</el-row>
</div>
```

- **禁止**把容器样式写成行内 `style="height: auto; width: 100%; padding: ..."`，一律用 `.search-wrap`
- **模式标识必须挂**：配置驱动检索区容器一律 `class="search-wrap search-wrap--dynamic"`，左缘主色竖条（§1 样式块）是新旧形态的视觉分界——旧版手写固定行页面不带此修饰类，禁止给旧形态页面补挂
- **行间距统一由 `.search-fields` 的 `row-gap: 10px` 提供**（换行产生的行与行之间保持 10px，不能贴死），条件区与按钮行之间由 `margin-bottom: 10px` 提供；**禁止**逐行写 `style="margin-bottom: 10px;"`（旧版多 el-row 写法已废弃），末行（按钮行）不加 `margin-bottom`
- 每格 `<el-col :span="8">` 由 v-for 自动填充，规则见 `list-page-rule.md` §2

### 2.3 第三层：按钮区（可选）

```html
<!-- 有按钮时（第二层是独立 .search-wrap，配置驱动检索区） -->
<el-header style="height: auto;">
	<div class="left-panel">
		<el-button type="primary" icon="el-icon-plus" @click="add">新增模块名</el-button>
	</div>
</el-header>

<!-- 无按钮时：整层省略，第二层下方直接接 el-main -->
```

> `el-header` 的高度用行内 `style="height: auto;"` 覆盖 Element Plus 默认的 `60px`；`.left-panel` 负责按钮的水平排列与垂直居中。

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

> 禁止在每处 prefix 上重复写行内 `style="color: #909399;"`。配置驱动检索区里 prefix 文案统一由字段配置的 `label` 下发（`{{ field.label }}` / `:prefix="field.label"`）。`DictSelect` / `sc-date-picker` 走 `need-prefix` + `prefix` prop，由组件内部渲染，不需要 `.prefix-label`。

### 3.2 el-input-number 宽度

`el-input-number` 在检索区或表单中必须设置 `style="width: 100%;"`，确保占满 `el-col`。

### 3.3 el-select / dict-select / sc-date-picker 宽度

同上，一律 `style="width: 100%;"`，否则组件默认宽度会撑不满 8 栅格，同一行出现长短不齐。

---

## 4. 抽屉检索头部样式块（查询条件型列表抽屉，逐字复制）

抽屉为「多行检索条件 + 明细表」时（骨架见 `drawer-layout-rule.md` §1.3），头部样式块如下。**`display:block` 与 `height:auto` 两条都必须**，否则全局 `fix.scss:31` 的 `.el-header` flex 横排会把条件行与操作行挤到同一行、日期控件被压扁：

```css
/* 多行检索头部：display:block 覆盖全局 flex；height:auto 覆盖 EP 默认 60px */
.drawer-header {
	display: block;
	height: auto;
	padding: 12px 16px;
}
/* 条件行间距（第2行起） */
.xxx__row {
	margin-top: 12px;
}
/* 操作行：搜索/重置/展开独立一行，左对齐 */
.xxx__actions {
	display: flex;
	align-items: center;
	margin-top: 12px;
}
/* 表格不裸贴抽屉三边：两边 16px / 底 16px / 顶 12px */
.drawer-table-main {
	padding: 12px 16px 16px;
	box-sizing: border-box;
}
.xxx__main {
	flex: 1;
	min-height: 0;
	overflow: auto;
}
.prefix-label {
	color: #909399;
}
```

- `xxx` 换成组件 BEM 前缀（如 `points-flow` / `detail-flow`），与模板 class 一致。
- **单行按钮行抽屉**（`.left-panel` 形态）不用本块，沿用全局 flex 与 `drawer-layout-rule.md` §3 的 `.drawer-header { height:auto; padding:8px 16px; }`。
- **`#footer` 可选**：纯明细无提交动作可省略（靠右上 X / ESC 关闭），仅有提交类按钮时才加。
- 可复制完整代码：`demos/list-drawer-search-demo.vue`。
