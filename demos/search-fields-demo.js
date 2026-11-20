/**
 * 检索条件配置 Demo（税率管理）—— 与 demos/index.vue 配套，可整份复制到模块目录改名 searchFields.js
 *
 * 单一事实来源：全部检索条件在此声明，index.vue 用同一个 el-row + v-for 渲染（每行 3 格自动换行，
 * row-gap 保留行间距）；增删字段、隐藏清单裁剪（命中 hiddenKey）都只影响这份清单，
 * 布局随之整体重排，行内不会出现缺格；展开收起、重置初始值、搜索入参构造均由此派生。
 *
 * 字段描述约定：
 *   key         search 模型键（v-model 落点），camelCase
 *   label       prefix 文案
 *   type        控件类型：input / select / dict / cascader / daterange / number
 *   placeholder 占位文案（input / number 默认「请输入」+ 字段名；daterange 用组件内置起止占位；number 不支持 prefix，靠它承载字段名）
 *   hiddenKey   内置字段隐藏清单键（与表格列 showField 同口径），不配置则常显
 *   optionsKey  下拉数据源在页面 options 里的键（select / cascader）
 *   optionLabel / optionValue  选项对象的显示名 / 值键（select）
 *   dictCode    字典编码，取模块 dict.js 常量（dict，禁字面量）
 *   props       el-cascader 的 props（cascader）
 *   multiple    级联多选标记（驱动 collapse-tags）
 *   initial     重置初始值（createSearch 据此生成，数组会克隆）
 *   paramKey    搜索入参键，缺省同 key
 *   normalize   草稿值 → 搜索入参的折算函数（空值收敛 / 单值转 List / 区间拼串）
 */

// 字典编码取模块 dict.js 常量（此处为 demo 占位，落地时替换为真实常量引用）
const DISABLED_STATUS_DICT_CODE = 'disabled_status';

export const SEARCH_FIELDS = [
	{
		key: 'taxName',
		label: '税率名称',
		type: 'input',
		placeholder: '请输入税率名称',
		initial: '',
		normalize: value => value || null
	},
	{
		key: 'taxCode',
		label: '税率编码',
		type: 'input',
		placeholder: '请输入税率编码',
		initial: '',
		normalize: value => value || null
	},
	{
		key: 'taxStatus',
		label: '状态',
		type: 'dict',
		dictCode: DISABLED_STATUS_DICT_CODE,
		placeholder: '状态',
		initial: null,
		// 后端按 List 过滤：单值包数组，空值不下发
		paramKey: 'taxStatusList',
		normalize: value => (value === null || value === '' ? null : [value])
	},
	{
		key: 'createTimeRange',
		label: '创建时间',
		type: 'daterange',
		initial: null,
		// 区间拼成「开始,结束」，与其它列表页入参口径一致
		normalize: value => (value && value.length === 2 ? value.join(',') : null)
	},
	{
		key: 'taxRemark',
		label: '备注',
		type: 'input',
		placeholder: '请输入备注',
		initial: '',
		normalize: value => value || null
	}
	// 新增 / 删除字段只改这份清单：布局、折叠、重置、入参全自动跟随
];

// 搜索条件初始值：data 与重置共用同一份，随配置增删自动跟随，避免两处漂移
export const createSearch = () => {
	const search = {};
	SEARCH_FIELDS.forEach(field => {
		search[field.key] = Array.isArray(field.initial) ? [...field.initial] : field.initial;
	});
	return search;
};