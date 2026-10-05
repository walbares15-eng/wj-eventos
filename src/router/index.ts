import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const routes = [
  {
    path: '/',
    name: 'pdv',
    component: () => import('@/components/PDV.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/components/Login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/components/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/components/SalesReport.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Middleware de autenticação
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Inicializar store de autenticação se necessário
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  // Permitir acesso apenas a usuários autenticados
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Permitir acesso apenas a administradores
  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'pdv' })
    return
  }

  // Redirecionar usuários autenticados da tela de login
  if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'pdv' })
    return
  }

  next()
})

export default router