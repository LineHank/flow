import Vue from 'vue'
import Router from 'vue-router'
import FlowDesign from '../views/flow-design'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/flow-design'
    },
    {
      path: '/flow-design',
      name: 'FlowDesign',
      component: FlowDesign
    }
  ]
})
