import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import StartScreen from '@/views/StartScreen.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
      meta: {
        title: 'Вход в приложение',
        hideHeader: true
      }
    },
    {
      path: '/start',
      name: 'start',
      component: StartScreen,
      meta: {
        title: 'Playground',
        hideHeader: false
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileScreen.vue'),
      meta: {
        title: 'Профиль',
        hideHeader: false
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      redirect: '/tasks',
      meta: {
        title: 'Задачи',
        hideHeader: false
      }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/Tasks.vue'),
      meta: {
        title: 'Мои задачи',
        hideHeader: false
      }
    },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('@/views/TaskDetail.vue'),
      meta: {
        title: 'Детали задачи',
        hideHeader: false
      }
    },
    {
      path: '/tasks/outgoing/:id',
      name: 'outgoing-task-detail',
      component: () => import('@/views/OutgoingTaskDetail.vue'),
      meta: {
        title: 'Исходящая задача',
        hideHeader: false
      }
    },
    {
      path: '/tasks/create',
      name: 'create-task',
      component: () => import('@/views/CreateTask.vue'),
      meta: {
        title: 'Создание задачи',
        hideHeader: false
      }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/Calendar.vue'),
      meta: {
        title: 'Календарь',
        hideHeader: false
      }
    },
    {
      path: '/employees',
      name: 'employees',
      component: () => import('@/views/Employees.vue'),
      meta: {
        title: 'Сотрудники',
        hideHeader: false
      }
    },
    {
      path: '/employees/add',
      name: 'add-employee',
      component: () => import('@/views/AddEmployee.vue'),
      meta: {
        title: 'Новый сотрудник',
        hideHeader: false
      }
    },
    {
      path: '/employees/:id',
      name: 'employee-profile',
      component: () => import('@/views/EmployeeProfile.vue'),
      meta: {
        title: 'Профиль сотрудника',
        hideHeader: false
      }
    },
    {
      path: '/user-profile',
      name: 'user-profile',
      component: () => import('@/views/UserProfile.vue'),
      meta: {
        title: 'Мой профиль',
        hideHeader: false
      }
    }
  ]
})

// Navigation guard to set document title
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router 