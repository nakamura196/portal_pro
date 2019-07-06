import Vue from 'vue'
import Router from 'vue-router'
import Index from './views/Index.vue'
import Poster from './views/Poster.vue'

Vue.use(Router)

export default new Router({
  //mode: 'history',
  //base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'index',
      component: Index
    },
    {
      path: '/poster',
      name: 'poster',
      component: Poster
    }
  ]
})
