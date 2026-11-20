# 表单型容器规范（对话框 / 抽屉 / 卡片栅格）— form-drawer-card-rule.md

新增、编辑、配置类表单**不再一律「抽屉 + 一行三格」**，改为：**先按字段量判容器（对话框 or 抽屉），再按可并排字段数判列数（一列 / 两列 / 三列）**。本文件是容器选型、栅格判定、卡片分区、通栏例外、组件白名单、样式惯例与 `append-to-body` scoped 落点的单一事实来源。

---

## 0. 计分口径（判定前必须先算）

| 量 | 定义 | 计法 |
|---|---|---|
| `N` | 表单可见 `el-form-item` 数量 | 取 add / mod / view 中**最多**的一态；`v-if` 控制的字段**全部计入**（如按存储类型出现的地域、按渠道出现的 SDKAppId） |
| `L` | 通栏例外项数量 | 只统计 §3 表内的类型；单图 `sc-upload`、`el-input-number`、`el-switch`、日期选择**都不算**通栏 |
| `W` | 可并排字段数 | `W = N − L` |

> 例：`setting/user` 新增态 13 个字段 + 1 个备注 textarea → `N=13`、`L=1`、`W=12`。

---

## 1. 容器选型（强制）

| 条件 | 容器 | 尺寸 |
|---|---|---|
| `N ≤ 6` 且 `L ≤ 1` | **`el-dialog`** | `N ≤ 3` → `width="420px"`；`4 ≤ N ≤ 6` → `width="560px"` |
| `N ≥ 7` | **`el-drawer`** | 按 §2 选窄 / 中 / 宽 |
| `N ≤ 6` 但 `L ≥ 2` | **`el-drawer`** | 按 §2（≥2 个通栏块会把对话框撑出滚动条） |

判定理由：≤6 个字段塞进抽屉后，右侧 1/4 屏是空的、标题栏 56px 白占，交互成本高于对话框；一旦出现 2 个以上通栏块（如正文 + 备注），对话框必须内部滚动，交互退化，回抽屉更稳。

### 1.1 对话框骨架

```html
<el-dialog
  :title="titleMap[mode]"
  v-model="visible"
  width="560px"
  destroy-on-close
  :close-on-click-modal="false"
  append-to-body
  @closed="$emit('closed')"
>
  <el-form ref="dialogForm" class="dialog-form" :model="form" :rules="rules" :disabled="mode=='show'" label-width="100px">
    <el-row :gutter="20">
      <el-col :span="24"><!-- 表单项 --></el-col>
      <el-col :span="24"><!-- 通栏例外项 --></el-col>
    </el-row>
  </el-form>
  <template #footer>
    <el-button @click="visible=false">{{ $t('common.cancel') }}</el-button>
    <el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submit()">{{ $t('common.save') }}</el-button>
  </template>
</el-dialog>
```

- 对话框内**不做卡片分区**（字段少，卡片反而割裂），一律 `:span="24"` 单列
- 类名 `.dialog-form`（**不是** `.drawer-form`），`el-dialog__body` 自带 16px 内边距，只补 `padding: 0 4px;`
- 四项契约换成：`width` 档位 + `destroy-on-close` + `:close-on-click-modal="false"` + `@closed`
- `N ≤ 6` 的表单**禁止**再包 `el-drawer`

### 1.2 抽屉骨架

```html
<el-drawer :title="titleMap[mode]" v-model="visible" size="75%" direction="rtl" destroy-on-close :close-on-click-modal="false" @closed="$emit('closed')">
  <el-form ref="dialogForm" class="drawer-form" :model="form" :rules="rules" :disabled="mode=='show'" label-width="100px">
    <el-card class="form-card" shadow="never">
      <template #header><span class="card-title">{{ $t('common.basicInfo') }}</span></template>
      <el-row :gutter="20">
        <el-col :span="12"><!-- 表单项 --></el-col>
        <el-col :span="12"><!-- 表单项 --></el-col>
        <el-col :span="24"><!-- 通栏例外项 --></el-col>
      </el-row>
    </el-card>
  </el-form>
  <template #footer><!-- 只放取消 / 保存 --></template>
</el-drawer>
```

---

## 2. 抽屉档位与列数（按 W 判定）

| `W`（可并排字段数） | 档位 | `size` | 列数 | `el-col` span |
|---|---|---|---|---|
| `1 – 8` | **窄** | `50%` | 1 列 | `24` |
| `9 – 16` | **中** | `75%` | 2 列 | `12` |
| `≥ 17` | **宽** | `90%` | 3 列 | `8` |

**降档修正（命中即取更小列数，只可能降不可能升）**

| 条件 | 修正 |
|---|---|
| `L / N ≥ 0.4` | 一律 **1 列**（通栏块接近一半，多列无意义） |
| 嵌套子抽屉 | 在父档位基础上再降一档，降到 `50%` 后固定 1 列（`drawer-layout-rule.md` §4） |

**排列规则（不分档位，全部强制）**

- 字段按卡片内 `form` 声明顺序从左到右填满；**只有末行允许不足，空缺只能落右侧**
- 禁止空 `el-col` 占位，禁止裸放 `el-form-item`（必须套 `el-row` / `el-col`）
- 通栏项一律 `:span="24"`，放所属卡片末尾或独立成卡，**不得打散并排行**
- 同一张表单内列数必须一致（由 `W` 统一决定），不允许某张卡自行改成别的列数

### 2.1 `label` 与控件宽度

| 项 | 取值 | 说明 |
|---|---|---|
| `label-width` | **`100px`**（上限 `120px`） | 标签超 5 字缩短文案，不要加宽 label |
| `label-position` | **不写（默认 left）** | 禁止 `label-position="top"` |
| 控件宽度 | **`style="width: 100%;"`** | 禁止 `width: 260px` 之类定宽 |
| `el-row` | `:gutter="20"` | 与列表页检索区同值 |
| 单元格最小宽度 | **≥ 260px**（含 label） | 屏宽不足时由档位而非 span 兜底：档位已按 W 收敛 |

### 2.2 只读态（查看）列数对齐

`view` 态用 `el-descriptions border` 替代表单，`:column` 与编辑态列数一致：

- 对话框内固定 `:column="1"`
- 抽屉内 1 列 → `:column="1"`；2 列 → `:column="2"`；3 列 → `:column="3"`
- 通栏项 `:span` 等于列数（1 列 `:span="1"`、2 列 `:span="2"`、3 列 `:span="3"`）

---

## 3. 通栏例外（`:span="24"`）

只有下列类型允许通栏，其余一律按 §2 的列数并排。**例外项放在所属卡片的末尾，或独立成一张卡**。

| 类型 | 组件 | 通栏原因 |
|---|---|---|
| 备注 / 多行文本 | `el-input type="textarea"` | 需要横向书写空间 |
| 地址 | 省市区级联（`el-cascader`）+ 详细地址 | 组合控件，拆开无意义 |
| 富文本 | `sc-editor` | 编辑器工具栏需要整宽 |
| 多图上传 | `sc-upload-multiple` | 缩略图横排 + 上传按钮 |
| 文件上传 | `sc-upload-file` | 文件列表纵向排列 |
| 视频上传 | `sc-upload-video` | 预览画面需要宽度 |
| 内嵌子表 | `sc-form-table` / `sc-table` | 表格需要整宽 |
| 树勾选面板 | `el-tree` | 层级缩进 + 多选需要横向空间（下拉式的 `el-tree-select` 占一格，不算通栏） |
| 提示条 | `el-alert` | 整宽提示 |

> **单图上传（`sc-upload`）不算通栏** —— 默认 148×148，两列的一格内放得下。
> **数字输入不是例外** —— `el-input-number` 占一格（`controls-position="right"`）。
> **开关 / 单选组（≤3 项）也不是例外** —— 占一格即可。

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
| **字典值展示（只读）** | `<sc-dict-label>` | ✅ 全局 | `<el-tag>{{ $DICT.getDictName(...) }}</el-tag>`、页面成对的 `xxxText`/`xxxTagType` |
| 表格选择器 | `<sc-table-select>` | ✅ 全局 | 自研「弹窗选一行」 |
| 内嵌可编辑子表 | `<sc-form-table>` | ✅ 全局 | 自绘 `el-table` + 手写增删行 |
| 图片裁剪 | `scCropper`（`sc-upload` 的 `cropper` prop 已内置） | — | 另引第三方裁剪库 |

> 全局注册清单见 `src/ecxui.js`；`DictSelect` / `ScDatePicker` / `DictRadio` 属**非全局**组件，必须 `import` + `components` 注册。
> 卡片头/详情里的字典值（如认证状态、数据来源）一律 `<sc-dict-label>`：`variant="outline"` 对齐旧 `el-tag effect="plain"`，嵌在句子里用 `variant="text"`；只读展示规则见 `dict-rule.md`。
> 上传组件的 `v-model` 支持 `String` 或 `Array`，`limit` 默认 0（不限）；`sc-upload` 的 `limit` 默认 1。
>
> **文本类补充**：`el-input` 必须带 `clearable` + `placeholder`；多行文本用 `type="textarea"` + `maxlength` + `show-word-limit`（通栏）。字段与表单行为的详细写法（数字精度、字典注册、日期段拆分、三模式提交）见 `save-drawer-rule.md`。

---

## 5. 卡片分区与样式

### 5.1 分区（只对抽屉生效）

| 字段量 | 卡片数 | 要求 |
|---|---|---|
| `N ≤ 8` | **1 张即可** | 不硬凑分区 |
| `N ≥ 9` | **2 – 3 张** | 按「这是什么信息」归类（帐号 / 基本信息 / 组织与权限 / 连接配置 / 内容配置 / 其他设置…），**禁止一个字段一张卡**，也禁止超过 3 张 |

- 卡片顺序：标识类 → 资料类 → 配置/权限类 → 备注类
- 同一张卡内先并排字段、后通栏字段
- 对话框（§1.1）**不卡片化**

### 5.2 样式块（统一命名）

```css
/* 抽屉内容左右留白 16px，卡片作为板块分区 */
.drawer-form { padding: 4px 16px 0; }
.form-card { margin-bottom: 16px; border-radius: 6px; }
.form-card:last-child { margin-bottom: 0; }
.form-card :deep(.el-card__header) { padding: 10px 16px; background: var(--el-fill-color-light); }
.form-card :deep(.el-card__body) { padding: 18px 18px 0; }
.card-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }

/* 对话框：EP 自带 16px，只补 4px */
.dialog-form { padding: 0 4px; }
```

**强制**：

- 卡片类名一律 `.form-card`，抽屉表单容器 `.drawer-form`，对话框表单容器 `.dialog-form` —— 禁止按业务另起（`.block-card` / `.field-drawer-form` / `.base-card`）
- **边距不可叠加**：若 `el-form` 由 `el-main` 承载，`el-main` 必须加 `class="nopadding"` —— 全局 `.el-main {padding:15px}` 会与 `.drawer-form` 的 `16px` 叠成 `31px`。`el-form` 直接挂在 `el-drawer` / `el-dialog` 下时不需要 `nopadding`
- 卡头用 `#header` 插槽内 `<span class="card-title">分区名</span>`，**禁止** `el-divider` 文字分割线
- 颜色一律用 `--el-*` 变量，禁止硬编码色值
- 每个逻辑分块一张卡；同类型的分支项（默认值 / range / 上传 / 枚举选项）用 `v-if` 合并进同一张卡，不要一分支一张卡
- 卡体 `padding: 18px 18px 0` 的「底部 0」依赖最后一个 `el-form-item` 自带的 `18px` 下边距；**只读抽屉**（卡内是 `el-descriptions` / `el-table`，没有 form-item 兜底）改用 `padding: 18px`

---

## 6. append-to-body 下的 scoped 样式落点（关键坑）

`append-to-body` 会把抽屉/对话框**传送到 `body`**，此时：

- 本组件 scoped 的 `:deep(.el-drawer__body)` / `:deep(.el-dialog__body)` 等**深穿透 Element Plus 外层容器选择器可能不命中**（DOM 已脱离本组件渲染子树，`data-v` scope 属性不在外层容器上）；
- 但**定义在本组件模板内的元素**（`el-form`、`el-card` 及其 `:deep(.el-card__header/.el-card__body)`）即使随容器传送**仍保留 `data-v` scope 标记**，样式正常生效。

**因此：**

- ✅ 样式落点必须放在**本组件模板内元素**上（`.drawer-form` / `.dialog-form` / `.form-card` / `:deep(.el-card__*)`）；
- ❌ 禁止依赖深穿透 `.el-drawer__body` / `.el-dialog__body` 等 EP 外层容器（传送后不命中，样式静默失效）。

---

## 7. footer 与文案

### 7.1 `#footer` 插槽

底部操作区直接用 `#footer` 插槽（`el-drawer` 与 `el-dialog` 同名），**不在内容区自绘按钮行**：

```html
<template #footer>
	<el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
	<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submit()">{{ $t('common.save') }}</el-button>
</template>
```

- `#footer` **只放提交类按钮**（取消 / 确定 / 保存）；新增、批量、导入导出等业务动作按钮属列表型抽屉的 `el-header`（见 `drawer-layout-rule.md` §2）
- 历史页面用 `el-container > el-footer` 承载底部按钮与 `#footer` 等价，**同一模块内保持一种写法**
- `mode=='show'`（查看）态隐藏提交按钮并 `:disabled="mode=='show'"` 禁用整个表单

### 7.2 标题与操作文案

- 列表行操作按钮文案由「编辑」统一改为「**配置**」；
- 容器标题 `prefix` 与模式同步：`查看 / 新增 / 配置`（+ 实体名）；
- `size` / `direction` 遵循 `drawer-layout-rule.md`；表单型统一 `direction="rtl"` + `:close-on-click-modal="false"` 防误点遮罩丢失填写。

---

## 8. 契约方法（供父级调用）

表单型容器作为子组件时，推荐命令式 `open(data)` 由父级注入数据并打开（详见 `drawer-comm-rule.md`），并在关闭时 `@closed`/`handleClosed` 复位内部状态（`form`、模式标记、临时弹层键等），避免下次打开残留。

> `el-drawer` 与 `el-dialog` 在 `v-model` / `destroy-on-close` / `@closed` / `#footer` 上完全同构：把 `el-drawer` 换成 `el-dialog` 只需改外层标签与 `size` → `width`，父级 `<save-dialog v-if="dialog.save" @success @closed>` + `open(mode)` / `setData(row)` 的调用契约**零改动**。

---

## 9. 判定示例（本仓校准表）

| 页面 | `N` | `L` | `W` | 结论 |
|---|---|---|---|---|
| `setting/user` 新增编辑 | 13 | 1 | 12 | 抽屉中档 `75%` + 2 列 + 3 卡 |
| `setting/role` 新增编辑 | 9 | 2 | 7 | 抽屉窄档 `50%` + 1 列 + 3 卡 |
| `setting/dept` 新增编辑 | 6 | 1 | 5 | 对话框 `560px` + 1 列 |
| `setting/fileConfig` 新增编辑 | 11 | 1 | 10 | 抽屉中档 `75%` + 2 列 + 3 卡 |
| `setting/message/smsChannel` | 9 | 1 | 8 | 抽屉窄档 `50%` + 1 列 + 2 卡 |
| `setting/message/smsTemplate` | 9 | 2 | 7 | 抽屉窄档 `50%` + 1 列 + 2 卡 |
| `setting/message/site/send` | 4 | 1 | 3 | 对话框 `560px` + 1 列 |

> 字段增删后必须重跑 §0 的三步计数，档位与列数**随 `N` 变化而变**，不允许沿用旧值。
