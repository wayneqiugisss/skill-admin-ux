# 表单型抽屉卡片化规范 — form-drawer-card-rule.md

编辑/配置型抽屉在 `el-drawer` 内承载 `el-form`，内容分块统一采用**卡片化布局**（禁止 `el-divider` 分割线），卡片内字段统一**一行三格**。本文件定义卡片结构、栅格规则、通栏例外、组件白名单、样式惯例与 `append-to-body` 的 scoped 落点坑。

---

## 1. 标准结构

```
el-drawer（size="75%" direction="rtl" append-to-body :close-on-click-modal="false"）
├── el-form.drawer-form（label-width="100px" :model :rules :disabled="readonly"）
│   ├── el-card.form-card（shadow="never"）        ← 分区块 1「基本信息」
│   │   ├── #header → span.card-title
│   │   └── el-row（:gutter="20"）
│   │        ├── el-col :span="8" → el-form-item   ← 一行三格
│   │        ├── el-col :span="8" → el-form-item
│   │        ├── el-col :span="8" → el-form-item
│   │        └── el-col :span="24" → el-form-item  ← 通栏例外（见 §3）
│   └── el-card.form-card（shadow="never"）        ← 分区块 2 …
└── #footer → 取消 / 确定
```

```html
<el-form ref="formRef" class="drawer-form" :model="form" :rules="rules" :disabled="readonly" label-width="100px">
	<el-card class="form-card" shadow="never">
		<template #header><span class="card-title">基本信息</span></template>
		<el-row :gutter="20">
			<el-col :span="8">
				<el-form-item label="属性编码" prop="code">
					<el-input v-model="form.code" placeholder="英文稳定标识" clearable />
				</el-form-item>
			</el-col>
			<el-col :span="8">
				<el-form-item label="属性名称" prop="name">
					<el-input v-model="form.name" placeholder="如 样品类型" clearable />
				</el-form-item>
			</el-col>
			<el-col :span="8">
				<el-form-item label="组件类型" prop="componentType">
					<dict-select dict-code="component_type" v-model="form.componentType" style="width: 100%;" />
				</el-form-item>
			</el-col>
			<!-- 通栏例外：备注 -->
			<el-col :span="24">
				<el-form-item label="备注" prop="remark">
					<el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
				</el-form-item>
			</el-col>
		</el-row>
	</el-card>
</el-form>
```

---

## 2. 一行三格（强制）

**卡片内所有字段一律 `el-row :gutter="20"` + `el-col :span="8"`，一行三个。** 无论页面原来是单列、两列还是散排，接入本规范时都要整理成一行三格。

- `span` 固定为 8（24 ÷ 3），**禁止** 6 / 12 / 16，**禁止**两列布局
- 字段按 `form` 对象声明顺序从左到右连续填满
- **只有末行允许少于 3 个，且空缺只能落在行尾（右侧）**
- **禁止**裸放 `el-form-item`（不套 `el-row`/`el-col`），也**禁止**用空 `el-col` 占位
- 增删字段后必须**整体重排**，不许只在末尾追加而让上一行出现空洞
- `v-if` 控制的字段同样计入排序 —— 显隐切换后若出现中间空洞，改用 `v-show` 或把该字段移到卡片末尾

> Code Review 用「逐行数 `el-col`」核对：任何一行数量不是 3（末行与通栏项除外）即为不合格。

### 2.1 尺寸前提（不满足则三格挤不下）

| 项 | 取值 | 说明 |
|---|---|---|
| 抽屉宽度 | **≥ `75%`** | `50%` 下每格约 200px，扣掉 label 后控件不足 100px，禁止三格 |
| `label-width` | **`100px`**（上限 `120px`） | 原单列的 `120px` 在三格下偏挤；标签超 5 字须缩短文案而非加宽 |
| `label-position` | **不写（默认 left）** | 禁止 `label-position="top"` —— 顶部标签在三格下会变成三列高塔，行高失控 |
| 控件宽度 | **`style="width: 100%;"`** | 禁止 `width: 260px` 等定宽，否则同行长短不齐 |
| `el-row` | `:gutter="20"` | 与列表页检索区同值 |

### 2.2 只读态（查看）同样三格

`readonly` 时用 `el-descriptions :column="3" border` 替代表单，与编辑态的三格视觉对齐：

```html
<el-card class="form-card" shadow="never">
	<template #header><span class="card-title">企业资料</span></template>
	<el-descriptions :column="3" border>
		<el-descriptions-item label="法定代表人">{{ detail.legalPerson || '—' }}</el-descriptions-item>
		<el-descriptions-item label="联系人">{{ detail.contactPerson || '—' }}</el-descriptions-item>
		<el-descriptions-item label="联系电话">{{ detail.contactPhone || '—' }}</el-descriptions-item>
		<!-- 通栏例外同样 :span="3" -->
		<el-descriptions-item label="详细地址" :span="3">{{ detail.address || '—' }}</el-descriptions-item>
	</el-descriptions>
</el-card>
```

> 通栏字段在 `el-descriptions` 里写 `:span="3"`（占满三列），与编辑态的 `:span="24"` 一一对应。

---

## 3. 通栏例外（`:span="24"`）

只有下列类型允许通栏，其余一律三格。**例外项放在所属卡片的末尾，或独立成一张卡**，避免打断三格序列造成视觉空洞。

| 类型 | 组件 | 通栏原因 |
|---|---|---|
| 备注 / 多行文本 | `el-input type="textarea"` | 需要横向书写空间 |
| 地址 | 省市区级联（`el-cascader`）+ 详细地址（`el-input`） | 组合控件，拆开无意义 |
| 富文本 | `sc-editor` | 编辑器工具栏需要整宽 |
| 多图上传 | `sc-upload-multiple` | 缩略图横排 + 上传按钮 |
| 文件上传 | `sc-upload-file` | 文件列表纵向排列 |
| 视频上传 | `sc-upload-video` | 预览画面需要宽度 |
| 内嵌子表 | `sc-form-table` / `sc-table` | 表格需要整宽 |
| 提示条 | `el-alert` | 整宽提示 |

> **单图上传（`sc-upload`）占一格即可** —— 默认 `148×148` 在 75% 抽屉的一格内放得下；只有把 `width`/`height` 调大时才升级为通栏。
> **数字输入不是例外** —— `el-input-number` 占一格（`controls-position="right"`），不要通栏。

---

## 4. 组件白名单（禁止自研、禁止自绘）

上传、数字、日期、字典、选表等能力**必须使用组件库现成组件**，禁止自绘 `el-upload`、禁止自己封装一套上传/选择器。

| 用途 | 必须使用 | 是否全局注册 | 禁止 |
|---|---|---|---|
| 单图上传 | `<sc-upload>` | ✅ 全局 | 自绘 `el-upload`、自研裁剪弹窗 |
| 多图上传 | `<sc-upload-multiple>` | ✅ 全局 | 自绘 `el-upload` 列表态 |
| **文件上传** | `<sc-upload-file>` | ✅ 全局 | `ScFileUpload`（未全局注册）、自研文件控件 |
| 视频上传 | `<sc-upload-video>` | ✅ 全局 | 自研 |
| 数字 | `<el-input-number controls-position="right">` | ✅ 全局 | `el-input type="number"` |
| 日期 / 日期范围 | `<sc-date-picker>` | ❌ 需 import | `el-date-picker` 混用、PascalCase `<ScDatePicker>` |
| 字典下拉 / 单选 | `<dict-select>` / `<dict-radio>` | ❌ 需 import | 手写 `el-option` 枚举字典值 |
| 表格选择器 | `<sc-table-select>` | ✅ 全局 | 自研「弹窗选一行」 |
| 内嵌可编辑子表 | `<sc-form-table>` | ✅ 全局 | 自绘 `el-table` + 手写增删行 |
| 图片裁剪 | `scCropper`（`sc-upload` 的 `cropper` prop 已内置） | — | 另引第三方裁剪库 |

> 全局注册清单见 `src/ecxui.js`；`DictSelect` / `ScDatePicker` / `DictRadio` 属**非全局**组件，必须 `import` + `components` 注册。
> 上传组件的 `v-model` 支持 `String` 或 `Array`，`limit` 默认 0（不限）；`sc-upload` 的 `limit` 默认 1。
>
> **文本类补充**：`el-input` 必须带 `clearable` + `placeholder`；多行文本用 `type="textarea"` + `maxlength` + `show-word-limit`（通栏）。字段与表单行为的详细写法（数字精度、字典注册、日期段拆分、三模式提交）见 `save-drawer-rule.md`。

---

## 5. 卡片样式（统一命名 `.form-card`）

分块惯例固定为：卡头浅灰底 `--el-fill-color-light`、卡体 `padding: 18px 18px 0`、卡间距 `16px`。

```css
/* 抽屉内容左右留白 16px，卡片作为板块分区 */
.drawer-form { padding: 4px 16px 0; }
.form-card { margin-bottom: 16px; border-radius: 6px; }
.form-card:last-child { margin-bottom: 0; }
.form-card :deep(.el-card__header) { padding: 10px 16px; background: var(--el-fill-color-light); }
.form-card :deep(.el-card__body) { padding: 18px 18px 0; }
.card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
```

**强制**：

- 卡片类名一律 `.form-card`，表单容器一律 `.drawer-form` —— 禁止按业务另起（`.block-card` / `.field-drawer-form` / `.base-card`）
- **边距不可叠加**：若 `el-form` 由 `el-main` 承载，`el-main` 必须加 `class="nopadding"` —— 全局 `.el-main {padding:15px}` 会与 `.drawer-form` 的 `16px` 叠成 `31px`。`el-form` 直接挂在 `el-drawer` 下时不需要 `nopadding`
- 卡头用 `#header` 插槽内 `<span class="card-title">分区名</span>`，**禁止** `el-divider` 文字分割线
- 颜色一律用 `--el-*` 变量，禁止硬编码色值
- 每个逻辑分块一张卡；同类型的分支项（默认值 / range / 上传 / 枚举选项）用 `v-if` 合并进同一张卡，不要一分支一张卡
- 卡体 `padding: 18px 18px 0` 的「底部 0」依赖最后一个 `el-form-item` 自带的 `18px` 下边距；**只读抽屉**（卡内是 `el-descriptions` / `el-table`，没有 form-item 兜底）改用 `padding: 18px`

---

## 6. append-to-body 下的 scoped 样式落点（关键坑）

`append-to-body` 会把抽屉**传送到 `body`**，此时：

- 本组件 scoped 的 `:deep(.el-drawer__body)` 等**深穿透 Element Plus 外层容器选择器可能不命中**（DOM 已脱离本组件渲染子树，`data-v` scope 属性不在外层容器上）；
- 但**定义在本组件模板内的元素**（`el-form`、`el-card` 及其 `:deep(.el-card__header/.el-card__body)`）即使随抽屉传送**仍保留 `data-v` scope 标记**，样式正常生效。

**因此：**

- ✅ 样式落点必须放在**本组件模板内元素**上（`.drawer-form` / `.form-card` / `:deep(.el-card__*)`）；
- ❌ 禁止依赖深穿透 `.el-drawer__body` 等 EP 外层容器（传送后不命中，样式静默失效）。

---

## 7. footer 与文案

### 7.1 `#footer` 插槽

底部操作区直接用 `#footer` 插槽，**不在内容区自绘按钮行**：

```html
<template #footer>
	<el-button @click="visible = false">取消</el-button>
	<el-button v-if="!readonly" type="primary" @click="submit">确定</el-button>
</template>
```

- `#footer` **只放提交类按钮**（取消 / 确定 / 保存）；新增、批量、导入导出等业务动作按钮属列表型抽屉的 `el-header`（见 `drawer-layout-rule.md` §2）
- 历史页面用 `el-container > el-footer` 承载底部按钮与 `#footer` 等价，**同一模块内保持一种写法**，不为统一而重写既有页面
- `readonly`（查看）态隐藏提交按钮、禁用表单控件（`el-form :disabled="readonly"`）

### 7.2 标题与操作文案

- 列表行操作按钮文案由「编辑」统一改为「**配置**」；
- 抽屉标题 `prefix` 与模式同步：`查看 / 新增 / 配置`（+ 实体名，如「配置动态字段」）；
- `size`/`direction` 遵循 `drawer-layout-rule.md`（表单型统一 `direction="rtl"` + `:close-on-click-modal="false"` 防误点遮罩丢失填写；三格布局下 `size` ≥ `75%`）。

---

## 8. 契约方法（供父级调用）

表单型抽屉作为子组件时，推荐命令式 `open(data)` 由父级注入数据并打开（详见 `drawer-comm-rule.md`），并在关闭时 `@closed`/`handleClosed` 复位内部状态（`form`、模式标记、临时弹层键等），避免下次打开残留。
