<!--
 * 数据字典展示 Demo —— scDictLabel 的四种标准用法
 *
 * 规范：rules/dict-rule.md
 * 组件：admin/src/components/scDictLabel/index.vue（已在 src/ecxui.js 全局注册，页面无需 import）
 *
 * 复制要点：
 *   1. 列定义只标 dictCode，且编码引用模块 dict.js 的常量（禁止写 'user_reg_type' 字面量）；
 *   2. 模板只保留一个字典渲染分支，不要为每个字典列各写具名 slot；
 *   3. 卡片头用 variant="outline"（对应旧 el-tag effect="plain"）；
 *   4. 句子里的字典值用 variant="text" + :dot="false"；
 *   5. 数组入参自动渲染多个标签。
-->

<template>
	<el-container direction="vertical">
		<!-- # 用法 ①：列表单元格 —— 列定义里标 dictCode -->
		<el-main class="nopadding">
			<scTable :data="rows" row-key="id" stripe border hide-pagination hide-do>
				<el-table-column
					v-for="col in tableColumns"
					:key="col.prop"
					:prop="col.prop"
					:label="col.label"
					:width="col.width"
					:align="col.align"
				>
					<template #default="scope">
						<!-- 字典列：统一一个分支，不要一列一个 slot -->
						<scDictLabel
							v-if="col.dictCode"
							:dict-code="col.dictCode"
							:model-value="scope.row[col.prop]"
						/>
						<template v-else>{{ scope.row[col.prop] }}</template>
					</template>
				</el-table-column>
			</scTable>
		</el-main>

		<!-- # 用法 ②③④：抽屉 / 卡片的头部、句子、多值 -->
		<el-main>
			<el-card class="form-card" shadow="never">
				<template #header>
					<div class="card-head">
						<span class="card-title">单位与联系人</span>
						<!-- 用法 ②：卡片头，描边形态 -->
						<scDictLabel
							:dict-code="sourceTypeDictCode"
							:value="rows[0].sourceType"
							variant="outline"
						/>
						<span class="card-hint">单位名称 / 联系人 / 手机号取自来源登记</span>
					</div>
				</template>

				<!-- 用法 ④：多值字典，逐项渲染 -->
				<div class="row">
					<span class="row-label">附件类型：</span>
					<scDictLabel dict-code="qual_file_type" :value="['ORIGINAL_SCAN', 'COPY_STAMPED']" />
				</div>

				<!-- 未命中 / 空值：显示占位，不暴露内部 key -->
				<div class="row">
					<span class="row-label">未知字典值：</span>
					<scDictLabel dict-code="user_reg_type" value="UNKNOWN_KEY" />
				</div>
			</el-card>

			<div class="footer-tip">
				共 {{ rows.length }} 条 · 来源：
				<!-- 用法 ③：嵌在句子里，纯文字形态 -->
				<scDictLabel
					:dict-code="sourceTypeDictCode"
					:value="rows[0].sourceType"
					variant="text"
					:dot="false"
				/>
				· 示例单位名称
			</div>
		</el-main>
	</el-container>
</template>

<script>
// 字典编码常量：真实项目里来自模块级 dict.js（如 views/eXenterprise/customers/source/dict.js）
const SOURCE_TYPE_DICT_CODE = 'user_reg_type';
const SOURCE_AUTH_STATUS_DICT_CODE = 'user_auth_status';

// 列定义：字典列只标 dictCode，中文列头由 i18n 的 field() 解析（此处为 Demo 直接写死）
const tableColumns = [
	{ prop: 'custName', label: '单位名称', minWidth: 220 },
	{ prop: 'sourceType', label: '数据来源', width: 110, align: 'center', dictCode: SOURCE_TYPE_DICT_CODE },
	{ prop: 'certStatus', label: '认证状态', width: 110, align: 'center', dictCode: SOURCE_AUTH_STATUS_DICT_CODE }
];

export default {
	name: 'DictLabelDemo',
	data() {
		return {
			tableColumns,
			rows: [
				{ id: 1, custName: '示例贸易有限公司', sourceType: 'ONLINE', certStatus: 0 },
				{ id: 2, custName: '示例供应链有限公司', sourceType: 'LEAD', certStatus: 1 },
				{ id: 3, custName: '示例实业有限公司', sourceType: 'ONLINE', certStatus: 2 },
				{ id: 4, custName: '示例科技有限公司', sourceType: 'ONLINE', certStatus: 3 }
			]
		};
	},
	computed: {
		// 模板里取不到 import 的常量，经 computed 暴露给 scDictLabel
		sourceTypeDictCode() {
			return SOURCE_TYPE_DICT_CODE;
		}
	},
	mounted() {
		// 字典兜底：登录时已预加载，首次进入若缓存无该字典则补刷一次
		if (!this.$DICT.getDictItems(SOURCE_AUTH_STATUS_DICT_CODE).length) {
			this.$DICT.loadDictData();
		}
	}
};
</script>

<style scoped>
.form-card {
	margin-bottom: 16px;
}
.card-head {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}
.card-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--el-text-color-primary);
}
.card-hint {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}
.row {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}
.row-label {
	font-size: 13px;
	color: var(--el-text-color-regular);
}
.footer-tip {
	font-size: 12px;
	color: var(--el-text-color-secondary);
}
</style>
