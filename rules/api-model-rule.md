# API 模型定义规范 — api-model-rule.md

## 1. 文件位置与自动加载

### 1.1 目录结构

所有 API 模型文件存放在 `src/api/model/` 目录下，按模块拆分成独立 `.js` 文件：

```
src/api/model/
├── demo.js        # 演示模块
├── system.js      # 系统模块
└── ...            # 其他模块
```

### 1.2 自动加载规则

`src/api/index.js` 通过 `require.context` 自动扫描并加载 `model/` 目录下所有 `.js` 文件，挂载到 `$API` 全局对象。

> **开发者只需要在 `model/` 下创建新文件，无须手动注册，文件会自动生效。**

---

## 2. 文件标准结构

### 2.1 导入语句

```javascript
import http from "@/utils/request"
import API from "@/utils/apiPaths"
```

| 导入 | 说明 |
|---|---|
| `http` | 封装后的 Axios 请求实例 |
| `API` | 微服务 API 路径统一管理对象，包含 `API.b2b.system` 等 |

> **禁止使用** `import config from "@/config"` + `config.API_URL` 拼接 URL，统一使用 `API` 路径管理对象。

### 2.2 导出格式

```javascript
export default {
  命名空间: {
    list: { /* 列表查询 */ },
    add: { /* 新增 */ },
    mod: { /* 修改 */ },
    delete: { /* 删除 */ },
  },
}
```

---

## 3. 命名空间与方法定义

### 3.1 命名空间

- 使用小写英文字母（如 `product`、`user`、`taxRate`、`unit`）
- 访问方式：`this.$API.system.taxRate.list.get()`

### 3.2 标准五方法

每个模块必须定义 `list`/`get`/`add`/`mod`/`delete` 五个方法：

| 方法 | HTTP 方法 | 用途 | 参数 |
|---|---|---|---|
| `list` | `GET` | 分页列表查询 | `params`（查询条件对象） |
| `get` | `GET` | 根据ID查询详情 | `id`（主键值） |
| `add` | `POST` | 新增数据 | `data`（表单数据） |
| `mod` | `PUT` | 修改数据 | `data`（含主键的表单数据） |
| `delete` | `DELETE` | 删除数据 | `id`（主键值） |

### 3.3 标准写法模板

```javascript
import http from "@/utils/request"
import API from "@/utils/apiPaths"

export default {
  // 模块命名空间（小写英文）
  模块名: {
    list: {
      url: `${API.b2b.system}/ControllerName`,
      name: "模块名列表",
      get: async function(params){
        return await http.get(this.url, params);
      }
    },
    get: {
      url: `${API.b2b.system}/ControllerName`,
      name: "根据ID查询模块名",
      get: async function(id){
        return await http.get(this.url + '/' + id);
      }
    },
    add: {
      url: `${API.b2b.system}/ControllerName`,
      name: "添加模块名",
      post: async function(data){
        return await http.post(this.url, data);
      }
    },
    mod: {
      url: `${API.b2b.system}/ControllerName`,
      name: "修改模块名",
      put: async function(data){
        return await http.put(this.url, data);
      }
    },
    delete: {
      url: `${API.b2b.system}/ControllerName`,
      name: "删除模块名",
      delete: async function(id){
        return await http.delete(this.url + '/' + id);
      }
    }
  },
}
```

### 3.4 URL 命名规则

```
${API.b2b.微服务名}/ControllerName
```

- `API.b2b.system`：系统服务（对应 `exb2b-system`）
- `API.b2b.auth`：认证服务（对应 `exb2b-auth`）
- `API.b2b.file`：文件服务（对应 `exb2b-file`）
- `ControllerName`：后端控制器名（如 `taxRate`、`unitMeasure`），使用 camelCase

> **RESTful 规范**：URL 只到资源名，不附加方法后缀。
> - `GET /taxRate` → 列表查询
> - `GET /taxRate/{id}` → 详情查询
> - `POST /taxRate` → 新增
> - `PUT /taxRate` → 修改
> - `DELETE /taxRate/{id}` → 删除

---

## 4. 方法定义详解

### 4.1 list — 列表查询（GET）

```javascript
list: {
  url: `${API.b2b.system}/taxRate`,
  name: "税率列表",
  get: async function(params){
    return await http.get(this.url, params);
  }
}
```

- **调用方式**：`this.$API.system.taxRate.list.get({...查询条件})`
- **参数传递**：`params` 对象会自动序列化为 URL query 参数
- **字段命名**：查询参数使用 camelCase（如 `taxName`、`taxCode`、`taxStatus`）

### 4.2 get — 详情查询（GET）

```javascript
get: {
  url: `${API.b2b.system}/taxRate`,
  name: "根据ID查询税率",
  get: async function(id){
    return await http.get(this.url + '/' + id);
  }
}
```

- **调用方式**：`this.$API.system.taxRate.get.get(id)`
- **参数**：直接传主键值，URL 拼接为 `/taxRate/{id}`

### 4.3 add — 新增（POST）

```javascript
add: {
  url: `${API.b2b.system}/taxRate`,
  name: "新增税率",
  post: async function(data){
    return await http.post(this.url, data);
  }
}
```

- **调用方式**：`this.$API.system.taxRate.add.post(submitData)`
- **参数传递**：JSON body，字段使用 camelCase

### 4.4 mod — 修改（PUT）

```javascript
mod: {
  url: `${API.b2b.system}/taxRate`,
  name: "修改税率",
  put: async function(data){
    return await http.put(this.url, data);
  }
}
```

- **调用方式**：`this.$API.system.taxRate.mod.put(submitData)`
- **与 add 的区别**：使用 `PUT` 方法，数据中必须包含主键字段（如 `id`）

### 4.5 delete — 删除（DELETE）

```javascript
delete: {
  url: `${API.b2b.system}/taxRate`,
  name: "删除税率",
  delete: async function(id){
    return await http.delete(this.url + '/' + id);
  }
}
```

- **调用方式**：`this.$API.system.taxRate.delete.delete(row.id)`
- **参数**：直接传主键值，URL 拼接为 `/taxRate/{id}`

---

## 5. 访问方式

在 Vue 组件中通过 `this.$API.子模块.命名空间` 全局对象访问：

```javascript
// 列表查询
const res = await this.$API.system.taxRate.list.get({ taxName: '', taxCode: '' });

// 详情查询
const res = await this.$API.system.taxRate.get.get(row.id);

// 新增
const res = await this.$API.system.taxRate.add.post(submitData);

// 修改
const res = await this.$API.system.taxRate.mod.put(submitData);

// 删除
const res = await this.$API.system.taxRate.delete.delete(row.id);
```

> **注意**：API 模型文件按子目录组织（`model/system/`、`model/common/`），
> 访问时需要带上子模块前缀：`this.$API.system.taxRate`、`this.$API.common.captcha`。

---

## 6. 强制要求

| # | 要求 |
|---|---|
| ✅ | 每个模块必须定义完整的 list/get/add/mod/delete 五个方法 |
| ✅ | 命名空间使用小写英文 |
| ✅ | 必须使用 `async function` 定义请求方法 |
| ✅ | URL 必须使用 `API.b2b.微服务名` 开头，禁止使用 `config.API_URL` |
| ✅ | mod 方法使用 `PUT`，delete 方法使用 `DELETE`（RESTful 规范） |
| ✅ | delete 方法参数为 `id`（主键值），URL 拼接为 `/{id}` |
| ✅ | 所有字段名使用 camelCase，与 Java 接口保持一致 |
| ✅ | **同一 `export default` 对象中禁止出现重复的命名空间 key**（会导致 ESLint `no-dupe-keys` 编译失败，后定义的 key 会静默覆盖前者，造成接口调用 404 或数据错乱） |
| ❌ | 禁止在 API 模型文件中写业务逻辑 |
| ❌ | 禁止在 API 模型文件中处理响应数据（数据转换放在组件层） |
| ❌ | 禁止使用 `config.API_URL` 拼接 URL，统一用 `API` 路径管理 |
| ❌ | 禁止 mod 使用 `POST`，应使用 `PUT` |
| ❌ | 禁止 delete 使用 `POST`，应使用 `DELETE` |

### 6.1 常见错误：重复命名空间 key

当同一个 API 模型文件包含多个命名空间时，容易出现重复 key 的情况，例如：

```javascript
// ❌ 错误示例：qualFieldDict 出现两次，后者静默覆盖前者
export default {
    qual: { /* ... */ },
    qualFieldDict: {        // ← 第一次定义
        list: { url: `${API.b2b.system}/qual-field-dict`, /* ... */ },
        // ... 完整的 CRUD 方法
    },
    categoryQualRel: { /* ... */ },
    scene: { /* ... */ },
    qualFieldDict: {        // ← 重复！ESLint no-dupe-keys 报错，后者覆盖前者
        list: { url: `${API.b2b.system}/qual-field-dict-v2`, /* ... */ },
    },
}
```

**修复方式**：检查文件中所有顶级 key 是否唯一，删除重复的命名空间块。

```javascript
// ✅ 正确：每个命名空间 key 唯一
export default {
    qual: { /* ... */ },
    qualFieldDict: { /* ... */ },   // 只出现一次
    categoryQualRel: { /* ... */ },
    scene: { /* ... */ },
}
```

> **排查建议**：新增命名空间前，先在文件内搜索已有 key 名，避免重复。若 ESLint 报 `no-dupe-keys`，直接定位报错行号删除重复块即可。

---

## 7. 完整示例

参见 `demos/api-model-demo.js`。

## 8. 字段命名规范

参见 `rules/field-naming-rule.md`，所有前端字段必须使用 camelCase。
