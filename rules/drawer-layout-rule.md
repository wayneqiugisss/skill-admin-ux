# 抽屉骨架与布局规范 — drawer-layout-rule.md

本文件定义两类抽屉的骨架结构、列表型表格形态（`el-container`/`el-header`/`el-main` 与边距）、抽屉宽度档位与布局强制约束。表单型抽屉的卡片分区与一行三格细节见 `form-drawer-card-rule.md`。

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
el-drawer（size="75%" direction="rtl" append-to-body :close-on-click-modal="false"）
├── el-form.drawer-form（label-width="100px"）
│   ├── el-card.form-card（shadow="never"）  ← 分区块，#header → span.card-title
│   │   └── el-row :gutter="20" → el-col :span="8" × 3（一行三格，通栏例外 :span="24"）
│   └── el-card.form-card（shadow="never"）  ← 分区块 …
└── #footer → 取消 / 确定
```

> 详细栅格、通栏例外、组件白名单与 `append-to-body` 落点见 `form-drawer-card-rule.md`。

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

---

## 4. 抽屉宽度档位（强制）

抽屉宽度统一为百分比档位，一律使用 `size="75%"` 字符串写法，**禁止 `:size="1200"` 数字绑定与 `size="900px"` px 单位**：

| 档位 | 适用场景 |
|---|---|
| `25%` | 轻量操作：分配、导出、日志查看、极简单列表单 |
| `50%` | 单实体详情、字段数 ≤ 3 的简单表单（单列） |
| `75%` | **列表型默认档 + 表单型一行三格默认档**：复杂表单、比对/配置 |
| `90%` | 审核工作台、多栏布局、报名列表 |
| `100%` | 特例保留：装修设计器、订单/履约详情等全屏工作台 |

- **一行三格的表单型抽屉必须 ≥ `75%`** —— `50%` 下每格约 200px，扣掉 100px label 后控件不足 100px（见 `form-drawer-card-rule.md` §2.1）
- **嵌套降档规则**：`append-to-body` 二级子抽屉必须比父抽屉小至少一档（父 75% → 子 50%，父 90% → 子 75%），保证层级视觉可辨。子抽屉降到 `50%` 后**不再适用一行三格**，改回单列
- **小屏保护**：`src/style/fix.scss` 已对 `.el-drawer.rtl` 设置 `min-width: 420px`，页面内无需重复处理

### 4.1 px 定宽与 `el-dialog` 例外（已确认）

百分比档位是默认，以下两类例外必须同时满足各自的约束：

| 例外 | 适用 | 约束 |
|---|---|---|
| `append-to-body` 的**共用子抽屉 / 共用弹窗**允许 px 定宽 | 共用字段抽屉 `960px`、共用判定弹窗 `900px`、共用规则抽屉 `880px` | 必须**小于父抽屉**；父级用百分比时小屏可能出现子宽于父的倒挂，需注意 |
| **单实体轻量表单**允许用共用 `el-dialog` | 如「转报价判定」弹窗 `900px` | 必须**跨模块共用同一弹窗组件**，不为此再写一套 `el-drawer` |

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
| 一组表单项 + 分块编辑 | 表单型（一行三格） | `demos/form-drawer-demo.vue` |
| 新增 / 编辑 / 查看业务实体（add/mod/view） | 表单型 + 三模式 | `save-drawer-rule.md`、`demos/save.vue` |
| 列表抽屉的行操作再打开编辑表单 | 列表型（父 75%）+ 表单型（子 50%，单列） | 两个 demo 组合 |
| 只读详情展示 | 表单型骨架 + `el-descriptions :column="3"` | `form-drawer-card-rule.md` §2.2 |
