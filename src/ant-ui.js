import Vue from 'vue'
import Antd from 'ant-design-vue'
import { message, Modal } from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

Vue.use(Antd)

// 挂载 message 和 modal
Vue.prototype.$message = message
Vue.prototype.$confirm = Modal.confirm
