import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types'
import supabaseService from '@/services/supabase.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isInitialized = ref(false)

  async function initialize() {
    if (isInitialized.value) return
    
    try {
      isLoading.value = true
      const currentUser = await supabaseService.getCurrentUser()
      user.value = currentUser
    } catch (err) {
      error.value = err as Error
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function login(pin: string) {
    try {
      isLoading.value = true
      error.value = null
      const { user: loggedUser, error: err } = await supabaseService.signIn(pin)
      
      if (err) throw err
      if (loggedUser) {
        user.value = loggedUser
      } else {
        throw new Error('Credenciais inválidas')
      }
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      isLoading.value = true
      error.value = null
      await supabaseService.signOut()
      user.value = null
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const isAuthenticated = computed(() => user.value !== null)
  const isOperator = computed(() => user.value?.role === 'operator')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isSupervisor = computed(() => user.value?.role === 'supervisor')

  return {
    user,
    isLoading,
    error,
    isInitialized,
    initialize,
    login,
    logout,
    isAuthenticated,
    isOperator,
    isAdmin,
    isSupervisor,
  }
})