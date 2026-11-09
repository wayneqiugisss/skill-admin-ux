# 字段命名映射规则 — field-naming-rule.md

## 1. 核心原则：表结构 snake_case → 前端 camelCase

后端 Java 接口返回的 JSON 字段统一使用 **camelCase（小驼峰）** 命名，前端必须严格遵循。

数据库表结构使用 `snake_case`，Java 后端自动转换为 `camelCase` 返回给前端。

### 1.1 转换规则

| 数据库字段 (snake_case) | Java 接口返回 (camelCase) | 说明 |
|---|---|---|
| `tax_code` | `taxCode` | 下划线转大写 |
| `tax_name` | `taxName` | 下划线转大写 |
| `tax_value` | `taxValue` | 下划线转大写 |
| `tax_status` | `taxStatus` | 下划线转大写 |
| `unit_code` | `unitCode` | 下划线转大写 |
| `unit_name` | `unitName` | 下划线转大写 |
| `create_time` | `createTime` | 下划线转大写 |
| `update_time` | `updateTime` | 下划线转大写 |
| `create_by` | `createBy` | 下划线转大写 |
| `update_by` | `updateBy` | 下划线转大写 |
| `del_flag` | `delFlag` | 下划线转大写 |
| `enterprise_archive_code` | `enterpriseArchiveCode` | 多段下划线全转 |
| `ea_ent_name` | `eaEntName` | 前缀缩写也转驼峰 |
| `ea_credit_code` | `eaCreditCode` | 前缀缩写也转驼峰 |

### 1.2 转换公式

```
snake_case → camelCase：
  去掉下划线，下划线后首字母大写，其余小写
  例：create_by → create + By → createBy
```

---

## 2. 前端各位置字段命名规范

### 2.1 search 搜索条件

```javascript
search: {
  taxName: "",       // ✅ camelCase
  taxCode: "",       // ✅ camelCase
  taxStatus: null,   // ✅ camelCase
  unitType: null,    // ✅ camelCase
}
```

❌ **禁止写法**：
```javascript
search: {
  tax_name: "",      // ❌ snake_case
  tax_code: "",      // ❌ snake_case
  field_name: "",    // ❌ snake_case
}
```

### 2.2 表格列 prop

```html
<el-table-column label="税率编码" prop="taxCode" width="180"></el-table-column>
<el-table-column label="税率名称" prop="taxName" min-width="180"></el-table-column>
<el-table-column label="创建时间" prop="createTime" width="170"></el-table-column>
```

❌ **禁止写法**：
```html
<el-table-column label="税率编码" prop="tax_code" width="180"></el-table-column>
<el-table-column label="文本字段" prop="text_field" width="180"></el-table-column>
```

### 2.3 表单 form 字段

```javascript
form: {
  taxCode: '',
  taxName: '',
  taxValue: 0,
  taxSort: 0,
  taxStatus: '1',
  taxRemark: '',
}
```

❌ **禁止写法**：
```javascript
form: {
  code_field: '',
  text_field: '',
  price_field: 0,
}
```

### 2.4 表单验证 rules 字段名

```javascript
rules: {
  taxCode: [{ required: true, message: '税率编码不能为空', trigger: "blur" }],
  taxName: [{ required: true, message: '税率名称不能为空', trigger: "blur" }],
}
```

### 2.5 提交数据 submitData

```javascript
var submitData = {
  taxCode: this.form.taxCode,
  taxName: this.form.taxName,
  taxValue: this.form.taxValue,
  taxSort: this.form.taxSort ?? 0,
  taxStatus: this.form.taxStatus ?? '1',
  taxRemark: this.form.taxRemark || '',
};
```

### 2.6 setData 回填数据

```javascript
setData(data) {
  this.form = {
    id: data.id || '',
    taxCode: data.taxCode || '',
    taxName: data.taxName || '',
    taxValue: data.taxValue ?? 0,
    taxSort: data.taxSort ?? 0,
    taxStatus: data.taxStatus != null ? String(data.taxStatus) : '1',
    taxRemark: data.taxRemark || '',
  };
}
```

---

## 3. 系统通用字段的 camelCase 映射

所有表共有的系统字段，前端统一使用以下 camelCase 命名：

| 数据库字段 | 前端字段 | 说明 |
|---|---|---|
| `id` | `id` | 主键，无需转换 |
| `create_time` | `createTime` | 创建时间 |
| `update_time` | `updateTime` | 更新时间 |
| `create_by` | `createBy` | 创建人 |
| `update_by` | `updateBy` | 更新人 |
| `del_flag` | `delFlag` | 删除标志 |

---

## 4. 基于表结构生成前端字段的操作指南

当拿到一个表结构 DDL 时，按以下步骤生成前端字段：

### Step 1：识别业务字段

从 `CREATE TABLE` 语句中提取所有 `COMMENT` 不为空的字段，排除 `id`、`create_time`、`update_time`、`create_by`、`update_by`、`del_flag` 等系统通用字段。

### Step 2：转换为 camelCase

将每个字段名按 `snake_case → camelCase` 规则转换：

```
ea_ent_name      → eaEntName
ea_credit_code   → eaCreditCode
ea_business_scale → eaBusinessScale
ea_contact_user  → eaContactUser
ea_archive_status → eaArchiveStatus
tax_code         → taxCode
unit_name        → unitName
```

### Step 3：根据字段类型选择组件

| 数据库类型 | COMMENT 关键字 | 前端组件 | camelCase 示例 |
|---|---|---|---|
| `varchar` | 名称/编码/符号 | `el-input` | `taxName`、`taxCode` |
| `varchar` | 备注 | `el-input type="textarea"` | `taxRemark` |
| `tinyint(1)` | 状态 | `dict-radio` 或 `el-switch` | `taxStatus` |
| `int` / `tinyint` | 排序/类型 | `el-input-number` 或 `dict-select` | `taxSort`、`unitType` |
| `decimal` | 金额/税率/价格 | `el-input-number :precision="2"` | `taxValue` |
| `datetime` | 时间 | `sc-date-picker` | `createTime` |
| `text` | 描述/长文本 | `el-input type="textarea"` | `remark` |

### Step 4：生成完整代码结构

以 `tax_rate` 表为例：

```
DDL: tax_code, tax_name, tax_value, tax_status, tax_sort, tax_remark
      ↓ 转换
前端: taxCode,  taxName,  taxValue,  taxStatus,  taxSort,  taxRemark
```

---

## 5. 强制要求

| # | 要求 |
|---|---|
| ✅ | 前端所有字段名必须使用 camelCase，与 Java 接口返回保持一致 |
| ✅ | 从表结构生成字段时，必须按 snake_case → camelCase 规则转换 |
| ✅ | search / form / rules / prop / submitData 中字段名统一 camelCase |
| ✅ | 系统通用字段（createTime / createBy / updateTime / updateBy）统一命名 |
| ✅ | 显式逐字段构造 submitData，禁止使用 `{...this.form}` 展开后直接提交 |
| ✅ | setData 回填数据时显式逐字段赋值，禁止使用 `{...data}` 展开 |
| ❌ | 禁止在代码中使用 snake_case 字段名（如 `tax_code`、`create_time`） |
| ❌ | 禁止在 prop / v-model / rules 中混用 snake_case |
