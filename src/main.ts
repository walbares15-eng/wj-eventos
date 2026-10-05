import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import App from './components/App.vue'
import router from './router'
import './index.css'

// Criar instância do app
const app = createApp(App)

// Configurar Pinia com persistência
const pinia = createPinia()
pinia.use(createPersistedState({
  key: 'venda-fichas-state',
  storage: localStorage
}))

// Registrar plugins
app.use(pinia)
app.use(router)

// Configuração global de acesso à internet
let isOnline = navigator.onLine
window.addEventListener('online', () => {
  isOnline = true
  // Sincronizar dados quando voltar online
  const { usePDVStore } = require('@/stores/pdv.store')
  const pdvStore = usePDVStore()
  pdvStore.syncOfflineData()
})

window.addEventListener('offline', () => {
  isOnline = false
})

// Montar aplicação
app.mount('#app')