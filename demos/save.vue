<template>
	<!-- # el-drawer 抽屉表单（不可用 el-dialog 替代）
	     一行三格要求 size ≥ 75%；50% 下每格扣掉 label 后控件不足 100px -->
	<el-drawer
		:title="titleMap[mode]"
		v-model="visible"
		size="75%"
		direction="rtl"
		destroy-on-close
		@closed="$emit('closed')"
	>
		<el-container direction="vertical">
			<!-- # nopadding 清掉全局 .el-main 的 15px，留白统一由 .drawer-form 的 16px 提供 -->
			<el-main class="nopadding">
				<!-- label-width 100px；禁止 label-position="top"（三格下会变成三列高塔） -->
				<el-form
					ref="dialogForm"
					class="drawer-form"
					:model="form"
					:disabled="mode == 'view'"
					:rules="rules"
					label-width="100px"
					v-loading="loading"
				>
					<!-- # 分块卡片：类名统一 .form-card，禁止按业务另起 -->
					<el-card class="form-card" shadow="never">
						<template #header><span class="card-title">基本信息</span></template>
						<el-row :gutter="20">
							<!-- # 第1行：满 3 格 -->
							<el-col :span="8">
								<el-form-item label="税率编码" prop="taxCode">
									<el-input v-model="form.taxCode" clearable placeholder="请输入税率编码" style="width: 100%;"></el-input>
								</el-form-item>
							</el-col>
							<el-col :span="8">
								<el-form-item label="税率名称" prop="taxName">
									<el-input v-model="form.taxName" clearable placeholder="请输入税率名称" style="width: 100%;"></el-input>
								</el-form-item>
							</el-col>
							<!-- el-input-number 占一格，不是通栏例外；显示值与实际值分离 -->
							<el-col :span="8">
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
							</el-col>

							<!-- # 第2行：末行 2 格，空缺落在行尾 -->
							<el-col :span="8">
								<el-form-item label="状态" prop="taxStatus">
									<dict-radio dict-code="disabled_status" v-model="form.taxStatus" />
								</el-form-item>
							</el-col>
							<el-col :span="8">
								<el-form-item label="排序" prop="taxSort">
									<el-input-number
										v-model="form.taxSort"
										:min="0"
										:step="1"
										style="width: 100%;"
										controls-position="right"
									></el-input-number>
								</el-form-item>
							</el-col>

							<!-- # 通栏例外：备注（多行文本）放卡片末尾 -->
							<el-col :span="24">
								<el-form-item label="备注" prop="taxRemark">
									<el-input
										v-model="form.taxRemark"
										type="textarea"
										:rows="3"
										maxlength="200"
										show-word-limit
										placeholder="请输入备注"
									></el-input>
								</el-form-item>
							</el-col>
						</el-row>
					</el-card>
				</el-form>
			</el-main>
			<el-footer>
				<el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
				<el-button
					v-if="mode != 'view'"
					type="primary"
					:loading="isSaveing"
					@click="submit"
				> {{ $t('common.save') }}</el-button>
			</el-footer>
		</el-container>
	</el-drawer>
</template>

<script>
import DictRadio from "@/components/DictRadio/index.vue";

export default {
	components: { DictRadio },
	emits: ["success", "closed"],
	data() {
		return {
			titleMap: {
				add: '新增税率',
				mod: '编辑税率',
				view: '查看税率',
			},
			loading: false,
			mode: "add",
			isSaveing: false,
			visible: false,
			rules: {
				taxCode: [
					{ required: true, message: '税率编码不能为空', trigger: "blur" }
				],
				taxName: [
					{ required: true, message: '税率名称不能为空', trigger: "blur" }
				],
				taxValue: [
					{ required: true, message: '税率值不能为空', trigger: "blur" }
				],
			},
			form: {},
		};
	},
	watch: {
		// 显示值（百分比）→ 实际值（小数）自动同步
		'form.taxValueDisplay'(val) {
			if (val !== undefined && val !== null) {
				this.form.taxValue = val / 100;
			}
		}
	},
	methods: {
		/**
		 * 打开抽屉
		 * @param {string} mode - add / mod / view
		 */
		open(mode = "add") {
			if (mode == "add") {
				this.$nextTick(() => {
					this.form = {
						// 初始化默认值，字段名必须 camelCase
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
			return this;
		},
		/**
		 * 提交表单
		 * submitData 显式逐字段构造，禁止 ...this.form 展开
		 * mod 使用 PUT，创建人/更新人由后端自动填充
		 */
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
							this.$alert(res ? res.message : this.$t('common.operationFailed'), this.$t('common.tip'), {
								type: "error",
							});
						}
					} catch (error) {
						this.isSaveing = false;
						this.$alert(error.message || this.$t('common.operationFailed'), this.$t('common.tip'), { type: 'error' });
					}
				}
			});
		},
		/**
		 * 表单注入数据（显式逐字段赋值，禁止 ...data 展开）
		 * 状态字段需 String() 转换，显示值需计算
		 */
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
		},
	},
};
</script>

<style scoped>
/* 抽屉内容左右留白 16px；卡片分块统一 .form-card，禁止按业务另起类名 */
.drawer-form {
	padding: 4px 16px 0;
}
.form-card {
	margin-bottom: 16px;
	border-radius: 6px;
}
.form-card:last-child {
	margin-bottom: 0;
}
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
