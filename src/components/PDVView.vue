<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-gray-100">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-800 text-xl font-semibold">Carregando...</p>
      </div>
    </div>

    <!-- Login Screen -->
    <div v-else-if="!isAuthenticated" class="min-h-screen flex flex-col items-center justify-center p-6">
      <div class="text-6xl mb-6">🍺</div>
      <h1 class="text-3xl font-bold mb-2 text-center">WJ Eventos</h1>
      <p class="text-center text-gray-600 mb-8">Sistema de caixa para eventos</p>
      
      <div class="w-full max-w-md">
        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
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
            @keyup.enter="handleLogin"
            @input="validatePin"
            autofocus
          />
          <p v-if="loginError" class="text-red-600 text-sm mt-2 text-center">
            {{ loginError }}
          </p>
        </div>
        
        <button
          @click="handleLogin"
          :disabled="isLoading || loginPin.length < 4"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {{ isLoading ? 'Entrando...' : 'Entrar como Caixa' }}
        </button>
      </div>
    </div>

    <!-- Main PDV Screen -->
    <div v-else class="container mx-auto px-4 py-6">
      <!-- Header -->
      <header class="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Caixa de Vendas</h1>
          <p class="text-sm text-gray-600">Operador: {{ currentUser?.name }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {{ isOnline ? 'Online' : 'Offline' }}
          </span>
          <button
            @click="logout"
            class="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      <!-- Product Grid -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-lg font-bold mb-4">Produtos</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button
            v-for="product in products"
            :key="product.id"
            @click="addToCart(product)"
            :disabled="isProcessing || !product.active"
            class="p-4 rounded-lg border-2 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :style="{ borderColor: product.color || '#e5e7eb' }"
          >
            <div class="text-center">
              <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
              />
              <div v-else class="text-3xl mb-2">{{ getProductIcon(product.name) }}</div>
              <h3 class="font-bold text-sm mb-1">{{ product.name }}</h3>
              <p class="text-lg font-bold" :style="{ color: product.color || '#1f2937' }">
                R$ {{ product.price.toFixed(2) }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Cart -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-lg font-bold mb-4">Carrinho</h2>
        
        <div v-if="isCartEmpty" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🛒</div>
          <p>Nenhum item no carrinho</p>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="item in cart" 
            :key="item.product.id"
            class="flex justify-between items-center py-3 border-b border-gray-100"
          >
            <div class="flex-1">
              <h4 class="font-bold">{{ item.product.name }}</h4>
              <div class="flex items-center gap-2 mt-1">
                <button 
                  @click="updateQuantity(item.product.id, item.quantity - 1)" 
                  class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                >
                  −
                </button>
                <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                <button 
                  @click="updateQuantity(item.product.id, item.quantity + 1)" 
                  class="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold">R$ {{ (item.product.price * item.quantity).toFixed(2) }}</p>
              <button 
                @click="removeFromCart(item.product.id)"
                class="text-red-600 text-sm hover:text-red-800"
              >
                Remover
              </button>
            </div>
          </div>

          <div class="pt-4 border-t-2 border-gray-200">
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg text-gray-600">Total</span>
              <span class="text-2xl font-bold text-blue-600">R$ {{ total.toFixed(2) }}</span>
            </div>

            <!-- Payment Methods -->
            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-2">Forma de Pagamento</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="method in paymentMethods"
                  :key="method.value"
                  @click="setPaymentMethod(method.value)"
                  class="py-2 px-4 rounded-lg font-medium transition-colors"
                  :class="paymentMethod === method.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                >
                  {{ method.label }}
                </button>
              </div>
            </div>

            <button
              @click="processSale"
              :disabled="!canCheckout || isProcessing"
              class="w-full py-3 rounded-lg font-medium text-lg transition-colors disabled:opacity-50"
              :class="canCheckout && !isProcessing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-400 text-gray-700'
              "
            >
              {{ isProcessing ? 'Processando...' : 'FINALIZAR E IMPRIMIR' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Admin & Reports Links -->
      <div v-if="isAdmin || isSupervisor" class="flex gap-4 mb-6">
        <router-link
          to="/admin"
          class="flex-1 bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow"
        >
          <div class="text-3xl mb-2">📊</div>
          <span class="font-medium text-gray-800">Admin</span>
        </router-link>
        <router-link
          to="/reports"
          class="flex-1 bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow"
        >
          <div class="text-3xl mb-2">📈</div>
          <span class="font-medium text-gray-800">Relatórios</span>
        </router-link>
      </div>

      <!-- Status Bar -->
      <div v-if="isSyncing" class="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        Sincronizando...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePDVStore } from '@/stores/pdv.store'
import { loadProducts } from '@/utils/products'

// Stores
const authStore = useAuthStore()
const pdvStore = usePDVStore()

// Local state
const loginPin = ref('')
const loginError = ref(null)
const isLoading = ref(false)
const isLoadingLogin = ref(false)

// Produtos (do Admin, salvos no navegador)
const products = ref([])

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const isSupervisor = computed(() => authStore.isSupervisor)
const currentUser = computed(() => authStore.user)
const isOnline = computed(() => navigator.onLine)
const isSyncing = computed(() => pdvStore.isSyncing)
const cart = computed(() => pdvStore.cart)
const total = computed(() => pdvStore.total)
const isCartEmpty = computed(() => pdvStore.isCartEmpty)
const paymentMethod = computed(() => pdvStore.paymentMethod)
const canCheckout = computed(() => pdvStore.canCheckout)
const isProcessing = computed(() => pdvStore.isProcessing)

const paymentMethods = [
  { value: 'cash', label: '💵 Dinheiro' },
  { value: 'pix', label: '📱 PIX' },
  { value: 'debit', label: '💳 Débito' },
  { value: 'credit', label: '💳 Crédito' },
  { value: 'courtesy', label: '🎁 Cortesia' },
]

// Methods
function validatePin() {
  loginPin.value = loginPin.value.replace(/\D/g, '').slice(0, 4)
}

async function handleLogin() {
  if (loginPin.value.length < 4) return
  
  isLoadingLogin.value = true
  loginError.value = null
  
  try {
    await authStore.login(loginPin.value)
    loginPin.value = ''
  } catch (err) {
    loginError.value = 'PIN incorreto. Tente novamente.'
  } finally {
    isLoadingLogin.value = false
  }
}

function logout() {
  authStore.logout()
}

function addToCart(product) {
  pdvStore.addToCart(product)
}

function removeFromCart(productId) {
  pdvStore.removeFromCart(productId)
}

function updateQuantity(productId, quantity) {
  pdvStore.updateQuantity(productId, quantity)
}

function setPaymentMethod(method) {
  pdvStore.setPaymentMethod(method)
}

async function processSale() {
  if (!canCheckout.value) return
  
  const result = await pdvStore.processSale(
    authStore.user.id,
    'evento-teste',
    products.value
  )
  
  if (result.success) {
    alert('Venda finalizada com sucesso! Ficha impressa.')
  } else {
    alert('Erro ao processar venda: ' + result.error)
  }
}

function getProductIcon(productName) {
  const icons = {
    'Cerveja': '🍺',
    'Refrigerante': '🥤',
    'Espetinho': '🍢',
    'Água': '💧',
    'Whisky': '🥃',
    'Vinho': '🍷',
  }
  return icons[productName] || '🍺'
}

// Lifecycle
onMounted(async () => {
  await authStore.initialize()
  products.value = loadProducts()
})
</script>