<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-5xl">🍺</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-800">Venda de Fichas</h1>
      <p class="text-gray-600 mt-2">Sistema de caixa para eventos</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
      <h2 class="text-lg font-bold mb-4 text-center">Login do Caixa</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="pin" class="block text-sm font-medium text-gray-700 mb-1">
            PIN do Caixa
          </label>
          <input
            id="pin"
            v-model="loginPin"
            type="password"
            maxlength="4"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••"
            @input="validatePin"
            @keyup.enter="handleLogin"
            autofocus
          />
          <p v-if="loginError" class="text-red-600 text-sm mt-2 text-center">
            {{ loginError }}
          </p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || loginPin.length < 4"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isLoading ? 'Entrando...' : 'Entrar' }}
          </button>
        </div>
      </form>

      <!-- Demo Info -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600 text-center">
          <strong>Demonstração:</strong> Use PIN <code class="bg-gray-200 px-2 py-1 rounded">0000</code>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

// State
const loginPin = ref('')
const loginError = ref(null)
const isLoading = ref(false)

// Methods
function validatePin() {
  // Apenas números, máximo 4 dígitos
  loginPin.value = loginPin.value.replace(/\D/g, '').slice(0, 4)
}

async function handleLogin() {
  if (loginPin.value.length < 4) return
  
  isLoading.value = true
  loginError.value = null
  
  try {
    await authStore.login(loginPin.value)
    router.push('/')
  } catch (err) {
    loginError.value = 'PIN incorreto. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>