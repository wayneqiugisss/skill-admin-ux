<!--
  列表型抽屉 Demo — list-drawer-demo.vue
  场景：点击父列表行 → 打开抽屉 → 展示子列表（sc-table）→ 行内 CRUD（打开子编辑抽屉）→ 保存后回刷
  规范依据：rules/drawer-layout-rule.md、rules/drawer-comm-rule.md
  用法：复制本文件，替换标题 / 列定义 / 数据源即可落地
-->
<template>
	<el-drawer
		v-model="visible"
		:title="`${sku.productSkuName || ''} · 定价配置`"
		size="75%"
		direction="rtl"
		destroy-on-close
		@closed="$emit('closed')"
	>
		<!-- 内容区统一用 el-container 包裹，显式 direction=vertical -->
		<el-container direction="vertical">
			<!-- 所有业务动作按钮都在 el-header；有操作栏 → 保留 el-header，el-main 不加 border-top -->
			<el-header class="drawer-header">
				<div class="left-panel">
					<el-button type="primary" icon="el-icon-plus" @click="addRule">新增规则</el-button>
					<el-button icon="el-icon-delete" :disabled="!selection.length" @click="batchRemove">批量删除</el-button>
				</div>
			</el-header>

			<!-- 表格不裸贴抽屉边缘：.drawer-table-main 提供两边 16px + 底部 16px -->
			<el-main class="drawer-table-main">
				<sc-table :data="rules" stripe border v-loading="loading" hide-pagination @selection-change="v => selection = v">
					<el-table-column type="selection" width="50" />
					<el-table-column prop="name" label="规则名称" min-width="160" />
					<el-table-column label="计价方式" width="120">
						<template #default="scope">{{ methodLabel(scope.row.method) }}</template>
					</el-table-column>
					<el-table-column prop="price" label="价格" width="120" align="right" />
					<!-- 行内按钮只出现在操作列，fixed 右侧 -->
					<el-table-column label="操作" width="160" align="center" fixed="right">
						<template #default="scope">
							<el-button text type="primary" size="small" @click="editRule(scope.row)">配置</el-button>
							<el-button text type="danger" size="small" @click="removeRule(scope.row)">删除</el-button>
						</template>
					</el-table-column>
					<template #empty>
						<el-empty description="暂无规则" :image-size="60" />
					</template>
				</sc-table>
			</el-main>
		</el-container>

		<!-- 子编辑抽屉：与 el-drawer 同级、append-to-body、比父抽屉降一档（75% → 50%） -->
		<rule-edit-drawer
			v-model:visible="editVisible"
			:rule="currentRule"
			@refresh="onRulePanelRefresh"
		/>
	</el-drawer>
</template>

<script>
	import RuleEditDrawer from './RuleEditDrawer';

	export default {
		name: 'SkuPricingDrawer',
		components: { RuleEditDrawer },
		props: {
			modelValue: { type: Boolean, default: false },
			sku: { type: Object, default: () => ({}) }
		},
		emits: ['update:modelValue', 'closed'],
		data() {
			return {
				rules: [],
				loading: false,
				selection: [],
				editVisible: false,
				currentRule: null
			};
		},
		computed: {
			visible: {
				get() { return this.modelValue; },
				set(v) { this.$emit('update:modelValue', v); }
			}
		},
		watch: {
			modelValue(val) { if (val) this.loadData(); }
		},
		methods: {
			methodLabel(m) { return { formula: '公式', fixed: '固定价' }[m] || m; },

			async loadData() {
				this.loading = true;
				try {
					// 真实接口：const res = await this.$API.xxx.list.get({ skuCode: this.sku.productSkuCode });
					this.rules = JSON.parse(JSON.stringify(this.sku.rules || []));
				} finally {
					this.loading = false;
				}
			},
			addRule() { this.currentRule = null; this.editVisible = true; },
			editRule(row) { this.currentRule = row; this.editVisible = true; },
			async removeRule(row) {
				try { await this.$confirm(`确认删除规则「${row.name}」？`, '提示', { type: 'warning' }); }
				catch { return; }
				// 局部删除，不触发整页重载
				const i = this.rules.findIndex(r => r.id === row.id);
				if (i >= 0) this.rules.splice(i, 1);
			},
			// 批量删除：同样走 $confirm 二次确认，禁止 el-popconfirm
			async batchRemove() {
				try { await this.$confirm(`确认删除选中的 ${this.selection.length} 条规则？`, '提示', { type: 'warning' }); }
				catch { return; }
				const ids = this.selection.map(r => r.id);
				this.rules = this.rules.filter(r => !ids.includes(r.id));
				this.selection = [];
			},

			// 保存后回刷：loadData() 生成全新数组，需按稳定标识重新定位并替换 currentSku 引用
			async onRulePanelRefresh() {
				await this.loadData();
				// 若父层还持有 currentSku 引用，此处按 productSkuCode 重新查找并更新，示例略
			}
		}
	};
</script>

<style scoped>
	/* 表格边距：两边 16px 与表单型 .drawer-form 对齐，底部 16px 防贴死抽屉底边。
	   不再用 class="nopadding"（会把内边距清零，表格贴住抽屉三边） */
	.drawer-table-main {
		padding: 12px 16px 16px;
		box-sizing: border-box;
	}

	/* 覆盖 EP 默认 padding: 0 20px，让按钮与表格左边缘对齐 */
	.drawer-header {
		height: auto;
		padding: 8px 16px;
	}

	.left-panel {
		display: flex;
		align-items: center;
	}
</style>
