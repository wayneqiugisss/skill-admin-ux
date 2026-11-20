# Skill Admin UX — 后台列表页与抽屉统一开发技能包

## 技能概览

本技能包把原先「标准 CRUD 页面」与「抽屉开发」两套规范合并为**一套后台 UI 开发规范**，覆盖从 API 模型、字段命名、列表页四层结构，到新增/编辑容器（对话框 vs 抽屉）、列表型抽屉、save.vue 三模式、父子通信与跨模块共用的完整链路。

> **新增/编辑容器一句话选型**：数出 `N`（可见表单项数）、`L`（通栏例外数）、`W = N − L` —— `N ≤ 6` 且 `L ≤ 1` 用 `el-dialog`（420/560px、单列、不卡片化）；否则用 `el-drawer`：`W 1–8` → 窄 `50%` + 1 列、`9–16` → 中 `75%` + 2 列、`≥17` → 宽 `90%` + 3 列。完整判定见 `rules/form-drawer-card-rule.md` §0–§2。

## 适用框架

| 维度 | 技术栈 |
|---|---|
| 前端框架 | Vue 3 |
| UI 库 | Element Plus（`el-drawer` / `el-card` / `el-form`） |
| 表格组件 | `scTable` / `sc-table`（自定义远程分页表格） |
| 表单组件 | `el-form` + `el-card`（卡片化分区）、`dict-select` / `dict-radio` / `sc-date-picker` / `sc-upload*` |
| 字典展示 | `sc-dict-label`（字典值标签，全局注册）+ `$DICT`（`utils/dict.js`） |
| 请求库 | Axios（封装于 `utils/request`，`$API` 全局对象） |
| 全局状态 | Vuex（Store） |
| 构建工具 | Vite / Webpack |

## 使用场景

- 新建标准业务模块的增删改查页面（列表页 + save.vue 抽屉）
- 新建「左分类 + 右列表」的左右布局页面（标签组→标签、单位类型→单位、部门→人员）
- 在抽屉内展示子列表并做行内 CRUD（定价配置、SKU 上下架、规则配置）
- 用抽屉承载编辑/配置表单（动态字段配置、复杂表单分块）
- 两个模块的 Tab / 抽屉高度相似，需要共用一套组件 + 档案
- 页面要展示数据字典值（认证状态、数据来源、类型、级别）或为字典列上色
- 统一团队后台页面风格、代码 Review 规范依据

## 页面骨架速览

### 列表页：四层 + 左右布局分支

```
el-container
└── el-container direction="vertical"
    ├── 第一层：div.page-tabs > el-tabs           ← 可选（同一实体多视图）
    ├── 第二层：div.search-wrap.search-wrap--dynamic ← 配置驱动检索区（单 el-row v-for，一行三格自动换行，左缘主色竖条模式标识）
    ├── 第三层：el-header > .left-panel            ← 可选（业务按钮）
    └── 第四层：el-main.nopadding > scTable        ← 表格 + 操作列
```

- **配置驱动**：全部条件声明在模块 `searchFields.js`（`SEARCH_FIELDS` + `createSearch`），单个 `el-row.search-fields` + `v-for` 每格 `span=8` 自动换行；增删 / 隐藏（`hiddenKey`）字段整体自动重排，行内不留缺格
- **行间距保留**：`.search-fields { row-gap: 10px; margin-bottom: 10px; }`，换行后行与行之间不能贴死
- **展开/收起动态判定**：可见条件 > 3 自动渲染并折叠第 4 个起；≤ 3 入口自动消失（`searchCollapsible`，骨架常驻无需手工删改）
- **模式标识**：容器挂 `search-wrap--dynamic` 修饰类，左缘 3px 主色圆角竖条（明显但隐蔽），区分配置驱动新形态与旧版手写固定行；旧形态页面不带此修饰类
- **入参配置派生**：遍历可见字段按 `normalize` 折算，隐藏字段不下发；重置用 `createSearch()`
- **左右布局**：左侧 `el-aside width="280px"` + `side-*` 分类面板，右侧仍是四层

### 表单型容器：先选型，再定档

```
第 1 步  数 N / L / W
  N = 可见 el-form-item 数（取 add/mod/view 最多态，v-if 字段全计）
  L = 通栏例外项数（textarea / 富文本 / 地址级联 / 树 / 子表 / 多图 / 文件 / 视频 / alert）
  W = N − L

第 2 步  选容器
  N ≤ 6 且 L ≤ 1  → el-dialog   420px（N ≤ 3）/ 560px（N = 4–6），单列、不卡片化
  其他            → el-drawer   按 W 定档

第 3 步  定档与列数（仅抽屉）
  W  1 – 8        → 窄 50%  + 1 列（:span="24"）
  W  9 – 16       → 中 75%  + 2 列（:span="12"）
  W ≥ 17          → 宽 90%  + 3 列（:span="8"）
  降档：L / N ≥ 0.4 → 一律 1 列；嵌套子抽屉再降一档且固定单列

第 4 步  卡片分区（仅抽屉）
  N ≤ 8 → 可 1 张卡；N ≥ 9 → 必须 2–3 张卡（按业务含义归组）
```

| 形态 | 结构要点 |
|---|---|
| **列表型** | `el-drawer(75%, rtl)` > `el-container(vertical)` > `el-header.drawer-header`（业务按钮全在此）+ `el-main.drawer-table-main` > `sc-table`（stripe border hide-pagination） |
| **表单型（抽屉）** | `el-drawer(size 按 W, rtl, append-to-body)` > `el-form.drawer-form` > `el-card.form-card` × 1–3 > `el-row :gutter="20"` > `el-col` × 1/2/3 列 + `#footer` |
| **表单型（对话框）** | `el-dialog(width 420/560px, append-to-body)` > `el-form.dialog-form` > 单列 `:span="24"`、不卡片化 + `#footer` |
| **save.vue** | 上述表单型骨架（对话框或抽屉）+ `destroy-on-close` + add/mod/view 三模式 + `emits['success','closed']` |

- **列数由档位绑定，不再一律三格**：窄档 1 列、中档 2 列、宽档 3 列；接入存量页面时按新档位重排，不要停留在原页面的散排上
- **字段少的页面不再套抽屉**：`N ≤ 6` 且 `L ≤ 1` 直接改对话框，省掉卡片层，弹窗高度更可控
- **通栏例外只有清单内那几类**：备注/多行文本、地址、富文本、树/树选择、多图/文件/视频上传、内嵌子表、提示条；放卡片末尾或独立成卡
- **上传等能力必须用组件库现成组件**（`sc-upload` / `sc-upload-multiple` / `sc-upload-file` / `sc-upload-video`，均已全局注册），禁止自绘 `el-upload`、禁止自研
- **列表型表格不裸贴抽屉边缘**：用 `.drawer-table-main` 而非 `nopadding`；业务按钮 → `el-header`，行内按钮 → 操作列，取消/确定 → `#footer`

### 数据字典：展示与选择分工

| 用途 | 载体 | 注册方式 |
|---|---|---|
| 列表单元 / 卡片头 / 详情 / 句子里的字典值 | `<sc-dict-label>` | ✅ 全局 |
| 表单、检索条件里的字典选择 | `<dict-select>` / `<dict-radio>` | ❌ 必须 import + `components` |

- 字典值不用 `el-tag`：胶囊 + 圆点、色走 `DICT_TAG_TYPES` 注册表、文案走 `$DICT`，与普通业务标签区分开
- 字典编码只从模块 `dict.js` 的 `XXX_DICT_CODE` 常量引用，页面不写字面量
- 字典只答「值 → 显示名」，**不进语言包**（与 `skill-admin-i18n` 的边界）
- 完整规范：`rules/dict-rule.md`；可复制代码：`demos/dict-label-demo.vue`

## 技能包目录结构

```
skill-admin-ux/
├── README.md                          # 本文件 — 技能总览
├── skill.md                           # 技能主入口 — 定位、目录分工、骨架总览、开发红线、标准流程、单一事实来源
├── rules/                             # 纯文字规范（只写规则）
│   ├── field-naming-rule.md           # snake_case → camelCase 字段映射
│   ├── api-model-rule.md              # API 模型（RESTful 五方法、重复 key 排错）
│   ├── list-page-rule.md              # 列表页四层 / 配置驱动检索区（searchFields.js）/ 左右布局左侧面板
│   ├── style-css-rule.md              # 列表页标准样式块与四层落点
│   ├── drawer-layout-rule.md          # 两类抽屉骨架 + 表格边距 + 宽度档位（窄/中/宽）与列数绑定
│   ├── form-drawer-card-rule.md       # 容器选型（对话框/抽屉）+ N/L/W 计分 + 档位与列数 + 卡片分区 + 通栏例外 + 组件白名单 + append-to-body 落点
│   ├── save-drawer-rule.md            # save.vue 三模式 + 校验 + 提交 + emits
│   ├── drawer-comm-rule.md            # 子抽屉通信 + 数据刷新
│   ├── dict-rule.md                   # 数据字典：展示 sc-dict-label / 选择 dict-select·dict-radio / 编码常量 / 色表
│   └── shared-tab-profile-rule.md     # 跨模块共用 Tab/抽屉的「档案 + 适配器」
├── demos/                             # 完整代码 Demo（可直接落地）
│   ├── api-model-demo.js              # API 模型示例（税率管理）
│   ├── index.vue                      # 列表页（配置驱动检索区：单 el-row v-for + 动态展开收起）
│   ├── search-fields-demo.js          # 检索字段配置（SEARCH_FIELDS 契约 + createSearch）
│   ├── side-panel.vue                 # 左右布局左侧分类面板骨架
│   ├── save.vue                       # save.vue 表单（三模式 + 卡片分区）
│   ├── list-drawer-demo.vue           # 列表型抽屉（行 CRUD + 子抽屉 + 刷新）
│   ├── dict-label-demo.vue            # 数据字典展示（dictCode 列 / 卡片头 / 句子内 / 多值）
│   └── form-drawer-demo.vue           # 表单型卡片抽屉（分区 + 三格 + 通栏 + footer）
└── assets/                            # 预留：布局结构图、卡片分区示意图、父子通信流程图
```

## 快速入门

```bash
# 1. src/api/model/ 下建模块 API（list/get/add/mod/delete）→ rules/api-model-rule.md
# 2. DDL snake_case → camelCase 字段 → rules/field-naming-rule.md
# 3. 建 index.vue 列表页：
#    先定层（要不要 Tab / 有没有按钮）→ 检索区一律配置驱动（任意条件数同一形态）：
#      模块目录建 searchFields.js（SEARCH_FIELDS + createSearch，照抄 demos/search-fields-demo.js）
#      单个 el-row.search-fields + v-for，一行三格自动换行，row-gap:10px 保留行间距
#      展开收起按可见条件数 > 3 动态判定；入参按 normalize 折算
#    左分类 + 右列表 → 左侧直接复制 demos/side-panel.vue
#    → rules/list-page-rule.md §2 + demos/index.vue
# 4. 新增/编辑容器：先数 N / L / W
#    N ≤ 6 且 L ≤ 1 → el-dialog（420/560px，单列不卡片化）
#    W 1–8 → 抽屉窄 50% + 1 列；W 9–16 → 中 75% + 2 列；W ≥ 17 → 宽 90% + 3 列
#    表 + 行操作 → 列表型（demos/list-drawer-demo.vue）
#    表单 + 分块 → 表单型（demos/form-drawer-demo.vue）
#    增删改查   → save.vue（demos/save.vue）
#    → rules/form-drawer-card-rule.md / drawer-layout-rule.md / save-drawer-rule.md
# 5. 补样式：列表页复制 style-css-rule.md §1 按层裁剪；抽屉用 .drawer-form/.form-card/.card-title，对话框用 .dialog-form
# 6. 字典值展示（状态 / 类型 / 来源列）：sc-dict-label + 编码常量 → rules/dict-rule.md
# 7. 接子抽屉通信与保存后刷新 → rules/drawer-comm-rule.md
# 8. 与本模块相似的既有模块 → 走共用组件 + 档案，不复制副本 → rules/shared-tab-profile-rule.md
```

## 单一事实来源

合并后**同一主题只在一个文件里定义**，其余文件引用而不重复：

| 主题 | 唯一来源 |
|---|---|
| 列表页结构、配置驱动检索区、左右面板 | `rules/list-page-rule.md` |
| 列表页样式块 | `rules/style-css-rule.md` |
| 抽屉宽度档位、列表型骨架与表格边距 | `rules/drawer-layout-rule.md` |
| 容器选型（对话框 vs 抽屉）、N/L/W 计分、档位与列数、卡片分区、通栏例外、组件白名单、卡片样式 | `rules/form-drawer-card-rule.md` |
| save.vue 三模式、校验、提交、emits | `rules/save-drawer-rule.md` |
| 子抽屉通信与刷新 | `rules/drawer-comm-rule.md` |
| 数据字典（`sc-dict-label`、`dict-select`·`dict-radio`、编码常量、色表、与 i18n 边界） | `rules/dict-rule.md` |
| 跨模块共用 Tab / 抽屉 | `rules/shared-tab-profile-rule.md` |

## 后端配套

本技能包专注前端的后台页面与抽屉实现，后端 Controller / Model 开发规范请参考 `server-skill.md`。
