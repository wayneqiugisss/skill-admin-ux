---
name: admin-ux
description: 后台页面与抽屉的统一开发规范——列表页四层结构（头部Tab/检索条件/按钮/表格）、检索条件配置驱动动态布局（searchFields.js 单一事实来源 + 单 el-row v-for 一行三格自动换行 + row-gap 保留行间距 + 展开收起按可见条件数动态判定 + hiddenKey 裁剪增删自动重排不留缺格）、左右分类面板布局、API模型与字段命名；新增编辑容器按字段量量化选型（N=可见表单项数、L=通栏例外数、W=N−L：N≤6 且 L≤1 用 el-dialog 420/560px，N≥7 或 L≥2 用 el-drawer 窄50%/中75%/宽90%，列数绑定 1/2/3 列，L/N≥0.4 降为单列）、列表型抽屉（el-drawer+el-container+sc-table、drawer-table-main、按钮全在el-header、子抽屉通信与数据刷新）、查询条件型列表抽屉（头部多行检索 display:block + 明细表、footer 可选）、表单型抽屉与 save.vue（el-card 卡片化 + 卡片分区张数、通栏例外清单、上传/数字/日期组件白名单禁自研、append-to-body 样式落点、#footer、add/mod/view 三模式与提交契约、共用 Tab 的 profile 适配）；数据字典规范（scDictLabel 字典值标签、字典编码常量、DICT_TAG_TYPES 色表、dict-select/dict-radio 选择、字典与 i18n 分工）。Use when the user asks to create admin CRUD pages, list/save pages, drawer-based list or form/config drawers, 后台CRUD/列表页/新增编辑/表单页/检索条件/搜索区/动态检索字段/Tab分层/抽屉列表/查询条件抽屉/抽屉明细/定价配置/SKU管理/规则配置/动态字段配置/表单抽屉/卡片表单/一行三格/一行两格/窄抽屉/宽抽屉/对话框表单/字段量判定/上传组件/数据字典展示/字典值标签/scDictLabel/字典编码常量/字典颜色/状态列渲染/认证状态列.
---

# Skill: admin-ux — 后台列表页与抽屉统一开发规范

## 技能定位

本技能把后台页面拆成两类载体，用**一套规则**串起来：

1. **列表页（index.vue）** —— `el-container` 内四层结构（头部 Tab / 检索条件 / 按钮 / 表格），检索条件为配置驱动动态形态（任意条件数同一形态），也可变成「左分类 + 右列表」。
2. **表单型容器** —— 新增 / 编辑按**字段量**先选容器，再定档位：
   - **`el-dialog` 对话框**：字段少（`N ≤ 6` 且 `L ≤ 1`），`420px` / `560px` 两档，单列、**不卡片化**；
   - **`el-drawer` 表单型抽屉**：字段多，按 `W = N − L` 选 **窄 `50%`（1 列）/ 中 `75%`（2 列）/ 宽 `90%`（3 列）**，`el-card` 卡片分区；
   - **保存表单 save.vue**：以上任一容器的特化，承载 add / mod / view 三模式与提交契约。
3. **列表型抽屉** —— 抽屉内「一张表 + 行操作」，用 `el-container` + `sc-table`，与表单型抽屉同属 `el-drawer` 但骨架不同。

配套的 API 模型、字段命名、样式块、父子通信、跨模块共用（profile）一并收在本技能内，**不再区分「CRUD 技能」与「抽屉技能」**。

## 目录分工

| 文件 | 功能 |
|---|---|
| `README.md` | 技能总览、适用技术栈、快速入门 |
| `rules/field-naming-rule.md` | 表结构 snake_case → 前端 camelCase 字段命名映射 |
| `rules/api-model-rule.md` | API 模型目录、命名空间写法、RESTful 五方法、重复 key 排错 |
| `rules/list-page-rule.md` | 列表页**四层结构**（§1）、**配置驱动检索区**（§2：searchFields.js 单一事实来源、单 el-row 一行三格自动换行、row-gap 行间距、动态展开收起、hiddenKey 裁剪与入参折算）、prefix（§3）、scTable 与操作列（§5–§6）、script 骨架（§7）、**左右布局左侧分类面板**（§11） |
| `rules/style-css-rule.md` | 列表页标准样式块（`.page-tabs`/`.search-wrap`/`.search-wrap--dynamic` 模式标识/`.search-fields`/`.prefix-label`/`.left-panel`/`.default-hide`）与四层落点、**抽屉检索头部样式块（§4）** |
| `rules/drawer-layout-rule.md` | 两类抽屉骨架（§1）、**查询条件型列表抽屉（§1.3）**、列表型按钮归位（§2）、表格边距 `.drawer-table-main`（§3）、**多行头部 display:block（§3.2）**、**宽度档位（窄/中/宽）与列数绑定、px 例外**（§4）、类型判定（§6） |
| `rules/form-drawer-card-rule.md` | **表单型容器单一事实来源**：计分口径 N/L/W（§0）、**对话框 vs 抽屉选型**（§1）、**档位与 1/2/3 列判定**（§2）、通栏例外（§3）、组件白名单（§4）、卡片分区与样式块（§5）、`append-to-body` 落点（§6）、footer（§7）、本仓校准表（§9） |
| `rules/save-drawer-rule.md` | **save.vue 行为契约**：骨架属性（§1）、组件用法补充（§2）、add/mod/view 三模式（§3）、日期段拆分合并（§4）、校验（§5）、submit（§6）、emits（§7） |
| `rules/drawer-comm-rule.md` | 子抽屉/对话框通信（`v-model:visible` / `open()`）、`@refresh`/`@confirm` 刷新与引用重定位 |
| `rules/dict-rule.md` | **数据字典单一事实来源**：字典 vs i18n 边界（§1）、`$DICT` 取数链路（§2）、展示组件 `sc-dict-label` 契约与四种用法（§3）、选择组件 `dict-select`/`dict-radio`（§4）、字典编码常量与 `DICT_TAG_TYPES` 色表（§5）、新增字典清单（§6）、Review 红线（§7） |
| `rules/shared-tab-profile-rule.md` | 两模块共用同一套 Tab / 抽屉的「档案（profile）+ 适配器」规范、零回归红线 |
| `demos/api-model-demo.js` | API 模型完整代码（可复制） |
| `demos/index.vue` | 列表页完整代码（配置驱动检索区：单 el-row v-for + 动态展开收起） |
| `demos/search-fields-demo.js` | 检索字段配置完整代码（SEARCH_FIELDS 字段描述契约 + createSearch，可复制） |
| `demos/side-panel.vue` | 左右布局左侧分类面板骨架（过滤 + 可拖拽树 + 行操作 + `side-*` 样式块） |
| `demos/save.vue` | 列表页配套的 save.vue 抽屉表单完整代码 |
| `demos/list-drawer-demo.vue` | 列表型抽屉完整代码（`drawer-table-main` + 行 CRUD + 子抽屉 + 刷新） |
| `demos/list-drawer-search-demo.vue` | 查询条件型列表抽屉完整代码（多行检索头部 display:block + 独立操作行 + 带分页明细表 + footer 可选） |
| `demos/dict-label-demo.vue` | 数据字典展示完整代码（字典列 `dictCode` + 卡片头 `outline` + 句子内 `text` + 多值 / 未命中占位） |
| `demos/form-drawer-demo.vue` | 表单型卡片抽屉完整代码（`el-card` 分区 + 一行三格 + 通栏例外 + 上传系列 + footer） |
| `assets/` | 预留：布局结构图、卡片分区示意图、父子通信流程图 |

## 按需复用方式

- **快速新建模块**：`demos/` 下按载体取文件 —— 列表页 `index.vue` + 检索字段配置 `search-fields-demo.js`，抽屉 `save.vue` / `list-drawer-demo.vue` / `form-drawer-demo.vue`，左侧面板 `side-panel.vue`，数据字典展示 `dict-label-demo.vue`，接口 `api-model-demo.js`
- **理解规范细节**：查 `rules/` 对应文件，逐条对照
- **团队 Code Review**：以「开发红线」+ 各 `rules/` 中「强制要求 / 禁止写法」为审查依据

## 页面骨架总览

### 列表页四层（自上而下，顺序不可调换、不可插第五层）

| 层级 | 名称 | 载体 | 必需 |
|---|---|---|---|
| 第一层 | 头部 Tab | `div.page-tabs` > `el-tabs` | 可选 — 仅同一实体多视图切换时 |
| 第二层 | 检索条件 | `div.search-wrap.search-wrap--dynamic` > `el-row.search-fields`（配置驱动 v-for，左缘主色竖条模式标识） | 必需（无检索条件可整层省略） |
| 第三层 | 按钮 | `el-header` > `.left-panel` | 可选 — 有新增/批量操作时 |
| 第四层 | 表格 | `el-main.nopadding` > `scTable` | 必需 |

> 「搜索 / 重置 / 展开收起」属**第二层**尾部，**不是**第三层；第三层只放业务动作按钮。

**检索区统一形态（配置驱动）**：全部条件声明在模块 `searchFields.js`（`SEARCH_FIELDS` + `createSearch`），页面用**单个 `el-row.search-fields` + `v-for="visibleSearchFields"`** 渲染，每格 `:span="8"` 自动换行，`row-gap: 10px` 保留行间距；增删 / 隐藏（`hiddenKey`）字段整体自动重排、行内不留缺格；展开收起按可见条件数 > 3 动态判定；入参遍历可见字段按 `normalize` 折算。任意条件数同一形态，**不再有「≤2 个条件二三层合并」的例外**（存量旧形态页面保留现状不强改）。完整规范：`list-page-rule.md` §2。

**分支形态**：

- **左右布局**：业务有稳定分类维度（标签组→标签、单位类型→单位、部门→人员、商品分组→商品）时改为「左分类 + 右列表」，左侧固定 `el-aside width="280px"` + `side-*` 面板，右侧仍是四层结构。

### 抽屉三类

| 形态 | 骨架要点 | 参考 |
|---|---|---|
| 列表型 | `el-drawer(75%, rtl)` > `el-container(vertical)` > `el-header.drawer-header`（业务按钮全在此）+ `el-main.drawer-table-main` > `sc-table` | `drawer-layout-rule.md` §1.1、`demos/list-drawer-demo.vue` |
| 查询条件型列表型 | `el-drawer(75%, rtl)` > `el-container(vertical)` > `el-header.drawer-header`（**display:block**，多行条件 + 独立操作行）+ `el-main.drawer-table-main` > `sc-table`（带分页）；`#footer` 可选 | `drawer-layout-rule.md` §1.3/§3.2、`demos/list-drawer-search-demo.vue` |
| 表单型（抽屉） | 先数 `N`/`L`/`W`：`W 1–8` → `el-drawer(50%, rtl)` + 1 列；`9–16` → `75%` + 2 列（`span=12`）；`≥17` → `90%` + 3 列（`span=8`）> `el-form.drawer-form` > `el-card.form-card` × 1–3 + `#footer` | `form-drawer-card-rule.md` §0–§2、`demos/form-drawer-demo.vue` |
| 表单型（对话框） | `N ≤ 6` 且 `L ≤ 1` → `el-dialog(width 420/560px, append-to-body)` > `el-form.dialog-form` > 单列 `:span="24"`、**不卡片化** + `#footer` | `form-drawer-card-rule.md` §1.1 |
| save.vue（CRUD） | 上述表单型骨架（对话框或抽屉）+ `destroy-on-close` + add/mod/view 三模式 + `emits['success','closed']` | `save-drawer-rule.md`、`demos/save.vue` |

> 选择依据：内容主体是「表 + 行操作」→ 列表型；是「表单 + 分块」→ 表单型，**字段少走对话框、字段多走抽屉**（量化门槛见 `form-drawer-card-rule.md` §1）；是「新增/编辑/查看某个实体」→ save.vue。三者可嵌套：列表型抽屉的行操作打开 save.vue 或表单型子抽屉。

### 数据字典：展示与选择分工

| 用途 | 载体 | 要点 |
|---|---|---|
| 列表单元、卡片头、详情、句子里的字典值 | `<sc-dict-label>` | ✅ 全局注册，无需 import；颜色走 `DICT_TAG_TYPES`，文案走 `$DICT` |
| 表单 / 检索条件里的字典选择 | `<dict-select>` / `<dict-radio>` | ❌ 非全局，必须 import + `components` 注册 |
| 字段中文名 / 页面说法 | i18n `field()` / `page()` | 字典值**不进**语言包 |

- 字典列的列定义只写 `dictCode`（编码取模块 `dict.js` 常量），模板只一个渲染分支，禁止一列一个 slot；
- 禁止 `<el-tag>{{ $DICT.getDictName(...) }}</el-tag>`，也禁止页面成对保留 `xxxText` + `xxxTagType` 方法；
- 完整规范：`dict-rule.md`，可复制代码：`demos/dict-label-demo.vue`。

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
10. **检索条件配置驱动、单 el-row 渲染** —— 全部条件声明在模块 `searchFields.js` 的 `SEARCH_FIELDS`（单一事实来源，含 `createSearch` 初始值工厂）；页面用单个 `el-row.search-fields` + `v-for="visibleSearchFields"`，每格 `:span="8"` 自动换行；禁止手写多个 `el-row` 按行切条件、禁止空 `el-col` 占位、禁止 `:span="6/12/16/24"`；增删 / 隐藏字段自动整体重排，行内不留缺格
11. **行间距保留 + 展开收起动态判定** —— `.search-fields { row-gap: 10px; margin-bottom: 10px; }` 换行后行与行不能贴死；展开/收起由 `searchCollapsible`（可见条件数 > 3）判定，收起时 `index >= 3` 挂 `default-hide`；≤ 3 时入口自动不渲染，`searchExpanded`/`searchCollapsible`/`.default-hide` 常驻骨架无需手工删改
12. **隐藏字段不入参** —— `visibleSearchFields` 按 `hiddenKey` 过滤（与表格列 `showField` 同口径）；入参遍历可见字段按 `normalize` 折算（禁 `{...this.search}` 直传），隐藏字段不下发；重置初始值由 `createSearch()` 派生，禁止手写第二份字面量
13. **第二层容器用 `class="search-wrap search-wrap--dynamic"`** —— `search-wrap--dynamic` 修饰类渲染左缘 3px 主色圆角竖条模式标识（明显但隐蔽，区分配置驱动新形态与旧版手写固定行；旧形态页面不带此修饰类，禁止补挂）；禁止行内 `style="height:auto;width:100%;padding:..."`；`el-input` 的 `#prefix` 文字用 `<span class="prefix-label">{{ field.label }}</span>`，禁止逐处行内 `color:#909399`；**检索条件 input / number 的 placeholder 默认「请输入」+ 字段名**（选择类维持「全部xx / 请选择xx」，见 `list-page-rule.md` §3.5）；页面样式逐字复制 `style-css-rule.md` §1 并按实际层数裁剪
14. **搜索按钮后必须紧跟重置按钮** —— `resetSearch` 用 `createSearch()` 重置全部字段再 `upData({})`
15. **左右布局左侧面板形态统一** —— `el-aside width="280px"` + `side-header` + `el-main.nopadding` > `.side-tree-wrap` > `el-tree.menu.side-tree` + `el-footer`；class 一律 `side-*`，行高 36px 由全局 `.el-tree.menu` 提供，页面禁止自定义
16. **删除/危险操作必须 `this.$confirm()` 二次确认**（禁 `el-popconfirm`），确认逻辑写在 handler 内；删除只能 `splice` 局部更新，不整页重载
17. **mod 成功后必须 `get.get(data.id)` 重查后端最新数据再 `Object.assign` 更新行** —— 禁止用 `submitData` 直接覆盖行

### C. 抽屉

18. **新增/编辑先选容器再定档** —— 数 `N`（可见表单项数，取最多态）与 `L`（通栏例外数）：`N ≤ 6` 且 `L ≤ 1` 必须用 `el-dialog`（`N ≤ 3` → `420px`、`4–6` → `560px`，单列不卡片化）；`N ≥ 7` 或 `L ≥ 2` 用 `el-drawer` + `direction="rtl"`，宽度按 `W = N − L` 取 `50%`/`75%`/`90%`，**禁止 `:size="600"` 数字绑定与 px 单位**；完整判定与例外清单见 `form-drawer-card-rule.md` §0–§2、`drawer-layout-rule.md` §4.1
19. **列表型抽屉：内容区必须 `el-container` 包裹**（显式 `direction="vertical"`），`el-main` 用 **`class="drawer-table-main"`** 提供两边/底部 16px、顶部 12px 留白，**不再用 `nopadding`**
20. **列表型抽屉：所有业务按钮放 `el-header` > `.left-panel`** —— 行内按钮只出现在表格**操作列**（`fixed="right"`）；取消/确定/保存只放 `#footer`
21. **无 `el-header` 时 `el-main` 必须加 `style="border-top:1px solid var(--el-border-color-light);"`**；**有 `el-header` 时禁止再加**（双线）；禁止硬编码 `#EBEEF0`
22. **表格统一 `sc-table`（禁原生 `el-table`）**，必须 `stripe border`，无分页场景必须 `hide-pagination`，空状态用 `<template #empty>` + `el-empty :image-size="60"`
23. **表单型抽屉必须卡片化** —— `el-card class="form-card" shadow="never"` + `#header` 内 `span.card-title`，禁止 `el-divider`；类名统一 `.form-card`/`.drawer-form`/`.card-title`，禁止按业务另起；**卡片张数按字段量**：`N ≤ 8` 可 1 张、`N ≥ 9` 必须 2–3 张；**对话框不卡片化**
24. **卡内列数由档位绑定** —— 窄档 `50%` → 1 列（`:span="24"`）、中档 `75%` → 2 列（`:span="12"`）、宽档 `90%` → 3 列（`:span="8"`），按 `form` 声明顺序连续填满，只有末行可缺且缺在行尾；禁止裸放 `el-form-item`、禁止 `label-position="top"`；`label-width="100px"`、控件 `style="width: 100%;"`；view 态用 `el-descriptions` 同列数对齐；**`L/N ≥ 0.4` 降为单列**；承载 `el-form` 的 `el-main` 必须 `class="nopadding"`
25. **通栏例外（`:span="24"`）只有清单内那几类** —— 备注/多行文本 `textarea`、地址（省市区级联 + 详细地址）、富文本 `sc-editor`、多图 `sc-upload-multiple`、文件 `sc-upload-file`、视频 `sc-upload-video`、内嵌子表 `sc-form-table`/`sc-table`、树勾选面板 `el-tree`、提示条 `el-alert`；例外项放卡片末尾或独立成卡。**单图 `sc-upload` 占一格，下拉树 `el-tree-select` 占一格，数字 `el-input-number` 不是例外**
26. **上传等能力必须用组件库现成组件，禁止自研自绘** —— `sc-upload` / `sc-upload-multiple` / `sc-upload-file` / `sc-upload-video`（`src/ecxui.js` 全局注册）；禁止自绘 `el-upload`、禁止用未全局注册的 `ScFileUpload`、禁止另引第三方裁剪库；选表用 `sc-table-select`、内嵌子表用 `sc-form-table`
27. **`DictSelect`/`DictRadio`/`ScDatePicker` 必须 import + components 注册**，日期一律 kebab-case `<sc-date-picker>`；**数字必须 `el-input-number` + `controls-position="right"`**（禁 `el-input type="number"`）
28. **`append-to-body` 抽屉的 scoped 样式必须落在本组件模板内元素上** —— 禁止依赖深穿透 `.el-drawer__body` 等 EP 外层容器（传送后不命中，样式静默失效）
29. **`#footer`（或 `el-container > el-footer`）只放提交类按钮** —— `readonly`/`view` 态隐藏提交按钮、`:disabled` 禁用表单；同一模块内只保留一种底部写法；**查询条件型列表抽屉（纯明细、无提交动作）可整体省略 `#footer`**，靠右上 X / ESC 关闭
30. **每个 save.vue 必须实现 add/mod/view 三模式** —— `titleMap` + `open(mode)` 链式返回 + `setData` 逐字段回填 + `emits: ['success','closed']`；`@closed` 复位内部状态
31. **子抽屉/对话框与父 `el-drawer` 同级放置** —— 通过 `append-to-body` 浮层，不嵌进父 `el-container`；宽度须比父小至少一档（降到 `50%` 后改回单列）
32. **同一模块打开方式统一** —— 全用 `v-model:visible` 或全用 `open()`，不混用；数据变更靠 `@refresh`/`@confirm` 通知父级回刷，父级 `loadData()` 后必须按稳定标识（`id`/`code`/`productSkuCode`）重新定位并替换当前引用
33. **两模块 Tab/抽屉高度相似时禁止复制副本** —— 走「共用组件 + 每模块一份 profile（键名映射 + 显示文案）」；新增 props 默认值必须等于原模块现状，改完回归原模块

### D. 数据字典

34. **字典值的展示一律用 `<sc-dict-label>`** —— 全局注册，页面无需 import；**禁止**手写 `<el-tag>{{ $DICT.getDictName(...) }}</el-tag>`，**禁止**页面成对保留 `xxxText(value)` + `xxxTagType(value)` 两个方法
35. **字典编码禁止写字面量** —— 统一在模块 `dict.js` 导出 `XXX_DICT_CODE` 常量（如 `SOURCE_TYPE_DICT_CODE = 'user_reg_type'`）；模板里取不到 import 常量就用 computed 暴露，禁止在模板里直接写 `'user_reg_type'`
36. **字典颜色只在 `utils/dict.js` 的 `DICT_TAG_TYPES` 登记** —— 页面不传色值、不写死 `#xxxxxx`；新增字典只改注册表；未登记默认 `info`
37. **字典只答「值 → 显示名」，不进语言包** —— 字段中文名走 `field.*`、页面文案走 `views.*`；字典项里的中文永远不迁入 i18n（与 `skill-admin-i18n` 的边界）
38. **字典选择用 `dict-select` / `dict-radio`，禁手写 `el-option`** —— 两者非全局，必须 import + `components` 注册；同一字段在列表（`sc-dict-label`）与表单（`dict-select`）的 `dict-code` 必须是同一个常量
39. **字典未命中显示占位（`--`），不暴露内部 key** —— `fallback` 仅在后端确实会下发未登记值时开启；禁止在循环体/单元格各自请求字典（`sc-dict-label` 已内建并发去重 + 节流）

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
  → 检索区一律配置驱动（任意条件数同一形态，不再按条件数选形态）：
      · 模块目录建 searchFields.js：SEARCH_FIELDS 声明全部条件（key/label/type/hiddenKey/initial/paramKey/normalize）+ createSearch
      · 单个 el-row.search-fields + v-for visibleSearchFields，每格 span=8 自动换行，row-gap:10px 保留行间距
      · 展开收起走 searchCollapsible（可见数 > 3）；入参遍历可见字段按 normalize 折算
  → 有稳定分类维度 → 改左右布局，左侧照抄 demos/side-panel.vue 的 side-* 面板
  → 表格 scTable(stripe border remoteSort remoteFilter) + 操作列 fixed="right"
  → 字典值列：columns.js 标 dictCode（编码取常量），单元格统一 sc-dict-label → dict-rule.md
  → list-page-rule.md §2 + demos/search-fields-demo.js + demos/index.vue

Step 4  新增/编辑容器（对话框 / 抽屉）
  → 先数：`N` = 可见表单项数（取最多态，v-if 全计）、`L` = 通栏例外项数、`W = N − L`
  → 选容器：`N ≤ 6 且 L ≤ 1` → el-dialog（`N ≤ 3` 420px / `4–6` 560px，单列）；否则 → el-drawer
  → 定档：`W 1–8` → 窄 50% + 1 列；`9–16` → 中 75% + 2 列；`≥17` → 宽 90% + 3 列；降档：`L/N ≥ 0.4` 一律单列
  → 表单型定形态：
      · 表 + 行操作        → 列表型（el-container + drawer-table-main + 按钮全在 el-header）
      · 表单 + 分块（非CRUD）→ 表单型（el-card.form-card，`N ≤ 8` 可 1 张、`N ≥ 9` 2–3 张）
      · 增删改查某实体      → save.vue（表单型/对话框 + add/mod/view 三模式）
  → 排字段：按选定列数（1/2/3）连续填满，通栏例外（备注/地址/富文本/多图/文件/视频/子表/树/提示）挑到卡片末尾
  → 逐行数 el-col：任何一行不足列数（末行与通栏项除外）即不合格
  → 选组件：上传 sc-upload 系列、数字 el-input-number、日期 sc-date-picker、字典选择 dict-select/dict-radio、字典只读展示 sc-dict-label
  → 按上面定：对话框（width 档 + append-to-body + `.dialog-form`）/ 抽屉（size 档 + rtl + `.drawer-form`）；子抽屉降一档
  → 接通信：open() 或 v-model:visible，保存后 @refresh 回刷 + 重定位引用
  → form-drawer-card-rule.md / drawer-layout-rule.md / save-drawer-rule.md / drawer-comm-rule.md

Step 5  补样式
  → 列表页：逐字复制 style-css-rule.md §1，按层数裁剪（无 Tab 删 .page-tabs、无按钮删 .left-panel；.search-fields/.default-hide 常驻不裁剪）
  → 列表型抽屉：.drawer-table-main / .drawer-header / .left-panel
  → 查询条件型列表抽屉：.drawer-header(display:block) / .xxx__row / .xxx__actions / .drawer-table-main（style-css-rule.md §4）
  → 表单型抽屉：.drawer-form / .form-card / .card-title（落本组件模板元素，避开 append-to-body 深穿透坑）
  → 校验：删掉无对应 DOM 的死样式，不写行内容器 style

Step 6  若新模块与既有模块高度相似
  → 不建副本：先对齐数据模型 → 给共用组件加 props（默认=现状）→ 写 profile 对象 → 薄入口页照抄骨架 → 删除此前的自研实现
  → shared-tab-profile-rule.md
```

## 单一事实来源（避免规则打架）

| 主题 | 只认这个文件 |
|---|---|
| 列表页结构 / 配置驱动检索区 / 左右面板 | `rules/list-page-rule.md` |
| 列表页样式块 | `rules/style-css-rule.md` |
| 抽屉宽度档位、列表型骨架与表格边距 | `rules/drawer-layout-rule.md` |
| 容器选型（对话框 vs 抽屉）、N/L/W 计分、档位与列数、卡片张数、通栏例外、组件白名单、卡片样式 | `rules/form-drawer-card-rule.md` |
| save.vue 三模式、校验、提交、emits | `rules/save-drawer-rule.md` |
| 子抽屉通信与刷新 | `rules/drawer-comm-rule.md` |
| 数据字典（展示 `sc-dict-label` / 选择 `dict-select`·`dict-radio` / 编码常量 / 标签色表 / 与 i18n 边界） | `rules/dict-rule.md` |
| 跨模块共用 Tab / 抽屉 | `rules/shared-tab-profile-rule.md` |
| 字段命名 / API 模型 | `rules/field-naming-rule.md`、`rules/api-model-rule.md` |
