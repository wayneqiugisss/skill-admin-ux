# 数据字典规范 — dict-rule.md

本文件是**数据字典**在后台前端的唯一规范：谁负责翻译、谁负责上色、展示用哪个组件、编码常量放哪、新增一个字典要动哪几处。

只管「**随数据值变化的中文**」（认证状态、数据来源、类型、级别…）。字段中文名与页面文案不归本文件，走 `skill-admin-i18n`。

---

## 1. 职责边界（先判类，再动手）

| 中文的用途 | 例子 | 归属 | 落地位置 |
|---|---|---|---|
| 随**数据值**变化的显示名 | 认证状态 `1` → 认证中；来源 `ONLINE` → 线上注册 | 数据字典 | `$DICT` + `<sc-dict-label>` |
| 字段中文名 | 列头「单位名称」、表单 `label` | i18n | `field.<entity>.<key>` |
| 页面说法 | 提示语、卡片标题、按钮 | i18n | `views.<route>.<key>` / `common.*` |

判定口诀：**这个中文会不会因为这条数据的取值不同而变化？** 会 → 字典；不会 → i18n。

三条边界红线：

1. **字典项禁止搬进语言包** —— 两套数据源必然对不上，后端新增枚举时必漏；
2. **字典编码禁止在页面里写字面量** —— 只从模块 `dict.js` 的常量引用（见 §5）；
3. **字典只管「值 → 显示名 + 语义色」** —— 不参与接口入参拼装、表单校验、枚举运算。

---

## 2. 取数链路（只有这一条）

| 环节 | 事实 |
|---|---|
| 入口 | `admin/src/utils/dict.js` 导出 `dict`，由 `src/ecxui.js` 挂到 `app.config.globalProperties.$DICT` |
| 数据源 | `GET /system/sysDict/type/tree-with-items`，经 `flattenDictTree` 摊平为 `code → { typeId, name, items }` 存 localStorage |
| 预加载 | 登录时 `passwordForm` / `phoneForm` 各调一次 `loadDictData()` |
| 读口 | `getDictItems(code)` / `getDictName(code, key, defaultVal)` / `getDictOptions(code)` |
| 展示辅助 | `getDictTagType(code, key, defaultVal)`（色表见 §5）、`getDictTagOptions(code)`、`getDictNameEn(code, key)` |
| 页面兜底 | `if (!this.$DICT.getDictItems(CODE).length) await this.$DICT.loadDictData()` |

两条必须记住的硬事实：

1. 字典项字段只有 `name / nameEn / key / value / sort / status`，**后端不下发颜色** —— 所以标签色只能由前端注册表决定，不要指望字典接口给色值；
2. 远端字典需要登录态（未登录接口 401） —— 展示组件不能假设字典一定命中，必须能降级（见 §3）。

> **不要在单元格、`v-for` 循环体里逐个调 `loadDictData()`**：`<sc-dict-label>` 已内建「并发去重 + 5s 节流」，一屏上百个单元格只发一次请求。

---

## 3. 展示层：`<sc-dict-label>`（强制）

### 3.1 为什么不用 `el-tag`

`el-tag` 既能表示字典值，也能表示任意业务标签（必填/选填、附件名、版本号……）。字典值必须有**稳定且可辨识**的视觉，运营才能一眼区分「这是数据值」还是「这是页面标签」：

| 维度 | `sc-dict-label` | `el-tag` |
|---|---|---|
| 形状 | 圆角胶囊 + 前置圆点 | 直角小方块 |
| 颜色来源 | `utils/dict.js` 的 `DICT_TAG_TYPES` 注册表（按 code + key 查） | 页面逐处手传 `type` |
| 文案来源 | 全局字典 `$DICT` | 页面插值 / 页面方法 |
| 字典未命中 | 占位 `--`，不暴露内部 key | 无约定 |

### 3.2 组件契约

`admin/src/components/scDictLabel/index.vue`，已在 `src/ecxui.js` 全局注册 → 页面**不用 import**，直接 `<scDictLabel>` 或 `<sc-dict-label>`。

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `dict-code` | String | `''` | 字典类型编码，优先；**必须传常量**（§5.1） |
| `dict-type` | String | `''` | 旧写法别名，与 `dict-code` 等价 |
| `value` | String / Number / Array | `''` | 字典项 key，简写；优先级高于 `model-value` |
| `model-value` | 同上 | `''` | `v-model` 风格写法 |
| `variant` | String | `light` | `light` 实底胶囊 / `outline` 描边 / `text` 纯文字（嵌在句子里） |
| `size` | String | `small` | `small`（表格 / 卡片头）/ `default` / `large`（详情页） |
| `dot` | Boolean | `true` | 前缀圆点；`variant="text"` 建议关掉 |
| `type` | String | `''` | 强制语义色；不传则查注册表 |
| `placeholder` | String | `--` | 空值 / 未命中字典时的占位 |
| `fallback` | Boolean | `false` | 未命中时是否显示原始 key；**默认关闭**，避免把内部编码暴露给用户 |

行为约定：

- 数组入参 → 逐项渲染多个标签（多选字典 / 多值字段）；
- `dict-code` 变更 → 自动重新翻译；
- 字典未加载 → **不报错**：先按占位渲染，加载完成后自动刷新（内部 `dictVersion` 触发重算）。

### 3.3 四种标准用法

```html
<!-- ① 列表单元格：数据来源 / 认证状态 -->
<scDictLabel :dict-code="col.dictCode" :model-value="scope.row[col.prop]" />

<!-- ② 抽屉卡片头：与标题同行，描边形态（对应旧 el-tag effect="plain"） -->
<scDictLabel :dict-code="sourceTypeDictCode" :value="source.sourceType" variant="outline" />

<!-- ③ 底部提示行：嵌在句子里，纯文字形态 -->
<scDictLabel :dict-code="sourceTypeDictCode" :value="source.sourceType" variant="text" :dot="false" />

<!-- ④ 多值字典 -->
<scDictLabel dict-code="qual_file_type" :value="['ORIGINAL_SCAN', 'COPY_STAMPED']" />
```

### 3.4 列表页：字典列统一写在 `columns.js`

列定义只标 `dictCode`，模板只有一个分支，**不要为每个字典列各写一个具名 slot**：

```javascript
// columns.js
import { SOURCE_AUTH_STATUS_DICT_CODE, SOURCE_TYPE_DICT_CODE } from '../../customers/source/dict';

export const tableColumns = [
	{ prop: 'sourceType', field: 'sourceType', width: 110, align: 'center', dictCode: SOURCE_TYPE_DICT_CODE },
	{ prop: 'certStatus', field: 'certStatus', width: 110, align: 'center', dictCode: SOURCE_AUTH_STATUS_DICT_CODE }
];
```

```html
<el-table-column v-for="col in tableColumns" :key="col.prop" :prop="col.prop" :label="field(col.field)" ...>
	<template #default="scope">
		<scDictLabel v-if="col.dictCode" :dict-code="col.dictCode" :model-value="scope.row[col.prop]" />
		<template v-else>{{ scope.row[col.prop] }}</template>
	</template>
</el-table-column>
```

### 3.5 禁止写法

| 禁止 | 原因 |
|---|---|
| `<el-tag :type="xxxTagType(v)">{{ xxxText(v) }}</el-tag>` | 文案与颜色两套来源，换个页面就要抄一遍 |
| 页面成对保留 `xxxText(value)` + `xxxTagType(value)` | 同一个字典值维护两份方法，样式与文案必然漂移 |
| 模板里直接 `$DICT.getDictName(...)` | 字典异步加载完成后不触发重渲染，且绕开统一视觉 |
| 为每个字典列各写具名 slot（`slot: 'certStatus'`） | 列配置与渲染分支双份维护，新增字典列要动模板 |
| 用 i18n 兜字典未命中的中文 | 枚举值不属于语言包（§1） |
| 把字典值渲染成普通文本（`{{ row.status }}`） | 用户看到内部 key，等于没有字典 |

---

## 4. 选择层：表单与检索条件

| 场景 | 组件 | 注册方式 | 规则出处 |
|---|---|---|---|
| 下拉单选 / 多选 | `<dict-select>`（`DictSelect`） | **非全局**，必须 import + `components` | `list-page-rule.md` §3.2、`save-drawer-rule.md` §2.3 |
| 平铺单选 | `<dict-radio>`（`DictRadio`） | **非全局**，必须 import + `components` | 同上 |
| 只读展示 | `<sc-dict-label>` | ✅ 全局，无需 import | 本文件 §3 |

- 检索区用 `DictSelect` 时走 `need-prefix` + `prefix` prop，宽度按 `list-page-rule.md` §3；
- 表单内一律 `style="width: 100%;"`；**禁止手写 `el-option` 枚举字典值**；
- 同一字段「列表展示用 `sc-dict-label`、表单编辑用 `dict-select`」时，两处 `dict-code` 必须引用**同一个常量**。

---

## 5. 编码常量与标签色注册表

### 5.1 字典编码必须常量化

编码字符串（如 `user_reg_type`）**只允许出现在一个地方**：模块级 `dict.js`。

```javascript
// views/eXenterprise/customers/source/dict.js
export const SOURCE_TYPE_DICT_CODE = 'user_reg_type';          // 数据来源
export const SOURCE_AUTH_STATUS_DICT_CODE = 'user_auth_status'; // 认证状态
```

- 页面、`columns.js`、抽屉一律 `import` 后引用；
- 模板取不到 import 的常量 → 用 computed 暴露，**不要**在模板里写字符串：

```javascript
computed: {
	// 字典编码：模板里拿不到 import 的常量，经 computed 暴露给 scDictLabel
	sourceTypeDictCode() {
		return SOURCE_TYPE_DICT_CODE;
	}
}
```

- 编码命名沿用「域前缀 + 单数概念」下划线式：`sys_portal_type`、`sys_edition`、`user_reg_type`、`qual_status`。

### 5.2 标签色只在注册表登记

`utils/dict.js` 的 `DICT_TAG_TYPES` 是**唯一**的字典色来源：

```javascript
export const DICT_TAG_TYPES = {
	// 数据来源
	user_reg_type: { ONLINE: 'primary', LEAD: 'success' },
	// 用户认证状态
	user_auth_status: { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
};
```

- 新增字典需要配色 → 在这里加一段，页面零改动；
- 未登记 → 默认 `info`，不会报错；
- 语义色只用 Element Plus 的五种：`primary / success / warning / danger / info`；**禁止硬编码色值**，暗色主题跟随 `--el-color-*` 变量。

---

## 6. 新增一个字典的落地清单

| # | 动作 | 落点 |
|---|---|---|
| 1 | 后端建字典类型 + 字典项（key 稳定，不复用旧 key 的语义） | `sysDict/type`、`sysDict/item` 管理页 |
| 2 | 前端导出编码常量 | 模块 `dict.js`（没有就新建） |
| 3 | 需要标签色 → 注册表登记 | `utils/dict.js` → `DICT_TAG_TYPES` |
| 4 | 展示 → `sc-dict-label`；选择 → `dict-select` / `dict-radio` | 页面 / `columns.js` |
| 5 | 检索条件接入 | `search` 字段 + 常量；形态按 `list-page-rule.md` |
| 6 | 校验 | `grep` 编码字面量、`grep "getDictName("` 查页面残留、SFC 编译 + `eslint` |

---

## 7. Code Review 红线（逐条打勾）

- [ ] 页面里没有 `<el-tag>` 承载字典值
- [ ] 没有成对的 `xxxText` / `xxxTagType` 方法
- [ ] 模板里没有直接调 `$DICT.*`
- [ ] 字典编码全部来自常量，模板里没有编码字符串字面量
- [ ] 新增字典颜色只改了 `DICT_TAG_TYPES`
- [ ] 字典列在 `columns.js` 用 `dictCode` 标记，模板只有一个渲染分支
- [ ] 字典未命中时显示占位，而不是内部 key
- [ ] 字典值没有进语言包（i18n 只放字段名与页面文案）
- [ ] 选择类控件用的是 `dict-select` / `dict-radio`，没有手写 `el-option`
- [ ] 没有在循环体 / 单元格里各自请求字典

---

## 8. 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 整列显示 `--` | 字典未预加载，或该 code 在字典表里不存在 | 登录会自动预加载；`sc-dict-label` 会补刷一次；仍为 `--` 说明后端缺字典项 |
| 首屏有一帧占位 | 字典异步加载 | 正常现象，加载完成后组件自动刷新，不要额外加 loading 遮罩 |
| 表格滚动卡、接口被打爆 | 每个单元格各自请求字典 | 改用 `sc-dict-label`（内建去重 + 节流） |
| 新增字典项后页面不显示 | 本地 localStorage 还是旧快照 | 重新登录，或调用 `$DICT.loadDictData()` 刷新缓存 |
| 暗色主题下颜色发灰/刺眼 | 页面里写死了色值 | 只用 `--el-color-*` 变量，颜色统一交给注册表 |
| 字典值在模板里不更新 | 模板直接调 `$DICT`，没有渲染依赖 | 一律用 `sc-dict-label` |

---

## 9. 相关文件

| 主题 | 唯一来源 |
|---|---|
| 数据字典展示 / 选择 / 常量 / 色表 | **本文件** |
| 列表页结构、检索条件形态、字典列落点 | `list-page-rule.md` §5.7 |
| 抽屉卡片头、通栏、组件白名单 | `form-drawer-card-rule.md` §4 |
| save.vue 三模式与提交 | `save-drawer-rule.md` |
| 字段中文名 / 页面文案 | `skill-admin-i18n` |
| 字典取数实现 | `admin/src/utils/dict.js` |
| 字典展示组件 | `admin/src/components/scDictLabel/index.vue` |
