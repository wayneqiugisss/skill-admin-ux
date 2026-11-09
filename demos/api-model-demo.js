import http from "@/utils/request"
import API from "@/utils/apiPaths"

/**
 * 税率管理 API
 */
export default {
	taxRate: {
		list: {
			url: `${API.b2b.system}/taxRate`,
			name: "税率列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		add: {
			url: `${API.b2b.system}/taxRate`,
			name: "新增税率",
			post: async function(data){
				return await http.post(this.url, data);
			}
		},
		mod: {
			url: `${API.b2b.system}/taxRate`,
			name: "修改税率",
			put: async function(data){
				return await http.put(this.url, data);
			}
		},
		delete: {
			url: `${API.b2b.system}/taxRate`,
			name: "删除税率",
			delete: async function(id){
				return await http.delete(this.url + '/' + id);
			}
		}
	}
}
