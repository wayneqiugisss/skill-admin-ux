# 抽屉父子通信与数据刷新规范 — drawer-comm-rule.md

抽屉内行操作/子配置往往再打开一个**子抽屉或对话框**。本文件定义父抽屉与子组件之间的显隐控制、数据注入与保存后刷新机制。

---

## 1. 两种打开方式（择一，团队内保持一致）

### 1.1 声明式：`v-model:visible`（父持有显隐状态）

父组件持有 `visible` 与当前数据引用，子组件 `computed` 双向绑定：

```html
<!-- 父：列表型抽屉 -->
<rule-edit-drawer v-model:visible="editVisible" :rule="currentRule" @refresh="onRefresh" />
```

```js
// 子组件
computed: {
    visible: {
        get() { return this.modelValue; },   // props: modelValue / visible
        set(v) { this.$emit('update:modelValue', v); }
    }
}
```

- 适用：子组件无独立入参、完全由父状态驱动显隐。

### 1.2 命令式：`open(data)`（子自持显隐）— 本项目 baice/product 采用

父通过 `$refs` 调用子组件 `open()` 注入数据并打开，子内部维护 `visible`：

```html
<!-- 父：列表容器 -->
<DynamicFieldDialog ref="fieldDialog" :fields="fields" :readonly="readonly" @confirm="handleFieldConfirm" />
```

```js
// 父：行按钮直接调用
openFieldDialog(field) { this.$refs.fieldDialog.open(field); }   // field 为空 = 新增

// 子组件
methods: {
    open(field) {
        this.mode = field ? 'edit' : 'add';
        this.form = this.buildForm(field);   // 注入数据
        this.visible = true;
        this.$nextTick(() => this.$refs.formRef?.clearValidate());
    },
    submit() {
        /* 校验通过 */
        this.$emit('confirm', this.form);    // 回传结果
        this.visible = false;
    }
}
```

- 优点：父不必维护 `visible`/`currentXxx` 中间态；标题的"查看/新增/配置"前缀由子组件按 `mode`+`readonly` 自算。

---

## 2. 同级放置，浮层不嵌套

- 子抽屉/对话框一律与父 `el-drawer` **同级**书写，通过 `append-to-body` 浮于父之上；
- **禁止**把子抽屉嵌进父的 `el-container`/`el-main` 内部（层级、遮罩、滚动会互相干扰）；
- 子抽屉宽度须比父抽屉小至少一档（见 `drawer-layout-rule.md`）。

---

## 3. 保存/删除后的数据刷新（关键）

### 3.1 声明式刷新的引用陷阱

子组件保存/删除成功后 `$emit('refresh')`，父组件回刷：

```
子组件（rulePanelDrawer）
  └── 保存/删除成功 → this.$emit('refresh')

父组件（列表抽屉）
  └── @refresh="onRulePanelRefresh"
      ├── await this.loadData()            // 重新请求后端，得到全新对象数组
      ├── 按稳定标识重新定位（如 productSkuCode / id）
      └── this.currentSku = updatedSku     // 用新对象替换旧引用
```

**关键点**：`loadData()` 会创建**全新的对象数组**，`currentSku`/`currentRow` 仍指向旧引用。必须在 `loadData()` 后按稳定标识（`productSkuCode`、`id`、`code` 等）**重新查找并替换当前引用**，否则子组件 `prop` 不更新、列表不刷新。

### 3.2 命令式（本地 mock / 子表）刷新

子组件回传结果，父按主键 upsert 到本地数组：

```js
handleFieldConfirm(field) {
    const i = this.fields.findIndex(f => f.id === field.id);
    if (i >= 0) this.fields.splice(i, 1, field);   // 更新
    else this.fields.push(field);                   // 新增
}
```

- 局部增删改优先 `splice` / 直接赋值，**不触发整表重载**；
- 稳定标识用 `code`/`id`，改标识需级联更新其它地方对该标识的引用。

---

## 4. 强制约束

1. **子组件与父 `el-drawer` 同级放置**，`append-to-body` 浮层，禁止嵌入父内容区。
2. **同一模块内打开方式统一**：要么全用 `v-model:visible`，要么全用 `open()`，不混用。
3. **声明式刷新必须按稳定标识重新定位并替换当前引用** — `loadData()` 后旧引用失效。
4. **子组件数据变更通过 `$emit('refresh'/'confirm'/'saved')` 通知父级** — 父级负责回刷数据源，子组件不直接改父状态。
5. **子组件在 `@closed`/`handleClosed` 复位内部状态**（form、mode、临时弹层键）— 避免下次打开残留上次数据。
