<!--
  表单型抽屉 Demo — form-drawer-demo.vue
  场景：编辑/配置表单，el-form + el-card 卡片化分区，卡内字段一行三格
  关键点：一行三格（:span="8"）+ 通栏例外（:span="24"）；上传一律用组件库现成组件；
         append-to-body 传送 → scoped 样式落在本组件模板元素上；#footer 只放提交类按钮
  规范依据：rules/form-drawer-card-rule.md、rules/drawer-layout-rule.md、rules/drawer-comm-rule.md
  用法：复制本文件，替换分区与表单项即可落地
-->
<template>
	<!-- 一行三格要求 size ≥ 75%；50% 下每格扣掉 label 后控件不足 100px -->
	<el-drawer
		v-model="visible"
		:title="dialogTitle"
		size="75%"
		direction="rtl"
		append-to-body
		:close-on-click-modal="false"
		@closed="handleClosed"
	>
		<!-- 样式落点写在 .drawer-form / .form-card（本组件模板内元素），不深穿透 .el-drawer__body -->
		<el-form ref="formRef" class="drawer-form" :model="form" :rules="rules" :disabled="readonly" label-width="100px">
			<!-- 分区块 1：全部常规字段，一行三格 -->
			<el-card class="form-card" shadow="never">
				<template #header><span class="card-title">基本信息</span></template>
				<el-row :gutter="20">
					<el-col :span="8">
						<el-form-item label="属性编码" prop="code">
							<el-input v-model="form.code" placeholder="英文稳定标识" clearable />
						</el-form-item>
					</el-col>
					<el-col :span="8">
						<el-form-item label="属性名称" prop="name">
							<el-input v-model="form.name" placeholder="如 样品类型" clearable />
						</el-form-item>
					</el-col>
					<el-col :span="8">
						<el-form-item label="组件类型" prop="componentType">
							<dict-select dict-code="component_type" v-model="form.componentType" placeholder="请选择" style="width: 100%;" />
						</el-form-item>
					</el-col>

					<!-- 第2行：数字占一格（不是通栏例外）；日期占一格；字典单选占一格 -->
					<el-col :span="8">
						<el-form-item label="排序" prop="sort">
							<el-input-number v-model="form.sort" :min="0" :step="1" controls-position="right" style="width: 100%;" />
						</el-form-item>
					</el-col>
					<el-col :span="8">
						<el-form-item label="生效日期" prop="effectiveDate">
							<sc-date-picker v-model="form.effectiveDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择" style="width: 100%;" />
						</el-form-item>
					</el-col>
					<el-col :span="8">
						<el-form-item label="是否必填" prop="required">
							<dict-radio dict-code="yes_no" v-model="form.required" />
						</el-form-item>
					</el-col>

					<!-- 通栏例外①：备注（多行文本） -->
					<el-col :span="24">
						<el-form-item label="备注" prop="remark">
							<el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="选填" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-card>

			<!-- 分区块 2：上传能力一律用组件库现成组件，禁止自绘 el-upload -->
			<el-card class="form-card" shadow="never">
				<template #header><span class="card-title">附件材料</span></template>
				<el-row :gutter="20">
					<!-- 单图占一格即可（默认 148×148 放得下） -->
					<el-col :span="8">
						<el-form-item label="封面图" prop="cover">
							<sc-upload v-model="form.cover" title="上传封面" />
						</el-form-item>
					</el-col>

					<!-- 通栏例外②：多图上传（缩略图横排） -->
					<el-col :span="24">
						<el-form-item label="详情图集" prop="images">
							<sc-upload-multiple v-model="form.images" :limit="9" tip="最多 9 张，支持 jpg/png/gif" />
						</el-form-item>
					</el-col>

					<!-- 通栏例外③：文件上传（文件列表纵排） -->
					<el-col :span="24">
						<el-form-item label="规格书" prop="files">
							<sc-upload-file v-model="form.files" :limit="5" accept=".pdf,.doc,.docx,.xls,.xlsx" tip="最多 5 个文件" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-card>

			<!-- 分区块 3：地址（组合控件，通栏例外） -->
			<el-card class="form-card" shadow="never">
				<template #header><span class="card-title">联系地址</span></template>
				<el-row :gutter="20">
					<el-col :span="24">
						<el-form-item label="所在地区" prop="region">
							<el-cascader
								v-model="form.region"
								:options="regionOptions"
								placeholder="省 / 市 / 区"
								clearable
								style="width: 100%;"
							/>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="详细地址" prop="address">
							<el-input v-model="form.address" placeholder="街道、门牌号" clearable />
						</el-form-item>
					</el-col>
				</el-row>
			</el-card>
		</el-form>

		<!-- #footer 只放提交类按钮；新增/批量等业务动作按钮属列表型抽屉的 el-header -->
		<template #footer>
			<el-button @click="visible = false">取消</el-button>
			<el-button v-if="!readonly" type="primary" @click="submit">确定</el-button>
		</template>
	</el-drawer>
</template>

<script>
	import DictSelect from '@/components/DictSelect/index.vue';
	import DictRadio from '@/components/DictRadio/index.vue';
	import ScDatePicker from '@/components/ScDatePicker/index.vue';

	const EMPTY_FORM = () => ({
		code: '',
		name: '',
		componentType: '',
		sort: 0,
		effectiveDate: '',
		required: 0,
		remark: '',
		cover: '',
		images: [],
		files: [],
		region: [],
		address: ''
	});

	export default {
		name: 'FormDrawerDemo',
		components: { DictSelect, DictRadio, ScDatePicker },
		props: {
			readonly: { type: Boolean, default: false }
		},
		emits: ['confirm'],
		data() {
			return {
				visible: false,
				mode: 'add',
				form: EMPTY_FORM(),
				regionOptions: []
			};
		},
		computed: {
			// 标题前缀与模式/只读同步：查看 / 新增 / 配置
			dialogTitle() {
				const prefix = this.readonly ? '查看' : this.mode === 'add' ? '新增' : '配置';
				return `${prefix}动态字段`;
			},
			rules() {
				return {
					name: [{ required: true, message: '请输入属性名称', trigger: 'blur' }],
					componentType: [{ required: true, message: '请选择组件类型', trigger: 'change' }]
				};
			}
		},
		methods: {
			// 命令式打开：data 为空 = 新增
			open(data) {
				this.mode = data ? 'edit' : 'add';
				this.form = data ? this.normalize(data) : EMPTY_FORM();
				this.visible = true;
				this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
			},
			// 显式逐字段赋值，禁止 {...data} 展开（避免后端多余字段污染表单）
			normalize(data) {
				return {
					code: data.code || '',
					name: data.name || '',
					componentType: data.componentType || '',
					sort: data.sort || 0,
					effectiveDate: data.effectiveDate || '',
					required: data.required || 0,
					remark: data.remark || '',
					cover: data.cover || '',
					images: Array.isArray(data.images) ? [...data.images] : [],
					files: Array.isArray(data.files) ? [...data.files] : [],
					region: Array.isArray(data.region) ? [...data.region] : [],
					address: data.address || ''
				};
			},
			submit() {
				this.$refs.formRef.validate(valid => {
					if (!valid) return;
					// 显式逐字段构造提交体，禁止 {...this.form} 展开
					this.$emit('confirm', this.normalize(this.form));
					this.visible = false;
				});
			},
			handleClosed() {
				// 复位内部状态，避免下次打开残留
				this.mode = 'add';
				this.form = EMPTY_FORM();
			}
		}
	};
</script>

<style scoped>
	/* 抽屉内容左右留白 16px，卡片作为板块分区 */
	.drawer-form {
		padding: 4px 16px 0;
	}

	/* 卡片类名统一 .form-card，禁止按业务另起（.block-card / .field-drawer-form） */
	.form-card {
		margin-bottom: 16px;
		border-radius: 6px;
	}

	.form-card:last-child {
		margin-bottom: 0;
	}

	/* append-to-body 传送后：落在本组件模板内元素（el-card），仍带 data-v scope，正常命中 */
	.form-card :deep(.el-card__header) {
		padding: 10px 16px;
		background: var(--el-fill-color-light);
	}

	.form-card :deep(.el-card__body) {
		padding: 18px 18px 0;
	}

	.card-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}
</style>
