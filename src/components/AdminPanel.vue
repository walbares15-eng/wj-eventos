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
              <th class="pb-2">Foto</th>
              <th class="pb-2">Nome</th>
              <th class="pb-2">Preço</th>
              <th class="pb-2">Estoque</th>
              <th class="pb-2">Status</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-b">
              <td class="py-3">
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.name"
                  class="w-12 h-12 rounded-lg object-cover"
                />
                <span v-else class="text-gray-300 text-2xl">🖼️</span>
              </td>
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
              <td class="py-3 text-right whitespace-nowrap">
                <button @click="editProduct(product)" class="text-blue-600 text-sm hover:underline mr-3">
                  Editar
                </button>
                <button @click="toggleProductActive(product)" class="text-blue-600 text-sm hover:underline mr-3">
                  {{ product.active ? 'Desativar' : 'Ativar' }}
                </button>
                <button @click="deleteProduct(product)" class="text-red-600 text-sm hover:underline">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de produto (novo + edição, com foto) -->
      <div
        v-if="showProductModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeProductModal"
      >
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-bold mb-4">
            {{ editingProductId ? 'Editar produto' : 'Novo produto' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Foto do produto</label>
              <div class="flex items-center gap-3">
                <img
                  v-if="productForm.image"
                  :src="productForm.image"
                  alt="Prévia"
                  class="w-20 h-20 rounded-lg object-cover border"
                />
                <div
                  v-else
                  class="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-3xl"
                >
                  🖼️
                </div>
                <div class="flex flex-col gap-2">
                  <button
                    type="button"
                    @click="photoInput && photoInput.click()"
                    class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    {{ productForm.image ? 'Trocar foto' : 'Escolher foto' }}
                  </button>
                  <button
                    v-if="productForm.image"
                    type="button"
                    @click="removePhoto"
                    class="text-red-600 text-sm hover:underline"
                  >
                    Remover foto
                  </button>
                </div>
              </div>
              <input
                ref="photoInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onPhotoSelected"
              />
              <p class="text-xs text-gray-500 mt-1">JPG ou PNG da galeria/câmera. Opcional.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                v-model="productForm.name"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="Ex.: Cerveja"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  v-model="productForm.price"
                  type="text"
                  inputmode="decimal"
                  class="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex.: 8.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                <input
                  v-model="productForm.stockText"
                  type="number"
                  min="0"
                  class="w-full border rounded-lg px-3 py-2"
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 items-end">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cor do botão</label>
                <input
                  v-model="productForm.color"
                  type="color"
                  class="w-full h-10 border rounded-lg px-1 py-1"
                />
              </div>
              <label class="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input v-model="productForm.active" type="checkbox" class="w-4 h-4" />
                Produto ativo
              </label>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="closeProductModal"
              class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              @click="saveProduct"
              class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
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
              <th class="pb-2"></th>
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
              <td class="py-3 text-right whitespace-nowrap">
                <button @click="editOperator(op)" class="text-blue-600 text-sm hover:underline mr-3">
                  Editar
                </button>
                <button @click="toggleOperatorActive(op)" class="text-blue-600 text-sm hover:underline mr-3">
                  {{ op.active ? 'Desativar' : 'Ativar' }}
                </button>
                <button @click="deleteOperator(op)" class="text-red-600 text-sm hover:underline">
                  Excluir
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de operador (nome + PIN) -->
      <div
        v-if="showOperatorModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        @click.self="closeOperatorModal"
      >
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-bold mb-4">
            {{ editingOperatorId ? 'Editar operador' : 'Novo operador' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                v-model="operatorForm.name"
                class="w-full border rounded-lg px-3 py-2"
                placeholder="Ex.: Caixa 5"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">PIN (4 números)</label>
                <input
                  v-model="operatorForm.pin"
                  type="password"
                  inputmode="numeric"
                  maxlength="4"
                  class="w-full border rounded-lg px-3 py-2 text-center text-xl tracking-widest"
                  placeholder="••••"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select v-model="operatorForm.role" class="w-full border rounded-lg px-3 py-2">
                  <option value="operator">Caixa</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="operatorForm.active" type="checkbox" class="w-4 h-4" />
              Operador ativo
            </label>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="closeOperatorModal"
              class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              @click="saveOperator"
              class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Cabeçalho da Ficha (nome do programa)</label>
            <input
              v-model="printSettings.header"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="Ex.: WJ EVENTOS"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome do evento (sai na ficha)</label>
            <input
              v-model="printSettings.eventName"
              class="w-full border rounded-lg px-3 py-2"
              placeholder="Ex.: Festa Junina 2026"
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
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="printSettings.autoPrint" type="checkbox" class="w-4 h-4" />
            Imprimir automaticamente ao finalizar a venda
          </label>
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
import { loadProducts, saveProducts, processImageFile } from '@/utils/products'
import {
  loadProductsAsync,
  createProductAsync,
  updateProductAsync,
  deleteProductAsync,
} from '@/utils/products'
import {
  loadOperatorsAsync,
  createOperatorAsync,
  updateOperatorAsync,
  deleteOperatorAsync,
} from '@/utils/operators'

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

const products = ref(loadProducts())

const operators = ref([])

const printSettings = ref({
  paperWidth: 58,
  header: 'WJ EVENTOS',
  eventName: '',
  footer: 'Troque sua ficha no balcão',
  fontSize: 12,
  showLogo: false,
  autoPrint: true,
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
  updateProductAsync({ ...product }).then((saved) => {
    Object.assign(product, saved)
  })
}

// ---- Formulário de produto (novo + edição), com foto ----
const showProductModal = ref(false)
const editingProductId = ref(null)
const productForm = ref({
  name: '',
  price: '',
  color: '#10b981',
  stockText: '',
  active: true,
  image: null,
})
const photoInput = ref(null)

function openProductModal() {
  editingProductId.value = null
  productForm.value = { name: '', price: '', color: '#10b981', stockText: '', active: true, image: null }
  showProductModal.value = true
}

function editProduct(product) {
  editingProductId.value = product.id
  productForm.value = {
    name: product.name,
    price: String(product.price),
    color: product.color || '#10b981',
    stockText: product.stock !== null && product.stock !== undefined ? String(product.stock) : '',
    active: product.active,
    image: product.image || null,
  }
  showProductModal.value = true
}

function closeProductModal() {
  showProductModal.value = false
}

async function onPhotoSelected(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('Escolha um arquivo de imagem (JPG ou PNG).')
    return
  }
  try {
    productForm.value.image = await processImageFile(file)
  } catch {
    alert('Não foi possível ler essa imagem.')
  }
  event.target.value = ''
}

function removePhoto() {
  productForm.value.image = null
}

async function saveProduct() {
  const name = productForm.value.name.trim()
  const price = parseFloat(String(productForm.value.price).replace(',', '.'))
  if (!name) {
    alert('Informe o nome do produto.')
    return
  }
  if (isNaN(price) || price < 0) {
    alert('Informe um preço válido.')
    return
  }
  const stock = productForm.value.stockText.trim() === ''
    ? null
    : parseInt(productForm.value.stockText, 10)

  const payload = {
    name,
    price,
    color: productForm.value.color,
    stock: isNaN(stock) ? null : stock,
    active: productForm.value.active,
    image: productForm.value.image,
  }

  if (editingProductId.value) {
    const saved = await updateProductAsync({ id: editingProductId.value, ...payload })
    const idx = products.value.findIndex((x) => x.id === editingProductId.value)
    if (idx !== -1) products.value[idx] = saved
  } else {
    const created = await createProductAsync(payload)
    products.value.push(created)
  }
  showProductModal.value = false
}

async function deleteProduct(product) {
  if (!confirm(`Excluir "${product.name}"?`)) return
  await deleteProductAsync(product.id)
  products.value = products.value.filter((x) => x.id !== product.id)
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

// ---- Operadores (nome + PIN editáveis) ----
const showOperatorModal = ref(false)
const editingOperatorId = ref(null)
const operatorForm = ref({ name: '', pin: '', role: 'operator', active: true })

function openOperatorModal() {
  editingOperatorId.value = null
  operatorForm.value = { name: '', pin: '', role: 'operator', active: true }
  showOperatorModal.value = true
}

function editOperator(op) {
  editingOperatorId.value = op.id
  operatorForm.value = { name: op.name, pin: op.pin, role: op.role, active: op.active }
  showOperatorModal.value = true
}

function closeOperatorModal() {
  showOperatorModal.value = false
}

function toggleOperatorActive(op) {
  op.active = !op.active
  updateOperatorAsync({ ...op }).then((saved) => {
    Object.assign(op, saved)
  })
}

async function saveOperator() {
  const name = operatorForm.value.name.trim()
  const pin = operatorForm.value.pin.replace(/\D/g, '').slice(0, 4)
  if (!name) {
    alert('Informe o nome.')
    return
  }
  if (!/^\d{4}$/.test(pin)) {
    alert('O PIN deve ter exatamente 4 números.')
    return
  }
  const dup = operators.value.find((x) => x.pin === pin && x.id !== editingOperatorId.value)
  if (dup) {
    alert(`Este PIN já está em uso por "${dup.name}". Escolha outro.`)
    return
  }

  if (editingOperatorId.value) {
    const saved = await updateOperatorAsync({
      id: editingOperatorId.value,
      name,
      pin,
      role: operatorForm.value.role,
      active: operatorForm.value.active,
    })
    const idx = operators.value.findIndex((x) => x.id === editingOperatorId.value)
    if (idx !== -1) operators.value[idx] = saved
  } else {
    const created = await createOperatorAsync({
      name,
      pin,
      role: operatorForm.value.role,
      active: operatorForm.value.active,
    })
    operators.value.push(created)
  }
  showOperatorModal.value = false
}

async function deleteOperator(op) {
  const admins = operators.value.filter((x) => x.role === 'admin' && x.active && x.id !== op.id)
  if (op.role === 'admin' && admins.length === 0) {
    alert('Não é possível excluir o único administrador ativo.')
    return
  }
  if (!confirm(`Excluir "${op.name}"?`)) return
  await deleteOperatorAsync(op.id)
  operators.value = operators.value.filter((x) => x.id !== op.id)
}

function saveSettings() {
  localStorage.setItem('print-settings', JSON.stringify(printSettings.value))
  alert('Configurações salvas!')
}

onMounted(async () => {
  products.value = await loadProductsAsync()
  operators.value = await loadOperatorsAsync()
  const saved = localStorage.getItem('print-settings')
  if (saved) {
    printSettings.value = { ...printSettings.value, ...JSON.parse(saved) }
  }
})
</script>