<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <router-link to="/" class="text-blue-600 hover:text-blue-800">
            ← Voltar
          </router-link>
          <h1 class="text-xl font-bold text-gray-800">Painel Admin</h1>
        </div>
        <div class="text-sm text-gray-600">
          {{ currentUser?.name }}
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
          :class="activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Events Tab -->
      <div v-if="activeTab === 'events'" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold">Eventos</h2>
          <button @click="openEventModal" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Evento
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="event in events"
            :key="event.id"
            class="flex justify-between items-center p-4 border rounded-lg"
            :class="event.status === 'active' ? 'border-green-300 bg-green-50' : 'border-gray-200'"
          >
            <div>
              <h3 class="font-bold">{{ event.name }}</h3>
              <p class="text-sm text-gray-600">
                {{ formatDate(event.date) }} • {{ event.location }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                @click="toggleEventStatus(event)"
                class="px-3 py-1 rounded text-sm font-medium"
                :class="event.status === 'active' ? 'bg-gray-200 text-gray-700' : 'bg-green-600 text-white'"
              >
                {{ event.status === 'active' ? 'Encerrar' : 'Reativar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Tab -->
      <div v-if="activeTab === 'products'" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold">Produtos</h2>
          <button @click="openProductModal" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Produto
          </button>
        </div>

        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-gray-600 border-b">
              <th class="pb-2">Nome</th>
              <th class="pb-2">Preço</th>
              <th class="pb-2">Estoque</th>
              <th class="pb-2">Status</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-b">
              <td class="py-3 font-medium">{{ product.name }}</td>
              <td class="py-3">R$ {{ product.price.toFixed(2) }}</td>
              <td class="py-3">
                <span
                  v-if="product.stock !== null && product.stock <= 5"
                  class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs"
                >
                  Baixo: {{ product.stock }}
                </span>
                <span v-else class="text-gray-600">
                  {{ product.stock !== null ? product.stock : '∞' }}
                </span>
              </td>
              <td class="py-3">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ product.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3 text-right">
                <button @click="toggleProductActive(product)" class="text-blue-600 text-sm hover:underline">
                  {{ product.active ? 'Desativar' : 'Ativar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Operators Tab -->
      <div v-if="activeTab === 'operators'" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold">Operadores</h2>
          <button @click="openOperatorModal" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Operador
          </button>
        </div>

        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-gray-600 border-b">
              <th class="pb-2">Nome</th>
              <th class="pb-2">PIN</th>
              <th class="pb-2">Função</th>
              <th class="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in operators" :key="op.id" class="border-b">
              <td class="py-3 font-medium">{{ op.name }}</td>
              <td class="py-3 font-mono">{{ op.pin }}</td>
              <td class="py-3 capitalize">{{ op.role }}</td>
              <td class="py-3">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="op.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ op.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <h2 class="text-lg font-bold mb-4">Configuração de Impressão</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Largura do Papel</label>
            <select v-model="printSettings.paperWidth" class="w-full border rounded-lg px-3 py-2">
              <option :value="58">58mm</option>
              <option :value="80">80mm</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cabeçalho da Ficha</label>
            <input
              v-model="printSettings.header"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="Ex.: FESTA JUNINA 2026"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rodapé da Ficha</label>
            <input
              v-model="printSettings.footer"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="Ex.: Troque sua ficha no balcão"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tamanho da Fonte</label>
            <input
              v-model.number="printSettings.fontSize"
              type="number"
              min="8"
              max="24"
              class="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button @click="saveSettings" class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const currentUser = authStore.user

const activeTab = ref('events')
const tabs = [
  { id: 'events', label: '📅 Eventos' },
  { id: 'products', label: '🍺 Produtos' },
  { id: 'operators', label: '👤 Operadores' },
  { id: 'settings', label: '🖨️ Impressão' },
]

// Dados locais (em produção viriam do Supabase)
const events = ref([
  {
    id: 'evento-teste',
    name: 'Festa Junina 2026',
    date: '2026-06-12',
    location: 'Salão Comunitário',
    status: 'active',
  },
])

const products = ref([
  { id: 'prod-1', name: 'Cerveja', price: 8, color: '#f59e0b', active: true, stock: 200 },
  { id: 'prod-2', name: 'Refrigerante', price: 5, color: '#ef4444', active: true, stock: 150 },
  { id: 'prod-3', name: 'Espetinho', price: 6, color: '#8b5cf6', active: true, stock: 100 },
  { id: 'prod-4', name: 'Água', price: 3, color: '#3b82f6', active: true, stock: null },
  { id: 'prod-5', name: 'Whisky', price: 15, color: '#78350f', active: true, stock: 50 },
  { id: 'prod-6', name: 'Vinho', price: 12, color: '#7f1d1d', active: false, stock: 5 },
])

const operators = ref([
  { id: 'op-1', name: 'Wanderley', pin: '0000', role: 'admin', active: true },
  { id: 'op-2', name: 'Maria', pin: '1111', role: 'operator', active: true },
  { id: 'op-3', name: 'João', pin: '1234', role: 'supervisor', active: true },
])

const printSettings = ref({
  paperWidth: 58,
  header: 'EVENTO',
  footer: 'Troque sua ficha no balcão',
  fontSize: 12,
  showLogo: false,
})

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR')
}

function toggleEventStatus(event) {
  event.status = event.status === 'active' ? 'closed' : 'active'
}

function toggleProductActive(product) {
  product.active = !product.active
}

function openEventModal() {
  const name = prompt('Nome do evento:')
  if (!name) return
  const date = prompt('Data (AAAA-MM-DD):', '2026-12-31')
  if (!date) return
  const location = prompt('Local:') || 'Não informado'
  events.value.push({
    id: 'evt-' + Date.now(),
    name,
    date,
    location,
    status: 'active',
  })
}

function openProductModal() {
  const name = prompt('Nome do produto:')
  if (!name) return
  const price = parseFloat(prompt('Preço (R$):')) || 0
  const stock = prompt('Estoque (vazio = ilimitado):')
  products.value.push({
    id: 'prod-' + Date.now(),
    name,
    price,
    color: '#10b981',
    active: true,
    stock: stock ? parseInt(stock) : null,
  })
}

function openOperatorModal() {
  const name = prompt('Nome do operador:')
  if (!name) return
  const pin = prompt('PIN (4 dígitos):')
  if (!pin || !/^\d{4}$/.test(pin)) {
    alert('PIN deve ter exatamente 4 dígitos')
    return
  }
  const role = prompt('Função (admin/operator/supervisor):', 'operator')
  operators.value.push({
    id: 'op-' + Date.now(),
    name,
    pin,
    role: role || 'operator',
    active: true,
  })
}

function saveSettings() {
  localStorage.setItem('print-settings', JSON.stringify(printSettings.value))
  alert('Configurações salvas!')
}

onMounted(() => {
  const saved = localStorage.getItem('print-settings')
  if (saved) {
    printSettings.value = { ...printSettings.value, ...JSON.parse(saved) }
  }
})
</script>