// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
// 组件按需加载
import './ant-ui.js'

import router from './router'
import VueContextMenu from 'vue-contextmenu'

Vue.config.productionTip = false

Vue.use(VueContextMenu)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
