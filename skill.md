---
name: admin-ux
description: 后台页面与抽屉的统一开发规范——列表页四层结构（头部Tab/检索条件/按钮/表格）、检索条件一行三个与展开收起、筛选≤2个时按钮与筛选合并一行、左右分类面板布局、API模型与字段命名；抽屉部分覆盖列表型抽屉（el-drawer+el-container+sc-table、drawer-table-main、按钮全在el-header、子抽屉通信与数据刷新）、表单型抽屉与 save.vue（el-card 卡片化 + 一行三格 span=8、通栏例外清单、上传/数字/日期组件白名单禁自研、append-to-body 样式落点、#footer、add/mod/view 三模式与提交契约、共用 Tab 的 profile 适配）。Use when the user asks to create admin CRUD pages, list/save pages, drawer-based list or form/config drawers, 后台CRUD/列表页/新增编辑/表单页/检索条件/搜索区/Tab分层/筛选与按钮同行/抽屉列表/定价配置/SKU管理/规则配置/动态字段配置/表单抽屉/卡片表单/一行三格/上传组件.
---

# Skill: admin-ux — 后台列表页与抽屉统一开发规范

## 技能定位

本技能把后台页面拆成两类载体，用**一套规则**串起来：

1. **列表页（index.vue）** —— `el-container` 内四层结构（头部 Tab / 检索条件 / 按钮 / 表格），可退化为二三层合并行，也可变成「左分类 + 右列表」。
2. **抽屉（el-drawer）** —— 三类形态：
   - **列表型抽屉**：抽屉内「一张表 + 行操作」，用 `el-container` + `sc-table`；
   - **表单型抽屉**：抽屉内「表单 + 分块」，用 `el-card` 卡片化 + 一行三格；
   - **保存表单 save.vue**：表单型抽屉的特化，承载 add / mod / view 三模式与提交契约。

配套的 API 模型、字段命名、样式块、父子通信、跨模块共用（profile）一并收在本技能内，**不再区分「CRUD 技能」与「抽屉技能」**。

## 目录分工

| 文件 | 功能 |
|---|---|
| `README.md` | 技能总览、适用技术栈、快速入门 |
| `rules/field-naming-rule.md` | 表结构 snake_case → 前端 camelCase 字段命名映射 |
| `rules/api-model-rule.md` | API 模型目录、命名空间写法、RESTful 五方法、重复 key 排错 |
| `rules/list-page-rule.md` | 列表页**四层结构**（§1）、检索条件一行三个（§2.1）、展开收起（§2.3）、**≤2 个条件二三层合并**（§2.5）、prefix（§3）、scTable 与操作列（§5–§6）、script 骨架（§7）、**左右布局左侧分类面板**（§11） |
| `rules/style-css-rule.md` | 列表页标准样式块（`.page-tabs`/`.search-wrap`/`.prefix-label`/`.left-panel`/`.default-hide`）与四层落点、合并形态零样式（§2.3.1） |
| `rules/drawer-layout-rule.md` | 两类抽屉骨架（§1）、列表型按钮归位（§2）、表格边距 `.drawer-table-main`（§3）、**宽度档位与 px/el-dialog 例外**（§4）、类型判定（§6） |
| `rules/form-drawer-card-rule.md` | **表单型抽屉单一事实来源**：卡片化（§1）、一行三格与尺寸前提（§2）、通栏例外（§3）、组件白名单（§4）、卡片样式块（§5）、`append-to-body` 落点（§6）、footer（§7） |
| `rules/save-drawer-rule.md` | **save.vue 行为契约**：骨架属性（§1）、组件用法补充（§2）、add/mod/view 三模式（§3）、日期段拆分合并（§4）、校验（§5）、submit（§6）、emits（§7） |
| `rules/drawer-comm-rule.md` | 子抽屉/对话框通信（`v-model:visible` / `open()`）、`@refresh`/`@confirm` 刷新与引用重定位 |
| `rules/shared-tab-profile-rule.md` | 两模块共用同一套 Tab / 抽屉的「档案（profile）+ 适配器」规范、零回归红线 |
| `demos/api-model-demo.js` | API 模型完整代码（可复制） |
| `demos/index.vue` | 列表页完整代码（5 个检索条件 → 3+2 两行 + 展开收起） |
| `demos/side-panel.vue` | 左右布局左侧分类面板骨架（过滤 + 可拖拽树 + 行操作 + `side-*` 样式块） |
| `demos/save.vue` | 列表页配套的 save.vue 抽屉表单完整代码 |
| `demos/list-drawer-demo.vue` | 列表型抽屉完整代码（`drawer-table-main` + 行 CRUD + 子抽屉 + 刷新） |
| `demos/form-drawer-demo.vue` | 表单型卡片抽屉完整代码（`el-card` 分区 + 一行三格 + 通栏例外 + 上传系列 + footer） |
| `assets/` | 预留：布局结构图、卡片分区示意图、父子通信流程图 |

## 按需复用方式

- **快速新建模块**：`demos/` 下按载体取文件 —— 列表页 `index.vue`，抽屉 `save.vue` / `list-drawer-demo.vue` / `form-drawer-demo.vue`，左侧面板 `side-panel.vue`，接口 `api-model-demo.js`
- **理解规范细节**：查 `rules/` 对应文件，逐条对照
- **团队 Code Review**：以「开发红线」+ 各 `rules/` 中「强制要求 / 禁止写法」为审查依据

## 页面骨架总览

### 列表页四层（自上而下，顺序不可调换、不可插第五层）

| 层级 | 名称 | 载体 | 必需 |
|---|---|---|---|
| 第一层 | 头部 Tab | `div.page-tabs` > `el-tabs` | 可选 — 仅同一实体多视图切换时 |
| 第二层 | 检索条件 | `div.search-wrap` | 必需（无检索条件可整层省略） |
| 第三层 | 按钮 | `el-header` > `.left-panel` | 可选 — 有新增/批量操作时 |
| 第四层 | 表格 | `el-main.nopadding` > `scTable` | 必需 |

> 「搜索 / 重置 / 展开收起」属**第二层**尾部，**不是**第三层；第三层只放业务动作按钮。

**两个分支形态**：

- **合并形态（检索条件 ≤ 2 个）**：第二层与第三层塌缩为同一个 `el-header`（页面变三层），**功能按钮置左（`.left-panel`）、筛选条件置右（`.right-panel` > `.right-panel-search`）**；不用 `.search-wrap`、不用 `el-row`/`el-col`、不写任何页面样式，豁免 prefix 与重置按钮两条红线。
- **左右布局**：业务有稳定分类维度（标签组→标签、单位类型→单位、部门→人员、商品分组→商品）时改为「左分类 + 右列表」，左侧固定 `el-aside width="280px"` + `side-*` 面板，右侧仍是四层结构。

### 抽屉三类

| 形态 | 骨架要点 | 参考 |
|---|---|---|
| 列表型 | `el-drawer(75%, rtl)` > `el-container(vertical)` > `el-header.drawer-header`（业务按钮全在此）+ `el-main.drawer-table-main` > `sc-table` | `drawer-layout-rule.md` §1.1、`demos/list-drawer-demo.vue` |
| 表单型 | `el-drawer(≥75%, rtl, append-to-body)` > `el-form.drawer-form` > `el-card.form-card` × N > `el-row :gutter="20"` > `el-col :span="8"` × 3 + `#footer` | `form-drawer-card-rule.md`、`demos/form-drawer-demo.vue` |
| save.vue（CRUD） | 表单型骨架 + `size="75%"` + `destroy-on-close` + add/mod/view 三模式 + `emits['success','closed']` | `save-drawer-rule.md`、`demos/save.vue` |

> 选择依据：内容主体是「表 + 行操作」→ 列表型；是「表单 + 分块」→ 表单型；是「新增/编辑/查看某个实体」→ save.vue。三者可嵌套：列表型抽屉的行操作打开 save.vue 或表单型子抽屉。

## 开发红线（强制约束）

### A. 字段与接口

1. **字段名一律 camelCase** —— 与 Java 接口返回一致，禁止 snake_case（`tax_code` → `taxCode`），覆盖 `search`/`form`/`rules`/`prop`/`submitData`/`setData`，详见 `field-naming-rule.md`
2. **API 路径统一 `${API.b2b.微服务名}/ControllerName`** —— 禁止 `config.API_URL` 拼接
3. **RESTful**：`add` 用 `POST`、`mod` 用 `PUT`、`delete` 用 `DELETE {id}`，禁止全部 `POST`
4. **创建人/更新人由后端自动填充** —— 前端不传 `cuser`/`uuser`/`createBy`/`updateBy`
5. **同一 `export default` 对象禁止重复命名空间 key** —— 会触发 ESLint `no-dupe-keys`，后者静默覆盖前者导致接口 404
6. **submitData 必须显式逐字段构造**（禁 `{...this.form}`）；**setData 必须显式逐字段赋值**（禁 `{...data}`）

### B. 列表页

7. **四层结构与层序不可变** —— 头部 Tab → 检索条件 → 按钮 → 表格；「搜索/重置/展开收起」留在第二层尾部
8. **内层 `<el-container>` 必须显式 `direction="vertical"`** —— 否则省略 `el-header` 时会退化为水平布局
9. **头部 Tab 只做视图切换** —— `el-tab-pane` 只写 `label` + `name`、内容为空；切换用 `reload()`（替换参数回第一页）而非 `upData()`；Tab 已覆盖的字段不得在检索区重复
10. **检索条件一行三个** —— 每条件 `<el-col :span="8">`，按 `search` 声明顺序连续填满；只有末行可少于 3 个且空缺只能在行尾；禁止空 `el-col` 占位、禁止 `:span="6/12/16/24"`；增删条件后整体重排
11. **展开/收起按条件数条件渲染** —— 条件 **> 3** 必须渲染且第 2 行起挂 `:class="{'default-hide': !searchExpanded}"`；**≤ 3** 必须完全不渲染（连 `searchExpanded`/`searchCollapsible`/`.default-hide` 一起删）；判定统一走 `searchCollapsible` computed
12. **检索条件 ≤ 2 个必须二三层合并为一行** —— 单个 `el-header`，功能置左、筛选置右、搜索最右；不用 `.search-wrap`、不用 `el-row`/`el-col`、不加 `style="height: auto;"`、页面样式一条不写（全局 `fix.scss:31-34`、`app.scss:79-80` 已覆盖）；筛选组件必须 `clearable`，并**豁免 prefix（改 `placeholder`）与重置按钮**；条件数 2↔3 跨越时必须整体换形态
13. **第二层容器用 `class="search-wrap"`** —— 禁止行内 `style="height:auto;width:100%;padding:..."`；`el-input` 的 `#prefix` 文字用 `<span class="prefix-label">`，禁止逐处行内 `color:#909399`；页面样式逐字复制 `style-css-rule.md` §1 并按实际层数裁剪
14. **搜索按钮后必须紧跟重置按钮** —— `resetSearch` 把 `search` 所有字段重置为初始值再 `upData({})`（合并形态豁免）
15. **左右布局左侧面板形态统一** —— `el-aside width="280px"` + `side-header` + `el-main.nopadding` > `.side-tree-wrap` > `el-tree.menu.side-tree` + `el-footer`；class 一律 `side-*`，行高 36px 由全局 `.el-tree.menu` 提供，页面禁止自定义
16. **删除/危险操作必须 `this.$confirm()` 二次确认**（禁 `el-popconfirm`），确认逻辑写在 handler 内；删除只能 `splice` 局部更新，不整页重载
17. **mod 成功后必须 `get.get(data.id)` 重查后端最新数据再 `Object.assign` 更新行** —— 禁止用 `submitData` 直接覆盖行

### C. 抽屉

18. **列表页/入口表单的抽屉用 `el-drawer` + `direction="rtl"`**，宽度用百分比档位（`25%`/`50%`/`75%`/`90%`/`100%`），**禁止 `:size="600"` 数字绑定与 px 单位**；`75%` 为默认档（一行三格表单、列表型抽屉），`50%` 仅用于字段 ≤ 3 的单列表单与嵌套子抽屉；例外清单见 `drawer-layout-rule.md` §4.1
19. **列表型抽屉：内容区必须 `el-container` 包裹**（显式 `direction="vertical"`），`el-main` 用 **`class="drawer-table-main"`** 提供两边/底部 16px、顶部 12px 留白，**不再用 `nopadding`**
20. **列表型抽屉：所有业务按钮放 `el-header` > `.left-panel`** —— 行内按钮只出现在表格**操作列**（`fixed="right"`）；取消/确定/保存只放 `#footer`
21. **无 `el-header` 时 `el-main` 必须加 `style="border-top:1px solid var(--el-border-color-light);"`**；**有 `el-header` 时禁止再加**（双线）；禁止硬编码 `#EBEEF0`
22. **表格统一 `sc-table`（禁原生 `el-table`）**，必须 `stripe border`，无分页场景必须 `hide-pagination`，空状态用 `<template #empty>` + `el-empty :image-size="60"`
23. **表单型抽屉必须卡片化** —— `el-card class="form-card" shadow="never"` + `#header` 内 `span.card-title`，禁止 `el-divider`；类名统一 `.form-card`/`.drawer-form`/`.card-title`，禁止按业务另起
24. **卡内字段一行三格** —— `el-row :gutter="20"` + `el-col :span="8"`，按 `form` 声明顺序连续填满，只有末行可缺且缺在行尾；禁止 `:span="12/16"` 两列、禁止裸放 `el-form-item`、禁止 `label-position="top"`；`label-width="100px"`、控件 `style="width: 100%;"`；view 态用 `el-descriptions :column="3" border` 对齐；承载 `el-form` 的 `el-main` 必须 `class="nopadding"`
25. **通栏例外（`:span="24"`）只有清单内那几类** —— 备注/多行文本 `textarea`、地址（省市区级联 + 详细地址）、富文本 `sc-editor`、多图 `sc-upload-multiple`、文件 `sc-upload-file`、视频 `sc-upload-video`、内嵌子表 `sc-form-table`/`sc-table`、提示条 `el-alert`；例外项放卡片末尾或独立成卡。**单图 `sc-upload` 占一格，数字 `el-input-number` 不是例外**
26. **上传等能力必须用组件库现成组件，禁止自研自绘** —— `sc-upload` / `sc-upload-multiple` / `sc-upload-file` / `sc-upload-video`（`src/ecxui.js` 全局注册）；禁止自绘 `el-upload`、禁止用未全局注册的 `ScFileUpload`、禁止另引第三方裁剪库；选表用 `sc-table-select`、内嵌子表用 `sc-form-table`
27. **`DictSelect`/`DictRadio`/`ScDatePicker` 必须 import + components 注册**，日期一律 kebab-case `<sc-date-picker>`；**数字必须 `el-input-number` + `controls-position="right"`**（禁 `el-input type="number"`）
28. **`append-to-body` 抽屉的 scoped 样式必须落在本组件模板内元素上** —— 禁止依赖深穿透 `.el-drawer__body` 等 EP 外层容器（传送后不命中，样式静默失效）
29. **`#footer`（或 `el-container > el-footer`）只放提交类按钮** —— `readonly`/`view` 态隐藏提交按钮、`:disabled` 禁用表单；同一模块内只保留一种底部写法
30. **每个 save.vue 必须实现 add/mod/view 三模式** —— `titleMap` + `open(mode)` 链式返回 + `setData` 逐字段回填 + `emits: ['success','closed']`；`@closed` 复位内部状态
31. **子抽屉/对话框与父 `el-drawer` 同级放置** —— 通过 `append-to-body` 浮层，不嵌进父 `el-container`；宽度须比父小至少一档（降到 `50%` 后改回单列）
32. **同一模块打开方式统一** —— 全用 `v-model:visible` 或全用 `open()`，不混用；数据变更靠 `@refresh`/`@confirm` 通知父级回刷，父级 `loadData()` 后必须按稳定标识（`id`/`code`/`productSkuCode`）重新定位并替换当前引用
33. **两模块 Tab/抽屉高度相似时禁止复制副本** —— 走「共用组件 + 每模块一份 profile（键名映射 + 显示文案）」；新增 props 默认值必须等于原模块现状，改完回归原模块

## 标准开发流程

```
Step 1  定义 API 模型
  → src/api/model/ 下新建模块文件（require.context 自动挂载，无需注册）
  → list/get/add/mod/delete 五方法，mod=PUT、delete=DELETE {id}
  → 检查顶级命名空间 key 是否唯一
  → api-model-rule.md + demos/api-model-demo.js

Step 2  转换字段名
  → DDL snake_case → camelCase，系统字段统一 createTime/updateTime/createBy/updateBy
  → field-naming-rule.md §4（识别业务字段 → 转驼峰 → 按类型选组件）

Step 3  列表页 index.vue
  → 先定层：要不要第一层 Tab？第三层有没有按钮？
  → 再数检索条件总数，选形态：
      · ≤ 2 → 二三层合并一行（功能置左 / 筛选置右 / 搜索最右），不写页面样式
      · = 3 → 独立 .search-wrap 单行，el-col :span="8" ×3 + prefix + 搜索 + 重置
      · > 3 → 独立 .search-wrap 多行，第 2 行起 default-hide + 展开收起 + searchCollapsible
  → 有稳定分类维度 → 改左右布局，左侧照抄 demos/side-panel.vue 的 side-* 面板
  → 表格 scTable(stripe border remoteSort remoteFilter) + 操作列 fixed="right"
  → list-page-rule.md + demos/index.vue

Step 4  抽屉
  → 先判定形态：
      · 表 + 行操作        → 列表型（el-container + drawer-table-main + 按钮全在 el-header）
      · 表单 + 分块（非CRUD）→ 表单型（el-card.form-card + 一行三格）
      · 增删改查某实体      → save.vue（表单型 + add/mod/view 三模式）
  → 表单型排字段：按 3 个一行切分，通栏例外（备注/地址/富文本/多图/文件/视频/子表/提示）挑到卡片末尾
  → 逐行数 el-col：任何一行不是 3 个（末行与通栏项除外）即不合格
  → 选组件：上传 sc-upload 系列、数字 el-input-number、日期 sc-date-picker、字典 dict-select/dict-radio
  → 定宽度：>=75%（三格）/ 列表型 75% / 子抽屉降一档
  → 接通信：open() 或 v-model:visible，保存后 @refresh 回刷 + 重定位引用
  → drawer-layout-rule.md / form-drawer-card-rule.md / save-drawer-rule.md / drawer-comm-rule.md

Step 5  补样式
  → 列表页：逐字复制 style-css-rule.md §1，按层数裁剪（无 Tab 删 .page-tabs、无按钮删 .left-panel、条件 ≤3 删 .default-hide）
  → 合并形态：一条都不写（全部由全局提供）
  → 列表型抽屉：.drawer-table-main / .drawer-header / .left-panel
  → 表单型抽屉：.drawer-form / .form-card / .card-title（落本组件模板元素，避开 append-to-body 深穿透坑）
  → 校验：删掉无对应 DOM 的死样式，不写行内容器 style

Step 6  若新模块与既有模块高度相似
  → 不建副本：先对齐数据模型 → 给共用组件加 props（默认=现状）→ 写 profile 对象 → 薄入口页照抄骨架 → 删除此前的自研实现
  → shared-tab-profile-rule.md
```

## 单一事实来源（避免规则打架）

| 主题 | 只认这个文件 |
|---|---|
| 列表页结构 / 检索条件 / 合并形态 / 左右面板 | `rules/list-page-rule.md` |
| 列表页样式块 | `rules/style-css-rule.md` |
| 抽屉宽度档位、列表型骨架与表格边距 | `rules/drawer-layout-rule.md` |
| 表单型卡片化、一行三格、通栏例外、组件白名单、卡片样式 | `rules/form-drawer-card-rule.md` |
| save.vue 三模式、校验、提交、emits | `rules/save-drawer-rule.md` |
| 子抽屉通信与刷新 | `rules/drawer-comm-rule.md` |
| 跨模块共用 Tab / 抽屉 | `rules/shared-tab-profile-rule.md` |
| 字段命名 / API 模型 | `rules/field-naming-rule.md`、`rules/api-model-rule.md` |
