<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <router-link to="/" class="text-blue-600 hover:text-blue-800">← Voltar</router-link>
          <h1 class="text-xl font-bold text-gray-800">Relatório de Vendas</h1>
        </div>
        <button @click="exportCSV" class="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900">
          Exportar CSV
        </button>
      </div>
    </header>

    <div class="container mx-auto px-4 py-6">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4">
        <select v-model="filters.eventId" class="border rounded px-3 py-2">
          <option value="">Todos os Eventos</option>
          <option value="evento-teste">Festa Junina 2026</option>
        </select>
        <input v-model="filters.startDate" type="date" class="border rounded px-3 py-2" />
        <input v-model="filters.endDate" type="date" class="border rounded px-3 py-2" />
        <button @click="fetchReport" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Filtrar
        </button>
      </div>

      <!-- Dashboard Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow text-center">
          <p class="text-sm text-gray-600">Total Vendas</p>
          <p class="text-2xl font-bold text-blue-600">R$ {{ reportData.summary.totalSales.toFixed(2) }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow text-center">
          <p class="text-sm text-gray-600">Total Fichas</p>
          <p class="text-2xl font-bold">{{ reportData.summary.totalTickets }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow text-center">
          <p class="text-sm text-gray-600">Ticket Médio</p>
          <p class="text-2xl font-bold text-green-600">R$ {{ reportData.summary.averageTicket.toFixed(2) }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow text-center">
          <p class="text-sm text-gray-600">Transações</p>
          <p class="text-2xl font-bold">{{ reportData.summary.totalTransactions }}</p>
        </div>
      </div>

      <!-- Tables -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold mb-4">Por Produto</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2">Produto</th>
                <th class="pb-2 text-right">Qtd</th>
                <th class="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData.byProduct" :key="item.product" class="border-b">
                <td class="py-2">{{ item.product }}</td>
                <td class="py-2 text-right">{{ item.quantity }}</td>
                <td class="py-2 text-right">R$ {{ item.total.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold mb-4">Por Pagamento</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2">Método</th>
                <th class="pb-2 text-right">Total</th>
                <th class="pb-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in reportData.byPaymentMethod" :key="item.method" class="border-b">
                <td class="py-2 capitalize">{{ item.method }}</td>
                <td class="py-2 text-right">R$ {{ item.total.toFixed(2) }}</td>
                <td class="py-2 text-right">{{ item.percentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const filters = ref({
  eventId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
})

const reportData = ref({
  summary: { totalSales: 1500.50, totalTickets: 200, averageTicket: 7.50, totalTransactions: 30 },
  byProduct: [
    { product: 'Cerveja', quantity: 100, total: 800, percentage: 53 },
    { product: 'Refrigerante', quantity: 50, total: 250, percentage: 17 },
    { product: 'Espetinho', quantity: 50, total: 300, percentage: 20 },
    { product: 'Água', quantity: 50, total: 150, percentage: 10 },
  ],
  byPaymentMethod: [
    { method: 'cash', total: 500, percentage: 33 },
    { method: 'pix', total: 700, percentage: 47 },
    { method: 'debit', total: 300, percentage: 20 },
  ],
})

function fetchReport() {
  alert('Filtrando relatório...')
}

function exportCSV() {
  alert('Exportando para CSV...')
}

onMounted(() => {
  // fetchReport()
})
</script>