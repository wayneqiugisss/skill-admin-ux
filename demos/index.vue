<template>
	<el-container>
		<el-container direction="vertical">
			<!-- # 第一层：头部 Tab —— 可选。本例无「同一实体多视图」需求，整层省略 -->

			<!-- # 第二层：检索条件（配置驱动：全部条件由 searchFields.js 声明，同一个 el-row 内 v-for 渲染，
			     每行 3 格自动换行，row-gap 保留行间距；增删 / 隐藏字段整体重排，行内不留缺格） -->
			<div class="search-wrap search-wrap--dynamic">
				<el-row :gutter="20" class="search-fields">
					<el-col
						v-for="(field, index) in visibleSearchFields"
						:key="field.key"
						:span="8"
						:class="{ 'default-hide': !searchExpanded && index >= 3 }"
					>
						<el-input v-if="field.type === 'input'" v-model="search[field.key]" :placeholder="field.placeholder" clearable @keyup.enter="upsearch">
							<template #prefix><span class="prefix-label">{{ field.label }}</span></template>
						</el-input>
						<el-select
							v-else-if="field.type === 'select'"
							v-model="search[field.key]"
							:placeholder="field.placeholder"
							filterable
							clearable
							style="width: 100%;"
						>
							<template #prefix><span class="prefix-label">{{ field.label }}</span></template>
							<el-option
								v-for="item in options[field.optionsKey] || []"
								:key="item[field.optionValue]"
								:label="item[field.optionLabel]"
								:value="item[field.optionValue]"
							/>
						</el-select>
						<dict-select
							v-else-if="field.type === 'dict'"
							v-model="search[field.key]"
							:dict-code="field.dictCode"
							:placeholder="field.placeholder"
							clearable
							style="width: 100%;"
							need-prefix
							:prefix="field.label"
						></dict-select>
						<el-cascader
							v-else-if="field.type === 'cascader'"
							v-model="search[field.key]"
							:options="options[field.optionsKey] || []"
							:props="field.props"
							:placeholder="field.placeholder"
							:collapse-tags="field.multiple"
							:collapse-tags-tooltip="field.multiple"
							clearable
							filterable
							style="width: 100%;"
						>
							<template #prefix><span class="prefix-label">{{ field.label }}</span></template>
						</el-cascader>
						<sc-date-picker
							v-else-if="field.type === 'daterange'"
							v-model="search[field.key]"
							type="daterange"
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							value-format="YYYY-MM-DD"
							style="width: 100%;"
							clearable
							need-prefix
							:prefix="field.label"
						/>
						<el-input-number
							v-else-if="field.type === 'number'"
							v-model="search[field.key]"
							:placeholder="field.placeholder"
							style="width: 100%;"
							clearable
							controls-position="right"
						></el-input-number>
					</el-col>
				</el-row>

				<!-- # 末行：搜索 + 重置 +（展开/收起，仅可见条件 > 3 时渲染） -->
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
// 检索条件配置（单一事实来源）：落地时把 search-fields-demo.js 复制到模块目录改名 searchFields.js
import { SEARCH_FIELDS, createSearch } from "./search-fields-demo";

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
			// 下拉数据源：select / cascader 字段的 optionsKey 指向这里（本例无此类字段，留空骨架）
			options: {},
			// search 初始值由配置派生，禁止手写第二份字面量
			search: createSearch(),
			// 展开状态常驻声明：可见条件数动态变化，折叠骨架自动适配
			searchExpanded: false,
		};
	},
	computed: {
		// 可见检索条件：按 hiddenKey 过滤（与表格列 showField 同口径）；
		// 本 demo 无隐藏机制直接返回全量；有隐藏清单的页面改为 filter(field => !field.hiddenKey || this.showField(field.hiddenKey))
		visibleSearchFields() {
			return SEARCH_FIELDS;
		},
		// 可见条件 > 3 才需要折叠；动态裁剪到 ≤ 3 时展开入口自动消失，无需手改模板
		searchCollapsible() {
			return this.visibleSearchFields.length > 3;
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
		 * 重置搜索条件：初始值由配置派生（createSearch），再清空参数重载表格
		 */
		resetSearch() {
			this.search = createSearch();
			this.searchExpanded = false;
			this.$refs.table.upData({});
		},
		/**
		 * 搜索：遍历可见字段按 normalize 折算入参（空值收敛 / 单值转 List / 区间拼串都在配置里），
		 * 被隐藏的字段不下发；禁止 {...this.search} 直传
		 */
		upsearch() {
			const params = {};
			this.visibleSearchFields.forEach(field => {
				params[field.paramKey || field.key] = field.normalize(this.search[field.key]);
			});
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
   本例第一层无 Tab，故不含 .page-tabs；若加了 Tab 层须补上。
   配置驱动检索区下 .search-wrap--dynamic / .search-fields / .default-hide 常驻不裁剪。 */
.search-wrap {
	width: 100%;
	padding: 10px 15px;
	box-sizing: border-box;
}
/* 配置驱动检索区模式标识——左缘 3px 主色圆角竖条（落在左 padding 留白内，不占控件位），
   明显但隐蔽，用于与旧版手写固定行检索区区分；容器挂 search-wrap--dynamic 修饰类 */
.search-wrap--dynamic {
	position: relative;
}
.search-wrap--dynamic::before {
	content: '';
	position: absolute;
	left: 5px;
	top: 10px;
	bottom: 10px;
	width: 3px;
	border-radius: 2px;
	background: var(--el-color-primary);
	opacity: 0.6;
}
/* 全部条件同一 el-row 自动换行：row-gap 保留行间距（行与行不能贴死），
   条件区与按钮行之间留 10px */
.search-fields {
	row-gap: 10px;
	margin-bottom: 10px;
}
.prefix-label {
	color: #909399;
}
.left-panel {
	display: flex;
	align-items: center;
}
/* 检索条件折叠：收起时第 4 个起隐藏 */
.default-hide {
	display: none;
}
</style>
