<template>
	<el-container>
		<el-container direction="vertical">
			<!-- # 第一层：头部 Tab —— 可选。本例无「同一实体多视图」需求，整层省略 -->

			<!-- # 第二层：检索条件（5 个字段 > 3 → 两行：3 + 2，末行空缺在行尾；须渲染展开/收起） -->
			<div class="search-wrap">
				<!-- # 第1行 - 常显条件（满 3 个） -->
				<el-row :gutter="20" style="margin-bottom: 10px;">
					<el-col :span="8">
						<el-input v-model="search.taxName" placeholder="税率名称" clearable @keyup.enter="upsearch">
							<template #prefix>
								<span class="prefix-label">税率名称</span>
							</template>
						</el-input>
					</el-col>
					<el-col :span="8">
						<el-input v-model="search.taxCode" placeholder="税率编码" clearable @keyup.enter="upsearch">
							<template #prefix>
								<span class="prefix-label">税率编码</span>
							</template>
						</el-input>
					</el-col>
					<el-col :span="8">
						<dict-select
							dict-code="disabled_status"
							v-model="search.taxStatus"
							placeholder="状态"
							clearable
							style="width: 100%;"
							need-prefix
							prefix="状态"
						></dict-select>
					</el-col>
				</el-row>

				<!-- # 第2行 - 可折叠条件（本行 2 个，空缺落在行尾） -->
				<el-row :gutter="20" style="margin-bottom: 10px;" :class="{'default-hide': !searchExpanded}">
					<el-col :span="8">
						<sc-date-picker
							v-model="search.createTimeRange"
							type="daterange"
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							value-format="YYYY-MM-DD"
							style="width: 100%;"
							clearable
							need-prefix
							prefix="创建时间"
						/>
					</el-col>
					<el-col :span="8">
						<el-input v-model="search.taxRemark" placeholder="备注" clearable @keyup.enter="upsearch">
							<template #prefix>
								<span class="prefix-label">备注</span>
							</template>
						</el-input>
					</el-col>
				</el-row>

				<!-- # 末行：搜索 + 重置 +（展开/收起，仅 searchCollapsible 为 true 时渲染） -->
				<el-row :gutter="20">
					<el-col :span="24">
						<div style="display: flex;">
							<el-button type="primary" icon="el-icon-search" @click="upsearch">搜索</el-button>
							<el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
							<el-button
								v-if="searchCollapsible"
								type="text"
								:icon="searchExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
								style="margin-right: 10px;"
								@click="searchExpanded = !searchExpanded"
							>{{ searchExpanded ? '收起' : '展开' }}</el-button>
						</div>
					</el-col>
				</el-row>
			</div>

			<!-- # 第三层：按钮（可选，无按钮时整层省略，不留空 el-header） -->
			<el-header style="height: auto;">
				<div class="left-panel">
					<el-button type="primary" icon="el-icon-plus" @click="add">新增税率</el-button>
				</div>
			</el-header>

			<!-- # 第四层：表格 -->
			<el-main class="nopadding">
				<scTable
					ref="table"
					stripe
					border
					remoteSort
					:apiObj="apiObj"
					remoteFilter
					row-key="id"
				>
					<!-- 数据列：prop 使用 camelCase -->
					<el-table-column label="税率编码" prop="taxCode" width="180"></el-table-column>
					<el-table-column label="税率名称" prop="taxName" min-width="180"></el-table-column>

					<!-- 格式化列：税率值百分比显示 -->
					<el-table-column label="税率值" prop="taxValue" width="120">
						<template #default="scope">
							{{ (scope.row.taxValue * 100).toFixed(2) }}%
						</template>
					</el-table-column>

					<!-- 状态列：el-switch 行内切换 -->
					<el-table-column label="状态" prop="taxStatus" width="100">
						<template #default="scope">
							<el-switch
								v-model="scope.row.taxStatus"
								@change="changeStatus($event, scope.row)"
								:loading="scope.row.$switch_status"
								:active-value="1"
								:inactive-value="0"
							></el-switch>
						</template>
					</el-table-column>

					<el-table-column label="排序" prop="taxSort" width="80"></el-table-column>
					<el-table-column label="备注" prop="taxRemark" min-width="150" show-overflow-tooltip></el-table-column>

					<!-- 系统通用字段：camelCase -->
					<el-table-column label="创建时间" prop="createTime" width="170"></el-table-column>

					<!-- # 操作列（固定右侧） -->
					<el-table-column :label="$t('common.operation')" fixed="right" width="200">
						<template #default="scope">
							<el-button-group>
								<el-button text type="primary" size="small" @click="table_view(scope.row)">{{ $t('common.view') }}</el-button>
								<el-button text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">{{ $t('common.edit') }}</el-button>
								<el-button text type="primary" size="small" @click="table_del(scope.row, scope.$index)">{{ $t('common.delete') }}</el-button>
							</el-button-group>
						</template>
					</el-table-column>
				</scTable>
			</el-main>
		</el-container>
	</el-container>

	<!-- # save 抽屉组件 -->
	<save
		v-if="dialog.save"
		ref="saveDialog"
		@success="handleSuccess"
		@closed="dialog.save = false"
	></save>
</template>

<script>
import save from "./save";
import DictSelect from "@/components/DictSelect/index.vue";
import ScDatePicker from "@/components/ScDatePicker/index.vue";

export default {
	name: "platform-base-setting-tax-rate",
	components: {
		save,
		DictSelect,
		ScDatePicker
	},
	data() {
		return {
			dialog: {
				save: false,
			},
			apiObj: this.$API.system.taxRate.list,
			// search 里只放检索条件字段，不放其它状态 —— searchCollapsible 依赖这一约定
			search: {
				// 第1行（常显，满 3 个），字段名必须 camelCase
				taxName: "",
				taxCode: "",
				taxStatus: null,
				// 第2行（可折叠）
				createTimeRange: null,
				taxRemark: "",
			},
			searchExpanded: false,
		};
	},
	computed: {
		// 检索条件超过一行（3 个）才需要折叠；条件增减后自动生效
		// 若裁到 ≤ 3 个：删掉第2行 el-row、展开/收起按钮、searchExpanded、本 computed 与 .default-hide 样式
		searchCollapsible() {
			return Object.keys(this.search).length > 3;
		},
	},
	methods: {
		/**
		 * 新增
		 */
		add() {
			this.dialog.save = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open();
			});
		},
		/**
		 * 查看
		 */
		async table_view(row) {
			this.dialog.save = true;
			await this.$nextTick();
			const dialog = await this.$refs.saveDialog.open("view");
			dialog.setData(row);
		},
		/**
		 * 编辑
		 */
		async table_edit(row) {
			this.dialog.save = true;
			await this.$nextTick();
			const dialog = await this.$refs.saveDialog.open("mod");
			dialog.setData(row);
		},
		/**
		 * 删除（局部删除，不整页重载）
		 * $confirm 二次确认 → 调用 delete.delete(row.id)，RESTful 规范
		 */
		async table_del(row, index) {
			try {
				await this.$confirm('确定要删除该记录吗？', '提示', { type: 'warning' });
			} catch {
				return; // 用户取消
			}
			var res = await this.$API.system.taxRate.delete.delete(row.id);
			if (res.code == 200) {
				this.$refs.table.tableData.splice(index, 1);
				this.$message.success(this.$t('common.deleteSuccess'));
			} else {
				this.$alert(res.message, this.$t('common.operationFailed'), { type: "error" });
			}
		},
		/**
		 * 状态切换（el-switch 行内切换）
		 */
		async changeStatus(val, row) {
			var oldStatus = val === 1 ? 0 : 1;
			row.taxStatus = oldStatus;
			row.$switch_status = true;
			try {
				var submitData = { id: row.id, taxStatus: val };
				var res = await this.$API.system.taxRate.mod.put(submitData);
				if (res.code == 200) {
					delete row.$switch_status;
					row.taxStatus = val;
					this.$message.success(this.$t('common.operationSuccess'));
				} else {
					row.taxStatus = oldStatus;
					delete row.$switch_status;
					this.$alert(res.message, this.$t('common.tip'), { type: 'error' });
				}
			} catch (error) {
				row.taxStatus = oldStatus;
				delete row.$switch_status;
				this.$message.error(this.$t('common.operationFailed'));
			}
		},
		/**
		 * 重置搜索条件：所有字段回初始值，再重载表格
		 */
		resetSearch() {
			this.search = {
				taxName: "",
				taxCode: "",
				taxStatus: null,
				createTimeRange: null,
				taxRemark: "",
			};
			this.searchExpanded = false;
			this.$refs.table.upData({});
		},
		/**
		 * 搜索：状态单值转 List，日期范围数组转逗号分隔字符串，空值不传
		 */
		upsearch() {
			const params = { ...this.search };
			// 状态查询：单值转 List
			if (params.taxStatus === null || params.taxStatus === '') {
				delete params.taxStatus;
			} else {
				params.taxStatusList = [params.taxStatus];
				delete params.taxStatus;
			}
			// 日期范围数组转逗号分隔字符串
			if (params.createTimeRange && Array.isArray(params.createTimeRange)) {
				params.createTimeRange = params.createTimeRange.join(',');
			} else {
				delete params.createTimeRange;
			}
			// 空字符串条件不下发
			if (!params.taxName) delete params.taxName;
			if (!params.taxCode) delete params.taxCode;
			if (!params.taxRemark) delete params.taxRemark;
			this.$refs.table.upData(params);
		},
		/**
		 * 操作成功回调
		 * mod 成功后必须重新查询后端最新数据，禁止直接用 submitData 覆盖行
		 */
		async handleSuccess(data, mode) {
			if (mode == "add") {
				this.$refs.table.refresh();
			} else if (mode == "mod") {
				var res = await this.$API.system.taxRate.get.get(data.id);
				if (res.code == 200) {
					this.$refs.table.tableData.filter(item => item.id == data.id).forEach(item => {
						Object.assign(item, res.data);
					});
				}
			}
		},
	},
};
</script>

<style scoped>
/* 标准样式块：逐字复制 style-css-rule.md §1，再按本页实际层数裁剪。
   本例第一层无 Tab，故不含 .page-tabs；若加了 Tab 层须补上。 */
.search-wrap {
	width: 100%;
	padding: 10px 15px;
	box-sizing: border-box;
}
.prefix-label {
	color: #909399;
}
.left-panel {
	display: flex;
	align-items: center;
}
.default-hide {
	display: none;
}
</style>
