# 抽屉骨架与布局规范 — drawer-layout-rule.md

本文件定义两类抽屉的骨架结构、列表型表格形态（`el-container`/`el-header`/`el-main` 与边距）、抽屉宽度档位与布局强制约束。表单型抽屉的容器选型（对话框 vs 抽屉）、档位与列数判定、卡片分区见 `form-drawer-card-rule.md`。

---

## 1. 两类骨架总览

### 1.1 列表型抽屉（承载 sc-table）

```
el-drawer（size="75%" direction="rtl"）
├── el-container（direction="vertical"）
│   ├── el-header.drawer-header（可选 —— 有操作按钮时使用，所有业务按钮都放这里）
│   │   └── .left-panel → 新增 / 批量操作 / 导入导出
│   └── el-main.drawer-table-main（两边 16px + 底部 16px）
│       └── sc-table（hide-pagination）
│           ├── el-table-column × N
│           └── 操作列（fixed="right"，行内唯一按钮位）
├── #footer（可选 —— 只放取消/确定/保存）
│
── 独立子组件（与 el-drawer 同级，通过 append-to-body 浮层） ──
├── xxx-edit-drawer   （编辑抽屉，open() / v-model:visible + @save）
├── xxx-detail-dialog （详情对话框，v-model:visible + :data）
└── xxx-panel-drawer  （二级列表抽屉，v-model:visible + @refresh）
```

### 1.2 表单型抽屉（承载 el-form）

```
el-drawer（size 按 W：50% / 75% / 90%，direction="rtl" append-to-body :close-on-click-modal="false"）
├── el-form.drawer-form（label-width="100px"）
│   ├── el-card.form-card（shadow="never"）  ← 分区块，#header → span.card-title
│   │   └── el-row :gutter="20" → el-col × 列数（窄 1 列 span=24 / 中 2 列 span=12 / 宽 3 列 span=8，通栏例外 :span="24"）
│   └── el-card.form-card（shadow="never"）  ← 分区块 …
└── #footer → 取消 / 确定
```

> 当 `N ≤ 6` 且 `L ≤ 1` 时**不建抽屉**，改用 `el-dialog`（420px / 560px、单列、不卡片化），骨架见 `form-drawer-card-rule.md` §1.1。
> 详细栅格、通栏例外、组件白名单与 `append-to-body` 落点见 `form-drawer-card-rule.md`。

### 1.3 查询条件型列表抽屉（头部多行检索 + 明细表）

当抽屉内容是「检索条件 + 一张明细表」（积分流水、订单明细、操作日志等）时用本骨架。它是列表型的变体：头部不再是「业务按钮行」，而是「多行检索条件 + 独立操作行」。

```
el-drawer（size="75%" direction="rtl" append-to-body destroy-on-close）
├── el-container（direction="vertical"）
│   ├── el-header.drawer-header（必须 display:block + height:auto，见 §3.2）
│   │   ├── el-row :gutter="16" → el-col :span="8" ×3（第1行条件）
│   │   ├── el-row（第2行低频条件，v-show="searchExpanded"）
│   │   └── .xxx__actions → 搜索 / 重置 / 展开收起（独立一行、左对齐）
│   └── el-main.drawer-table-main
│       └── sc-table（带分页，不写 hide-pagination）
└── #footer（可选 —— 纯明细无提交动作可省略，靠右上 X / ESC 关闭）
```

要点：

- **主体由 `open(row)` 锁定**（客户/订单等），合并进 `apiObj` 随每次请求带上，检索区不重复选择；`destroy-on-close` 保证每次打开以新条件重建表格。
- **条件一行三个**（`el-col :span="8"`），低频条件放第 2 行可收起；操作行（搜索/重置/展开）独立成行，不与条件混排。
- **头部必须 `display:block`** —— 全局 `fix.scss` 把 `.el-header` 设成 flex 横排，不覆盖会把条件行与操作行挤到同一行（见 §3.2）。
- **明细表通常带分页**，不写 `hide-pagination`；空状态用 `<template #empty>` + `el-empty`。
- **`#footer` 非必须**：纯明细（无提交动作）省略，靠右上 X / ESC 关闭；仅有提交类按钮时才加 `#footer`（红线 #29）。
- 可复制代码：`demos/list-drawer-search-demo.vue`。

---

## 2. 列表型：按钮归位（强制）

**所有业务动作按钮一律放 `el-header`，不允许散落在内容区。**

| 按钮类型 | 唯一落点 | 禁止落点 |
|---|---|---|
| 新增 / 批量删除 / 导入 / 导出 | `el-header` > `.left-panel` | 表格上方自绘 div、表格下方、卡片头 |
| 行内「配置 / 删除 / 查看」 | 表格**操作列**（`fixed="right"`） | 表格外的行按钮组 |
| 取消 / 确定 / 保存（整抽屉提交） | `#footer` 插槽 | 内容区末尾自绘按钮行 |

```html
<el-container direction="vertical">
	<el-header class="drawer-header">
		<div class="left-panel">
			<el-button type="primary" icon="el-icon-plus" @click="addRule">新增规则</el-button>
			<el-button icon="el-icon-delete" :disabled="!selection.length" @click="batchRemove">批量删除</el-button>
		</div>
	</el-header>
	<el-main class="drawer-table-main">
		<sc-table :data="rules" stripe border hide-pagination @selection-change="v => selection = v">
			<el-table-column type="selection" width="50" />
			<el-table-column prop="name" label="规则名称" min-width="160" />
			<!-- 行内按钮只出现在这一列 -->
			<el-table-column label="操作" width="140" align="center" fixed="right">
				<template #default="scope">
					<el-button text type="primary" size="small" @click="editRule(scope.row)">配置</el-button>
					<el-button text type="danger" size="small" @click="removeRule(scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</sc-table>
	</el-main>
</el-container>
```

- `el-header` **可选**：无任何业务按钮时整层省略，**禁止保留空 `el-header`**
- `.left-panel` 负责按钮水平排列与垂直居中（`display: flex; align-items: center;`）
- 省略 `el-header` 后，内层 `<el-container>` 的 `direction="vertical"` 尤其不能省（EP 会按子元素自动检测方向，退化成 `row` 导致内容横向排列）

---

## 3. 列表型：表格边距（强制）

表格**不得裸贴抽屉边缘**。`el-main` 统一用 `.drawer-table-main` 提供两边与底部留白：

```css
/* 两边 16px 与表单型 .drawer-form 对齐；底部 16px 防止表格/分页条贴住抽屉底边 */
.drawer-table-main { padding: 12px 16px 16px; box-sizing: border-box; }
.drawer-header { height: auto; padding: 8px 16px; }
.left-panel { display: flex; align-items: center; }
```

| 部位 | 值 | 原因 |
|---|---|---|
| 左 / 右 | **16px** | 与表单型 `.drawer-form` 的 16px 同值，两类抽屉切换时内容起始线对齐 |
| 底部 | **16px** | 抽屉底边与表格（或空状态 `el-empty`）之间留呼吸位，避免贴死 |
| 顶部 | **12px** | 与 `el-header` 底边框或抽屉标题栏拉开距离 |
| `el-header` 左右 | **16px** | 覆盖 EP 默认 `0 20px`，让按钮与表格左边缘对齐 |

> **不再使用 `class="nopadding"`** —— 它把内边距清零，表格会贴住抽屉三边。旧页面接入本规范时把 `nopadding` 换成 `drawer-table-main`。
>
> **适用范围**：本节只约束**直接承载 `sc-table` 的 `el-main`**。若 `el-main` 承载的是 `el-tabs`，各 Tab 内的表单已自带 `.drawer-form` 的 16px 左右留白，此时仍用 `nopadding`，否则会双重内边距（参见 `shared-tab-profile-rule.md` §3.3）。

### 3.1 有 / 无 el-header 的分隔线

| 场景 | el-header | el-main 附加样式 | 原因 |
|---|---|---|---|
| 有操作栏 | **有** | 无 | `el-header` 自带底边框，已提供分隔 |
| 无操作栏（纯表格展示） | **无** | `style="border-top:1px solid var(--el-border-color-light);"` | 抽屉标题栏与表格间无自然分隔 |

```html
<!-- 无 el-header 时 -->
<el-container direction="vertical">
	<el-main class="drawer-table-main" style="border-top:1px solid var(--el-border-color-light);">
		<sc-table :data="skuList" stripe border v-loading="loading" hide-pagination>
			<!-- 列定义 -->
		</sc-table>
	</el-main>
</el-container>
```

- **有 `el-header` 时禁止再加 `border-top`** —— 重复边框造成双线
- 分隔线颜色用 `var(--el-border-color-light)`，禁止硬编码 `#EBEEF0`（暗色主题会失效）

### 3.2 多行检索头部必须 display:block（覆盖全局 flex）

全局 `src/style/fix.scss:31` 把 `.el-header` 统一设为 `display:flex; justify-content:space-between; align-items:center`（服务于列表页按钮行）。当 `el-header` 承载「多行检索条件 + 独立操作行」时，多个子块（`el-row` 条件行、操作 `div`）会被当成 flex 项挤在同一行，日期等控件被压扁。

**修复**：给该 `el-header` 的 scoped 类显式 `display:block`（并 `height:auto`）；scoped 属性选择器优先级高于全局 `.el-header`。

```css
.drawer-header {
	display: block;   /* 必须：覆盖全局 flex 横排 */
	height: auto;     /* 必须：覆盖 EP 默认 60px，否则第二行被裁掉 */
	padding: 12px 16px;
}
.xxx__row { margin-top: 12px; }                                       /* 条件行间距 */
.xxx__actions { display: flex; align-items: center; margin-top: 12px; } /* 操作行独立 */
```

- **多行头部必须 `display:block`**；只有单行按钮行（`.left-panel` 形态）才可沿用全局 flex。
- 项目 `selectDrawer.css` 有同样注释佐证，可交叉参考。
- 权威样式块见 `style-css-rule.md` §4。

---

## 4. 抽屉宽度档位（强制）

抽屉宽度统一为百分比档位，一律使用字符串写法，**禁止 `:size="1200"` 数字绑定与 `size="900px"` px 单位**。表单型抽屉的档位**由可并排字段数 `W` 决定**（判定见 `form-drawer-card-rule.md` §0、§2）：

| 档位 | `size` | 表单型适用（列数 ↔ `W`） | 其他适用场景 |
|---|---|---|---|
| **窄** | `50%` | **1 列**，`W = 1–8` | 单实体详情、极简配置 |
| **中** | `75%` | **2 列**，`W = 9–16` | 列表型抽屉默认档、比对/配置 |
| **宽** | `90%` | **3 列**，`W ≥ 17` | 审核工作台、多栏布局、报名列表 |
| `25%` | `25%` | 不用（列数不足） | 轻量操作：分配、导出、日志查看 |
| `100%` | `100%` | 不用 | 特例保留：装修设计器、订单/履约详情等全屏工作台 |

- **列数与档位绑定，不允许错配** —— 1 列走 `50%`、2 列走 `75%`、3 列走 `90%`；`50%` 下禁止两列及以上（每格约 200px，扣掉 100px label 后控件不足 100px）
- **字段 ≤ 6 且通栏项 ≤ 1 的新增/编辑表单用 `el-dialog`，不是抽屉** —— 宽度 `420px`（≤3 字段）/ `560px`（4–6 字段），见 `form-drawer-card-rule.md` §1
- **嵌套降档规则**：`append-to-body` 二级子抽屉必须比父抽屉小至少一档（父 75% → 子 50%，父 90% → 子 75%），保证层级视觉可辨。子抽屉降到 `50%` 后固定 1 列
- **小屏保护**：`src/style/fix.scss` 已对 `.el-drawer.rtl` 设置 `min-width: 420px`，页面内无需重复处理

### 4.1 px 定宽与 `el-dialog` 例外（已确认）

百分比档位是默认，以下两类例外必须同时满足各自的约束：

| 例外 | 适用 | 约束 |
|---|---|---|
| `append-to-body` 的**共用子抽屉 / 共用弹窗**允许 px 定宽 | 共用字段抽屉 `960px`、共用判定弹窗 `900px`、共用规则抽屉 `880px` | 必须**小于父抽屉**；父级用百分比时小屏可能出现子宽于父的倒挂，需注意 |
| **单实体轻量表单**允许用共用 `el-dialog` | 如「转报价判定」弹窗 `900px` | 必须**跨模块共用同一弹窗组件**，不为此再写一套 `el-drawer` |
| **字段 ≤ 6 且通栏项 ≤ 1 的新增/编辑表单**用 `el-dialog` | `420px`（`N ≤ 3`）/ `560px`（`N = 4–6`） | 这是**强制选型**不是例外：字段数达标就必须用对话框，见 `form-drawer-card-rule.md` §1 |

> CRUD 的 save.vue（add/mod/view）走 `save-drawer-rule.md`；它复用本节档位表，不另立宽度标准。

---

## 5. 组件与表格约束

1. **表格统一使用 `sc-table`** —— 禁止使用原生 `el-table`，`sc-table` 提供内置空状态、列设置等能力（`el-descriptions` 只读展示除外）
2. **无分页场景必须设置 `hide-pagination`** —— 子列表通常不分页，隐藏分页栏
3. **表格必须有 `stripe border`** —— 与列表页表格同款观感
4. **操作列 `fixed="right"`** —— 横向滚动时行操作始终可见
5. **空状态用 `<template #empty>` + `el-empty`** —— `:image-size="60"`，不写「暂无数据」裸文本
6. **子抽屉/对话框与 `el-drawer` 同级放置** —— 通过 `append-to-body` 浮层，不嵌套在 `el-container` 内
7. **内容区禁止裸放手写 `div`/`sc-table`** —— 一律经 `el-container` → `el-main.drawer-table-main` 承载
8. **上传、数字、日期、字典、选表等能力必须用组件库现成组件** —— 禁止自绘 `el-upload`、禁止自研选择器，白名单见 `form-drawer-card-rule.md` §4

---

## 6. 类型判定指引

| 内容主体 | 选择 | 参考 |
|---|---|---|
| 一张表 + 行内 CRUD / 批量操作 | 列表型 | `demos/list-drawer-demo.vue` |
| 检索条件 + 一张明细表（带分页） | 查询条件型列表型 | `demos/list-drawer-search-demo.vue`、§1.3 |
| 一组表单项 + 分块编辑 | 表单型（按 `W` 定档与列数） | `demos/form-drawer-demo.vue` |
| 字段很少（`N ≤ 6` 且 `L ≤ 1`） | 对话框（420px / 560px） | `form-drawer-card-rule.md` §1.1 |
| 新增 / 编辑 / 查看业务实体（add/mod/view） | 表单型 + 三模式 | `save-drawer-rule.md`、`demos/save.vue` |
| 列表抽屉的行操作再打开编辑表单 | 列表型（父 75%）+ 表单型（子 50%，单列） | 两个 demo 组合 |
| 只读详情展示 | 表单型骨架 + `el-descriptions`（`:column` 与列数一致） | `form-drawer-card-rule.md` §2.2 |
