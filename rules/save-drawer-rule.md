# 保存表单抽屉 save.vue 规范 — save-drawer-rule.md

本文件只负责 **save.vue 的行为契约**：骨架与抽屉属性、组件用法补充、add/mod/view 三模式、表单校验、提交与事件。

> 以下内容**不在本文件重复**，一律看单一事实来源：
>
> | 主题 | 单一事实来源 |
> |---|---|
> | 卡片分区、一行三格、通栏例外、组件白名单、卡片样式块、`append-to-body` scoped 落点 | `form-drawer-card-rule.md` §1–§6 |
> | 抽屉宽度档位、嵌套降档、列表型抽屉骨架 | `drawer-layout-rule.md` §1、§4 |
> | 父子通信、`open()` 命令式调用、保存后刷新 | `drawer-comm-rule.md` |
> | 字段命名 camelCase、RESTful 接口 | `field-naming-rule.md`、`api-model-rule.md` |

---

## 1. 骨架与抽屉属性

### 1.1 模板骨架

```html
<el-drawer
  :title="titleMap[mode]"
  v-model="visible"
  size="75%"
  direction="rtl"
  destroy-on-close
  @closed="$emit('closed')"
>
  <el-container direction="vertical">
    <el-main class="nopadding">
      <el-form
        ref="dialogForm"
        class="drawer-form"
        :model="form"
        :disabled="mode == 'view'"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-card class="form-card" shadow="never">
          <template #header><span class="card-title">基本信息</span></template>
          <el-row :gutter="20">
            <el-col :span="8"><!-- 表单项 --></el-col>
            <el-col :span="8"><!-- 表单项 --></el-col>
            <el-col :span="8"><!-- 表单项 --></el-col>
            <!-- 通栏例外（备注/地址/富文本/上传/子表）放卡片末尾 -->
            <el-col :span="24"><!-- 表单项 --></el-col>
          </el-row>
        </el-card>
      </el-form>
    </el-main>

    <template #footer>
      <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button v-if="mode != 'view'" type="primary" :loading="isSaveing" @click="submit">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-container>
</el-drawer>
```

### 1.2 drawer 属性强制要求

| 属性 | 值 | 说明 |
|---|---|---|
| `size` | `"75%"` | 百分比档位字符串写法；一行三格默认 `75%`，档位表见 `drawer-layout-rule.md` §4 |
| `direction` | `"rtl"` | 从右侧滑出 |
| `destroy-on-close` | — | 关闭时销毁组件 |
| `@closed` | `$emit('closed')` | 关闭后通知父组件 |

### 1.3 底部操作区

- 标准写法用 **`#footer` 插槽**，只放「取消 / 保存（确定）」提交类按钮，禁止在内容区自绘按钮行。
- 历史页面用 `el-container > el-footer` 承载底部按钮同样有效（项目内两种写法并存），**同一模块内保持一致**即可，不为统一而重写既有页面。
- 新增 / 批量 / 导入导出等业务动作按钮**不属于**表单型抽屉，属列表型抽屉的 `el-header`（`drawer-layout-rule.md` §2）。
- `view` 态隐藏保存按钮并 `:disabled="mode == 'view'"` 禁用整个表单。

---

## 2. 组件用法补充

> 白名单与「禁止自研」总表见 `form-drawer-card-rule.md` §4；本节只补 save.vue 里的具体写法差异。

### 2.1 el-input（文本）

```html
<el-form-item label="税率编码" prop="taxCode">
  <el-input v-model="form.taxCode" clearable placeholder="请输入税率编码" style="width: 100%;"></el-input>
</el-form-item>
```

> 必须 `clearable` + `placeholder` + `style="width: 100%;"`；字段名 camelCase。

### 2.2 el-input-number（数值）

```html
<el-form-item label="税率值" prop="taxValue">
  <el-input-number
    v-model="form.taxValueDisplay"
    :min="0"
    :max="100"
    :precision="2"
    :step="1"
    style="width: 100%;"
    controls-position="right"
  ></el-input-number>
</el-form-item>
```

- **必须** `controls-position="right"`（+/- 在右侧）
- 数值类型必须 `:min="0"`；货币/税率用 `:precision="2"`；整数用 `:step="1"`
- 占一格，**不是通栏例外**
- **显示值与实际值分离**：前端显示百分比（`taxValueDisplay`）、提交小数（`taxValue`），用 `watch` 同步：

```javascript
watch: {
  'form.taxValueDisplay'(val) {
    if (val !== undefined && val !== null) {
      this.form.taxValue = val / 100;
    }
  }
}
```

### 2.3 DictSelect / DictRadio（字典）

```html
<el-form-item label="单位类型" prop="unitType">
  <dict-select v-model="form.unitType" dict-code="unit_type" placeholder="请选择" clearable style="width: 100%;"></dict-select>
</el-form-item>

<el-form-item label="状态" prop="taxStatus">
  <dict-radio dict-code="disabled_status" v-model="form.taxStatus" />
</el-form-item>
```

非全局组件，**必须**手动导入并注册：

```javascript
import DictSelect from "@/components/DictSelect/index.vue";
import DictRadio from "@/components/DictRadio/index.vue";
export default { components: { DictSelect, DictRadio } };
```

> 状态字段优先 `dict-radio`；`dict-radio` 的值经 `setData` 时需 `String()` 转换。

### 2.4 sc-date-picker（日期）

```html
<el-form-item label="日期" prop="createTime">
  <sc-date-picker v-model="form.createTime" type="date" style="width: 100%;" placeholder="选择日期"></sc-date-picker>
</el-form-item>
```

**必须** kebab-case `<sc-date-picker>`（禁止 PascalCase），并手动 `import ScDatePicker from "@/components/ScDatePicker/index.vue"` + 注册。

### 2.5 sc-upload-multiple（多图，全局注册）

```html
<el-form-item label="图片" prop="imageUrl">
  <sc-upload-multiple v-model="form.imageUrl"></sc-upload-multiple>
</el-form-item>
```

`v-model` 绑字符串（逗号分隔 URL），组件自动做数组 ↔ 字符串转换；位于卡片通栏位置。

---

## 3. 三模式交互（add / mod / view）

### 3.1 titleMap

```javascript
titleMap: {
  add: '新增XX',
  mod: '编辑XX',
  view: '查看XX',
},
```

### 3.2 模式行为对照表

| 行为 | add | mod | view |
|---|---|---|---|
| 表单启用 | ✅ 可编辑 | ✅ 可编辑 | ❌ 禁用 |
| 保存按钮 | ✅ 显示 | ✅ 显示 | ❌ 隐藏 |
| 表单数据 | 初始空值 | 回填行数据 | 回填行数据 |
| 调用 API | `模块名.add.post` | `模块名.mod.put` | 无 |
| 创建/更新人 | 后端自动填充 | 后端自动填充 | 无 |

### 3.3 open() 方法

```javascript
open(mode = "add") {
  if (mode == "add") {
    this.$nextTick(() => {
      this.form = {
        taxCode: '',
        taxName: '',
        taxValue: 0,
        taxValueDisplay: 0,
        taxSort: 0,
        taxStatus: '1',
        taxRemark: '',
      };
    });
  }
  this.mode = mode;
  this.visible = true;
  return this;   // 允许链式调用
}
```

> `form` 每个字段必须显式声明默认值：数值 `0`、字符串 `''`、状态 `'1'`。

### 3.4 setData() 方法（回填）

```javascript
setData(data) {
  this.form = {
    id: data.id || '',
    taxCode: data.taxCode || '',
    taxName: data.taxName || '',
    taxValue: data.taxValue ?? 0,
    taxValueDisplay: data.taxValue ? (data.taxValue * 100) : 0,
    taxSort: data.taxSort ?? 0,
    taxStatus: data.taxStatus != null ? String(data.taxStatus) : '1',
    taxRemark: data.taxRemark || '',
  };
}
```

> **必须逐字段赋值，禁止 `{...data}` 展开** —— 防止后端多余字段污染表单，并保证显示值正确计算。

### 3.5 关闭复位

- `@closed` 时 `$emit('closed')` 通知父级；父级 `@closed="dialog.save = false"` 销毁组件（`v-if`）。
- 若抽屉常驻（不加 `v-if`），必须在 `@closed`/`handleClosed` 里复位 `form`、`mode`、`isSaveing` 与临时弹层键，避免下次打开残留上次数据（见 `drawer-comm-rule.md` §4）。

---

## 4. 日期范围字段拆分 / 合并

### 4.1 拆分（submit 时）

表单内用 `createTimeRange` 等内部字段，提交时拆成后端两个字段：

```javascript
// if (this.form.activePeriod && Array.isArray(this.form.activePeriod)) {
//   submitData.startTime = this.form.activePeriod[0] || null;
//   submitData.endTime = this.form.activePeriod[1] || null;
// }
```

### 4.2 合并（setData 时）

```javascript
setData(data) {
  this.form = {
    id: data.id || '',
    activePeriod: data.startTime && data.endTime ? [data.startTime, data.endTime] : null,
  };
}
```

---

## 5. 表单验证规则

```javascript
rules: {
  taxCode: [{ required: true, message: '税率编码不能为空', trigger: "blur" }],
  taxName: [{ required: true, message: '税率名称不能为空', trigger: "blur" }],
  taxStatus: [{ required: true, message: '状态不能为空', trigger: "change" }],
  taxValue: [{ required: true, message: '税率值不能为空', trigger: "blur" }],
}
```

| 组件类型 | trigger |
|---|---|
| `el-input` | `"blur"` |
| `DictSelect` | `"change"` |
| `el-input-number` | `"blur"` |
| `sc-date-picker` | `"change"` |
| `sc-upload-multiple` | `"change"` |

---

## 6. submit() 提交逻辑骨架

```javascript
submit() {
  this.$refs.dialogForm.validate(async (valid) => {
    if (valid) {
      this.isSaveing = true;
      try {
        // 显式构造提交数据，禁止 ...this.form 展开
        var submitData = {
          taxCode: this.form.taxCode,
          taxName: this.form.taxName,
          taxValue: this.form.taxValue,
          taxSort: this.form.taxSort ?? 0,
          taxStatus: this.form.taxStatus ?? '1',
          taxRemark: this.form.taxRemark || '',
        };

        var res = null;
        if (this.mode == "add") {
          res = await this.$API.system.taxRate.add.post(submitData);
        } else if (this.mode == "mod") {
          if (!this.form.id) {
            this.$alert('主键ID不存在', '提示', { type: 'error' });
            this.isSaveing = false;
            return;
          }
          submitData.id = this.form.id;
          res = await this.$API.system.taxRate.mod.put(submitData);
        }

        this.isSaveing = false;
        if (res && res.code == 200) {
          this.$emit("success", submitData, this.mode);
          this.visible = false;
          this.$message.success(this.$t('common.operationSuccess'));
        } else {
          this.$alert(res?.message || this.$t('common.operationFailed'), this.$t('common.tip'), { type: "error" });
        }
      } catch (error) {
        this.isSaveing = false;
        this.$alert(error.message || this.$t('common.operationFailed'), this.$t('common.tip'), { type: 'error' });
      }
    }
  });
}
```

---

## 7. Emit 事件规范

```javascript
emits: ["success", "closed"],
```

| 事件 | 触发时机 | 载荷 |
|---|---|---|
| `success` | 提交成功时 | `(data, mode)` |
| `closed` | 抽屉关闭后 | 无 |

---

## 8. 强制要求

| # | 要求 |
|---|---|
| ✅ | 表单必须用 `el-drawer`；单实体轻量共用弹窗可用共用 `el-dialog`（见 `drawer-layout-rule.md` §4） |
| ✅ | `size="75%"` + `direction="rtl"` + `destroy-on-close` + `@closed` 四项齐全 |
| ✅ | 卡片化分区、一行三格、通栏例外、组件白名单、样式块一律照 `form-drawer-card-rule.md` 执行，本文件不另立标准 |
| ✅ | 加载 `el-form` 的 `el-main` 必须 `class="nopadding"`（`el-form` 直接挂 `el-drawer` 时不需要） |
| ✅ | 每个表单必须支持 add / mod / view 三模式；view 态禁用表单 + 隐藏保存按钮 |
| ✅ | 数字组件 `el-input-number` + `controls-position="right"` + `:min="0"` |
| ✅ | `DictSelect` / `DictRadio` / `ScDatePicker` 必须手动导入注册；日期一律 kebab-case |
| ✅ | 日期段必须实现提交拆分 / 回填合并 |
| ✅ | submitData **显式逐字段构造**，禁止 `{...this.form}`；setData **显式逐字段赋值**，禁止 `{...data}` |
| ✅ | mod 用 `PUT` 且必须带主键；创建人/更新人由后端填充，前端不传 |
| ✅ | 必须在 `emits` 声明 `success` 与 `closed` |
| ❌ | 禁止 `label-position="top"`、禁止 `:span="12/16"` 两列、禁止整表退回 `:span="24"` 单列（通栏例外除外） |
| ❌ | 禁止自绘 `el-upload`、自研上传/选择器、使用未全局注册的 `ScFileUpload` |
| ❌ | 禁止 view 态显示保存按钮或保留可编辑表单 |
| ❌ | 禁止使用 snake_case 字段名 |

---

## 9. 完整示例

参见 `demos/save.vue`（save.vue 完整实现）、`demos/form-drawer-demo.vue`（非 CRUD 的配置型表单抽屉）。
