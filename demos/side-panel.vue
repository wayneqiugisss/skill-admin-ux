<template>
	<!-- # 左右布局骨架：左=分类面板（过滤 + 拖拽排序 + 行 hover 操作 + footer 新增），右=列表面板 -->
	<!-- 用途：凡「一个分类维度下的实体列表」（标签组→标签、单位类型→单位、部门→人员）统一复用本形态，禁止各页自造样式 -->
	<el-container>
		<!-- ============ 左侧分类面板（强制统一形态） ============ -->
		<el-aside width="280px" class="side-aside">
			<el-container direction="vertical">
				<!-- 头部：过滤输入（必须）；需要全部展开/折叠时在此追加 el-button-group.side-actions -->
				<el-header class="side-header">
					<el-input v-model="filterText" placeholder="分类名称" clearable class="side-filter-input"></el-input>
				</el-header>

				<!-- 可选：面板内联新增行（由 footer 按钮展开）；新增字段多于 1 个时改用 save 抽屉，不写内联行 -->
				<div v-if="showAdd" class="side-add-row">
					<el-input v-model="newName" size="small" placeholder="分类名称" :maxlength="15" clearable></el-input>
					<div style="display: flex; margin-top: 8px;">
						<el-button size="small" type="primary" @click="addItem">确定</el-button>
						<el-button size="small" @click="showAdd = false">取消</el-button>
					</div>
				</div>

				<el-main class="nopadding">
					<div class="side-tree-wrap">
						<!-- menu：复用全局 fix.scss 的 .el-tree.menu 行高 36px，页面内禁止再写 height -->
						<!-- 单层分类：整行即拖动区（无需句柄 icon）；有行内编辑态时把 draggable 临时关掉 -->
						<el-tree
							ref="tree"
							class="menu side-tree"
							node-key="id"
							:data="list"
							:current-node-key="activeId"
							:highlight-current="true"
							:expand-on-click-node="false"
							:filter-node-method="filterNode"
							:draggable="editingId === null"
							:allow-drag="allowDrag"
							:allow-drop="allowDrop"
							@node-click="nodeClick"
							@node-drop="onDrop"
						>
							<template #default="{ data }">
								<span class="side-node">
									<!-- 行内重命名（单字段分类适用；多字段走 save 抽屉） -->
									<template v-if="editingId === data.id">
										<el-input v-model="editingName" size="small" :maxlength="15" style="width: 120px;" @click.stop></el-input>
										<el-button text type="primary" size="small" @click.stop="renameItem(data)">保存</el-button>
										<el-button text size="small" @click.stop="editingId = null">取消</el-button>
									</template>
									<template v-else>
										<!-- __name 必填；__meta 可选（数量/统计，无则整段不写）；__do 可选（行操作，hover 才显示） -->
										<span class="side-node__name" :title="data.name">{{ data.name }}</span>
										<span class="side-node__meta" :title="`${data.itemCount} 条`">{{ data.itemCount }}</span>
										<span v-if="data.id !== ''" class="side-node__do">
											<el-button icon="el-icon-edit" size="small" circle title="编辑" @click.stop="startEdit(data)"></el-button>
											<el-button icon="el-icon-delete" size="small" circle title="删除" @click.stop="deleteItem(data)"></el-button>
										</span>
									</template>
								</span>
							</template>
						</el-tree>
					</div>
				</el-main>

				<!-- 底部主操作：新增分类（面板唯一的常驻入口按钮） -->
				<el-footer style="height: 51px;">
					<el-button size="small" icon="el-icon-plus" :type="showAdd ? 'primary' : ''" @click="showAdd = !showAdd">新增分类</el-button>
				</el-footer>
			</el-container>
		</el-aside>

		<!-- ============ 右侧列表面板（四层结构：头部Tab + 检索条件 + 按钮 + scTable 的完整写法见 demos/index.vue） ============ -->
		<el-container direction="vertical">
			<el-main class="nopadding">
				<scTable ref="table" :apiObj="apiObj" stripe remoteSort remoteFilter row-key="id">
					<!-- 数据列 / 状态列 / 操作列：同 demos/index.vue -->
				</scTable>
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
	export default {
		name: "sidePanelDemo",
		data() {
			return {
				// 左侧面板：过滤关键字 / 内联新增 / 行内重命名
				filterText: "",
				showAdd: false,
				newName: "",
				editingId: null,
				editingName: "",
				// 分类数据：数组顺序即展示顺序（含首项「全部」虚拟节点，id 为 ''）
				list: [],
				activeId: "",
				// 右侧列表数据源
				apiObj: this.$API.demo.list
			};
		},
		watch: {
			filterText(val) {
				this.$refs.tree.filter(val);
			}
		},
		mounted() {
			this.loadList();
		},
		methods: {
			// 加载分类：首项固定为「全部」虚拟节点，不参与排序与增删
			loadList() {
				this.$API.demo.category.get().then(res => {
					this.list = [{ id: "", name: "全部", itemCount: res.data.length }, ...res.data];
				});
			},

			// 树过滤：命中名称显示，「全部」节点恒显
			filterNode(value, data) {
				if (!value) return true;
				if (data.id === "") return true;
				return (data.name || "").indexOf(value) !== -1;
			},

			// 「全部」为虚拟节点，不可拖动
			allowDrag(node) {
				return node.data.id !== "";
			},

			// 单层分类：禁止 inner 拖入形成层级，也不允许落在「全部」上
			allowDrop(dragNode, dropNode, type) {
				if (dropNode.data.id === "") return false;
				return type !== "inner";
			},

			// 落位后按新顺序重写 order（值大靠前），并刷新右侧列表
			onDrop() {
				const nodes = this.$refs.tree.store.root.childNodes;
				const items = nodes.map(node => node.data).filter(item => item.id !== "");
				items.forEach((item, index) => {
					item.order = (items.length - index) * 10;
				});
				this.$API.demo.categorySort.put(items);
				this.$refs.table.refresh();
			},

			// 节点点击 → 右侧列表按分类重载（「全部」传空参数）
			nodeClick(data) {
				this.activeId = data.id;
				this.$refs.table.reload(data.id === "" ? {} : { categoryId: data.id });
			},

			// 内联新增
			addItem() {
				const name = (this.newName || "").trim();
				if (!name) {
					this.$message.warning("请输入分类名称");
					return;
				}
				this.$API.demo.categoryAdd.post({ name }).then(() => {
					this.newName = "";
					this.showAdd = false;
					this.loadList();
					this.$message.success("新增成功");
				});
			},

			// 行内重命名
			startEdit(data) {
				this.editingId = data.id;
				this.editingName = data.name;
			},
			renameItem(data) {
				const name = (this.editingName || "").trim();
				if (!name) {
					this.$message.warning("请输入分类名称");
					return;
				}
				this.$API.demo.categoryMod.put({ id: data.id, name }).then(() => {
					data.name = name;
					this.editingId = null;
					this.$message.success("修改成功");
				});
			},

			// 删除：二次确认 + 局部移除，不整页重载
			async deleteItem(data) {
				try {
					await this.$confirm(`确定删除分类「${data.name}」吗？`, this.$t("common.tip"), {
						type: "warning",
						confirmButtonText: this.$t("common.delete"),
						cancelButtonText: this.$t("common.cancel")
					});
				} catch (e) {
					return;
				}
				const res = await this.$API.demo.categoryDelete.delete(data.id);
				if (res.code == 200) {
					const index = this.list.findIndex(item => item.id === data.id);
					if (index !== -1) {
						this.list.splice(index, 1);
					}
					// 正被选中的分类被删掉 → 回到「全部」视图
					if (this.activeId === data.id) {
						this.activeId = "";
						this.$refs.tree.setCurrentKey("");
						this.$refs.table.reload({});
					}
					this.$message.success(this.$t("common.deleteSuccess"));
				} else {
					this.$alert(res.message, this.$t("common.tip"), { type: "error" });
				}
			}
		}
	};
</script>

<style scoped>
/* ============ 左侧分类面板（统一样式块，跨页面逐字复制，只改注释里的业务名） ============ */
.side-aside {
	background: var(--el-bg-color);
	border-right: 1px solid var(--el-border-color-light);
}
.side-header {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0 10px;
	border-bottom: 1px solid var(--el-border-color-light);
}
.side-header .side-filter-input {
	flex: 1;
}
/* 可选：面板内的内联新增行（header 下方展开） */
.side-add-row {
	padding: 10px 15px;
	border-bottom: 1px solid var(--el-border-color-light);
}
.side-tree-wrap {
	overflow: auto;
	height: 100%;
	padding: 6px;
	box-sizing: border-box;
}
/* 行高 36px 由全局 fix.scss 的 .el-tree.menu 提供，本页只补圆角 / hover / 选中态 */
:deep(.side-tree .el-tree-node__content) {
	border-radius: 4px;
	padding-right: 4px;
}
:deep(.side-tree .el-tree-node__content:hover) {
	background: var(--el-fill-color-light);
}
:deep(.side-tree .el-tree-node.is-current > .el-tree-node__content) {
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
}
.side-node {
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	padding-right: 6px;
	font-size: 13px;
}
/* 名称优先占位，过长则省略号 */
.side-node__name {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
/* 尾部统计（数量 / “N 单位 / M 身份”）：靠右不压缩，超长自己截断 */
.side-node__meta {
	flex-shrink: 0;
	max-width: 40%;
	margin-left: 6px;
	font-size: 12px;
	color: var(--el-text-color-secondary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
/* 行操作按钮：整行 hover 才出，不占常驻宽度 */
.side-node__do {
	display: none;
	margin-left: 6px;
	flex-shrink: 0;
}
.side-node:hover .side-node__do {
	display: inline-flex;
}
</style>
