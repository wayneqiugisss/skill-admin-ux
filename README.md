# Skill Admin UX — 后台列表页与抽屉统一开发技能包

## 技能概览

本技能包把原先「标准 CRUD 页面」与「抽屉开发」两套规范合并为**一套后台 UI 开发规范**，覆盖从 API 模型、字段命名、列表页四层结构，到列表型抽屉、表单型抽屉、save.vue 三模式、父子通信与跨模块共用的完整链路。

## 适用框架

| 维度 | 技术栈 |
|---|---|
| 前端框架 | Vue 3 |
| UI 库 | Element Plus（`el-drawer` / `el-card` / `el-form`） |
| 表格组件 | `scTable` / `sc-table`（自定义远程分页表格） |
| 表单组件 | `el-form` + `el-card`（卡片化分区）、`dict-select` / `dict-radio` / `sc-date-picker` / `sc-upload*` |
| 请求库 | Axios（封装于 `utils/request`，`$API` 全局对象） |
| 全局状态 | Vuex（Store） |
| 构建工具 | Vite / Webpack |

## 使用场景

- 新建标准业务模块的增删改查页面（列表页 + save.vue 抽屉）
- 新建「左分类 + 右列表」的左右布局页面（标签组→标签、单位类型→单位、部门→人员）
- 在抽屉内展示子列表并做行内 CRUD（定价配置、SKU 上下架、规则配置）
- 用抽屉承载编辑/配置表单（动态字段配置、复杂表单分块）
- 两个模块的 Tab / 抽屉高度相似，需要共用一套组件 + 档案
- 统一团队后台页面风格、代码 Review 规范依据

## 页面骨架速览

### 列表页：四层 + 两种分支

```
el-container
└── el-container direction="vertical"
    ├── 第一层：div.page-tabs > el-tabs           ← 可选（同一实体多视图）
    ├── 第二层：div.search-wrap                    ← 检索条件，一行三个
    ├── 第三层：el-header > .left-panel            ← 可选（业务按钮）
    └── 第四层：el-main.nopadding > scTable        ← 表格 + 操作列
```

- **一行三个**：每个条件 `el-col :span="8"`，按声明顺序填满，只有末行可缺且缺在行尾
- **展开/收起按条件数出现**：> 3 个必须渲染并折叠第 2 行起；≤ 3 个必须完全不渲染（判定走 `searchCollapsible`）
- **合并例外（≤ 2 个条件）**：第二、三层塌缩为一个 `el-header`，**功能按钮置左、筛选条件置右**；不用 `.search-wrap`、不用栅格、页面样式一条不写（全局 `fix.scss` / `app.scss` 已覆盖）
- **左右布局**：左侧 `el-aside width="280px"` + `side-*` 分类面板，右侧仍是四层

### 抽屉：三类形态

| 形态 | 结构要点 |
|---|---|
| **列表型** | `el-drawer(75%, rtl)` > `el-container(vertical)` > `el-header.drawer-header`（业务按钮全在此）+ `el-main.drawer-table-main` > `sc-table`（stripe border hide-pagination） |
| **表单型** | `el-drawer(≥75%, rtl, append-to-body)` > `el-form.drawer-form` > `el-card.form-card` × N > `el-row :gutter="20"` > `el-col :span="8"` × 3 + `#footer` |
| **save.vue** | 表单型骨架 + `size="75%"` + `destroy-on-close` + add/mod/view 三模式 + `emits['success','closed']` |

- **表单型一行三格是默认**，无论原页面是单列还是散排，接入时都整理成三格
- **通栏例外只有清单内那几类**：备注/多行文本、地址、富文本、多图/文件/视频上传、内嵌子表、提示条；放卡片末尾或独立成卡
- **上传等能力必须用组件库现成组件**（`sc-upload` / `sc-upload-multiple` / `sc-upload-file` / `sc-upload-video`，均已全局注册），禁止自绘 `el-upload`、禁止自研
- **列表型表格不裸贴抽屉边缘**：用 `.drawer-table-main` 而非 `nopadding`；业务按钮 → `el-header`，行内按钮 → 操作列，取消/确定 → `#footer`

## 技能包目录结构

```
skill-admin-ux/
├── README.md                          # 本文件 — 技能总览
├── skill.md                           # 技能主入口 — 定位、目录分工、骨架总览、开发红线、标准流程、单一事实来源
├── rules/                             # 纯文字规范（只写规则）
│   ├── field-naming-rule.md           # snake_case → camelCase 字段映射
│   ├── api-model-rule.md              # API 模型（RESTful 五方法、重复 key 排错）
│   ├── list-page-rule.md              # 列表页四层 / 检索条件 / ≤2 条件合并 / 左右布局左侧面板
│   ├── style-css-rule.md              # 列表页标准样式块与四层落点
│   ├── drawer-layout-rule.md          # 两类抽屉骨架 + 表格边距 + 宽度档位
│   ├── form-drawer-card-rule.md       # 卡片化 + 一行三格 + 通栏例外 + 组件白名单 + append-to-body 落点
│   ├── save-drawer-rule.md            # save.vue 三模式 + 校验 + 提交 + emits
│   ├── drawer-comm-rule.md            # 子抽屉通信 + 数据刷新
│   └── shared-tab-profile-rule.md     # 跨模块共用 Tab/抽屉的「档案 + 适配器」
├── demos/                             # 完整代码 Demo（可直接落地）
│   ├── api-model-demo.js              # API 模型示例（税率管理）
│   ├── index.vue                      # 列表页（5 条件 → 3+2 两行 + 展开收起）
│   ├── side-panel.vue                 # 左右布局左侧分类面板骨架
│   ├── save.vue                       # save.vue 抽屉表单（三模式 + 一行三格）
│   ├── list-drawer-demo.vue           # 列表型抽屉（行 CRUD + 子抽屉 + 刷新）
│   └── form-drawer-demo.vue           # 表单型卡片抽屉（分区 + 三格 + 通栏 + footer）
└── assets/                            # 预留：布局结构图、卡片分区示意图、父子通信流程图
```

## 快速入门

```bash
# 1. src/api/model/ 下建模块 API（list/get/add/mod/delete）→ rules/api-model-rule.md
# 2. DDL snake_case → camelCase 字段 → rules/field-naming-rule.md
# 3. 建 index.vue 列表页：
#    先定层（要不要 Tab / 有没有按钮）→ 再数检索条件总数选形态：
#      ≤ 2 → 二三层合并一行（功能置左、筛选置右、搜索最右，无页面样式）
#      = 3 → 独立 .search-wrap 单行，一行三个 + prefix + 搜索 + 重置
#      > 3 → 独立 .search-wrap 多行 + 展开/收起
#    左分类 + 右列表 → 左侧直接复制 demos/side-panel.vue
#    → rules/list-page-rule.md + demos/index.vue
# 4. 建抽屉：
#    表 + 行操作 → 列表型（demos/list-drawer-demo.vue）
#    表单 + 分块 → 表单型（demos/form-drawer-demo.vue）
#    增删改查   → save.vue（demos/save.vue）
#    → rules/drawer-layout-rule.md / form-drawer-card-rule.md / save-drawer-rule.md
# 5. 补样式：列表页复制 style-css-rule.md §1 按层裁剪；抽屉用 .drawer-form/.form-card/.card-title
# 6. 接子抽屉通信与保存后刷新 → rules/drawer-comm-rule.md
# 7. 与本模块相似的既有模块 → 走共用组件 + 档案，不复制副本 → rules/shared-tab-profile-rule.md
```

## 单一事实来源

合并后**同一主题只在一个文件里定义**，其余文件引用而不重复：

| 主题 | 唯一来源 |
|---|---|
| 列表页结构、检索条件、合并形态、左右面板 | `rules/list-page-rule.md` |
| 列表页样式块 | `rules/style-css-rule.md` |
| 抽屉宽度档位、列表型骨架与表格边距 | `rules/drawer-layout-rule.md` |
| 表单型卡片化、一行三格、通栏例外、组件白名单、卡片样式 | `rules/form-drawer-card-rule.md` |
| save.vue 三模式、校验、提交、emits | `rules/save-drawer-rule.md` |
| 子抽屉通信与刷新 | `rules/drawer-comm-rule.md` |
| 跨模块共用 Tab / 抽屉 | `rules/shared-tab-profile-rule.md` |

## 后端配套

本技能包专注前端的后台页面与抽屉实现，后端 Controller / Model 开发规范请参考 `server-skill.md`。
