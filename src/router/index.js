import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/layout/AdminLayout.vue'

Vue.use(Router)

const router = new Router({
  mode: 'hash',
  base: '/',
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/workbench',
      children: [
        {
          path: 'workbench',
          name: 'Workbench',
          component: () => import('@/views/Workbench.vue'),
          meta: { title: '工作台' }
        },
        {
          path: 'phone-link',
          name: 'PhoneLinkBuilder',
          component: () => import('@/views/PhoneLinkBuilder.vue'),
          meta: { title: '手机号链接生成' }
        }
      ]
    },
    {
      path: '/phone-verify/:token',
      name: 'PhoneVerifyPage',
      component: () => import('@/views/PhoneVerifyPage.vue'),
      meta: { title: '手机号验证页' }
    }
  ]
})

export default router
