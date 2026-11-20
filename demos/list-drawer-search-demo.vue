<!--
  查询条件型列表抽屉 Demo — list-drawer-search-demo.vue
  场景：父列表行内「明细/流水」按钮 → open(row) 锁定主体 → 抽屉头部多行检索条件 + 独立操作行 → sc-table 明细（带分页）
  规范依据：rules/drawer-layout-rule.md §1.3 / §3.2、rules/style-css-rule.md §4
  用法：复制本文件，替换标题 / 检索条件 / 列定义 / 数据源即可落地

  与 list-drawer-demo.vue（行 CRUD 型）的区别：
  - 头部不是「业务按钮行」，而是「多行检索条件 + 搜索/重置/展开 操作行」；
  - 因此 el-header 必须 display:block（全局 fix.scss 把 .el-header 设成 flex 横排，见 §3.2）；
  - 明细通常带分页，不写 hide-pagination；
  - 主体（客户/订单等）由 open(row) 锁定，随每次请求合并进 apiObj，检索区不重复选择。
-->
<template>
	<el-drawer
		v-model="visible"
		:title="titleText"
		size="75%"
		direction="rtl"
		append-to-body
		:close-on-click-modal="false"
		destroy-on-close
		@closed="handleClosed"
	>
		<el-container direction="vertical" class="detail-flow">
			<!-- # 检索头部：多行条件（一行三个）+ 独立操作行。必须 display:block，见 style-css-rule.md §4 -->
			<el-header height="auto" class="drawer-header">
				<!-- 第1行：三个条件，等宽三列 -->
				<el-row :gutter="16">
					<el-col :span="8">
						<el-select v-model="search.flowType" placeholder="全部流水类型" clearable style="width: 100%;">
							<template #prefix><span class="prefix-label">流水类型</span></template>
							<el-option v-for="item in flowTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-col>
					<el-col :span="8">
						<el-select v-model="search.bizType" placeholder="全部业务类型" clearable style="width: 100%;">
							<template #prefix><span class="prefix-label">业务类型</span></template>
							<el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
						</el-select>
					</el-col>
					<el-col :span="8">
						<el-input v-model="search.bizId" placeholder="请输入业务单号" clearable>
							<template #prefix><span class="prefix-label">业务单号</span></template>
						</el-input>
					</el-col>
				</el-row>

				<!-- 第2行：低频条件，默认展开多行展示，可收起只留第一行 -->
				<el-row :gutter="16" class="detail-flow__row" v-show="searchExpanded">
					<el-col :span="8">
						<sc-date-picker
							v-model="search.timeRange"
							type="daterange"
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							value-format="YYYY-MM-DD"
							style="width: 100%;"
							clearable
							need-prefix
							prefix="发生时间"
						/>
					</el-col>
				</el-row>

				<!-- 操作行：搜索 / 重置 / 展开，独立成行、左对齐 -->
				<div class="detail-flow__actions">
					<el-button type="primary" icon="el-icon-search" @click="searchList">搜索</el-button>
					<el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
					<el-button
						text
						:icon="searchExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
						@click="searchExpanded = !searchExpanded"
					>
						{{ searchExpanded ? '收起' : '展开' }}
					</el-button>
				</div>
			</el-header>

			<!-- # 明细表：带分页，不写 hide-pagination -->
			<el-main class="drawer-table-main detail-flow__main">
				<scTable ref="table" :apiObj="apiObj" stripe border row-key="id" show-overflow-tooltip>
					<el-table-column label="流水类型" prop="flowType" width="100" align="center">
						<template #default="scope">
							<el-tag :type="flowTagType(scope.row.flowType)" size="small">{{ flowTypeText(scope.row.flowType) }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column label="变动积分" prop="signedPoints" width="110" align="right">
						<template #default="scope">
							<span :style="{ color: signedColor(scope.row), fontWeight: 600 }">{{ fmtSigned(scope.row) }}</span>
						</template>
					</el-table-column>
					<el-table-column label="变动后余额" prop="balanceAfter" width="110" align="right">
						<template #default="scope">{{ fmtInt(scope.row.balanceAfter) }}</template>
					</el-table-column>
					<el-table-column label="业务单号" prop="bizId" width="160" show-overflow-tooltip>
						<template #default="scope">{{ scope.row.bizId || '--' }}</template>
					</el-table-column>
					<el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip>
						<template #default="scope">{{ scope.row.remark || '--' }}</template>
					</el-table-column>
					<el-table-column label="发生时间" prop="createTime" width="170"></el-table-column>
					<template #empty>
						<el-empty description="暂无明细" :image-size="60" />
					</template>
				</scTable>
			</el-main>
		</el-container>
		<!-- #footer 可选：纯明细（无提交动作）省略，靠右上 X / ESC 关闭；仅有提交类按钮时才加 #footer -->
	</el-drawer>
</template>

<script>
import ScDatePicker from '@/components/ScDatePicker/index.vue';

// 搜索条件初始值：data 与重置共用同一份，避免两处漂移
const createSearch = () => ({ flowType: '', bizType: '', bizId: '', timeRange: null });

export default {
	name: 'DetailFlowDrawer',
	components: { ScDatePicker },
	data() {
		return {
			visible: false,
			customerId: null,
			customerName: '',
			search: createSearch(),
			// 条件区分两行（3 + 1），默认展开多行展示，收起后只留第一行
			searchExpanded: true,
			// 主体由 open(row) 锁定，随每次请求合并，检索区不重复选择
			apiObj: {
				get: params => {
					const query = { ...params };
					if (this.customerId) query.customerId = this.customerId;
					return this.$API.system.points.flowList.get(query);
				}
			},
			flowTypeOptions: [
				{ value: 'INCOME', label: '收入' },
				{ value: 'EXPENSE', label: '支出' },
				{ value: 'EXPIRE', label: '过期' },
				{ value: 'FREEZE', label: '冻结' },
				{ value: 'UNFREEZE', label: '解冻' }
			],
			bizTypeOptions: [
				{ value: 'REGISTER_GIFT', label: '注册赠送' },
				{ value: 'ORDER_REBATE', label: '订单返利' },
				{ value: 'ACTIVITY_REWARD', label: '活动奖励' },
				{ value: 'EXCHANGE', label: '物料兑换' },
				{ value: 'PAYMENT_DEDUCT', label: '货款抵扣' }
			]
		};
	},
	computed: {
		titleText() {
			return this.customerName ? `明细 · ${this.customerName}` : '明细';
		}
	},
	methods: {
		/** 父列表行内按钮调用：先锁定主体再打开，destroy-on-close 保证每次以新条件重建表格 */
		open(row) {
			this.customerId = row.customerId;
			this.customerName = row.customerName || '';
			this.search = createSearch();
			this.searchExpanded = true;
			this.visible = true;
		},
		buildParams() {
			const params = {};
			if (this.search.flowType) params.flowType = this.search.flowType;
			if (this.search.bizType) params.bizType = this.search.bizType;
			if (this.search.bizId) params.bizId = this.search.bizId;
			const range = this.search.timeRange;
			if (Array.isArray(range) && range.length === 2 && range.every(Boolean)) {
				params.beginTime = range[0];
				params.endTime = range[1];
			}
			return params;
		},
		searchList() {
			this.$refs.table && this.$refs.table.reload(this.buildParams());
		},
		resetSearch() {
			this.search = createSearch();
			this.$refs.table && this.$refs.table.reload({});
		},
		handleClosed() {
			this.customerId = null;
			this.customerName = '';
			this.search = createSearch();
			this.searchExpanded = true;
		},

		// ========== 展示工具 ==========
		flowTypeText(t) {
			return { INCOME: '收入', EXPENSE: '支出', EXPIRE: '过期', FREEZE: '冻结', UNFREEZE: '解冻' }[t] || t || '--';
		},
		flowTagType(t) {
			return { INCOME: 'success', EXPENSE: 'danger', EXPIRE: 'info', FREEZE: 'warning', UNFREEZE: 'primary' }[t] || 'info';
		},
		signedValue(row) {
			if (row.signedPoints !== null && row.signedPoints !== undefined) return Number(row.signedPoints);
			const p = Number(row.points || 0);
			return row.flowType === 'INCOME' || row.flowType === 'UNFREEZE' ? p : -p;
		},
		fmtSigned(row) {
			const v = this.signedValue(row);
			return (v > 0 ? '+' : '') + v.toLocaleString('zh-CN');
		},
		signedColor(row) {
			const v = this.signedValue(row);
			return v > 0 ? '#67C23A' : v < 0 ? '#F56C6C' : '#909399';
		},
		fmtInt(v) {
			return v === null || v === undefined ? '0' : Number(v).toLocaleString('zh-CN');
		}
	}
};
</script>

<style scoped>
.detail-flow {
	height: 100%;
}
/* 多行检索头部必须 display:block —— 全局 fix.scss 把 .el-header 设成 flex 横排（space-between），
   不改回块级时「条件行」与「操作行」会被当成 flex 项挤在同一行、日期控件被压扁。
   scoped 属性选择器优先级高于全局 .el-header。单行按钮行才可沿用全局 flex。 */
.drawer-header {
	display: block;
	height: auto;
	padding: 12px 16px;
}
.detail-flow__row {
	margin-top: 12px;
}
/* 操作行：搜索/重置/展开单独一行，左对齐 */
.detail-flow__actions {
	display: flex;
	align-items: center;
	margin-top: 12px;
}
/* 表格不裸贴抽屉三边：两边 16px / 底 16px / 顶 12px */
.drawer-table-main {
	padding: 12px 16px 16px;
	box-sizing: border-box;
}
.detail-flow__main {
	flex: 1;
	min-height: 0;
	overflow: auto;
}
.prefix-label {
	color: #909399;
}
</style>
