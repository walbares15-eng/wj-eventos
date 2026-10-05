import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './components/App.vue'
import router from './router'
import { usePDVStore } from '@/stores/pdv.store'
import './index.css'

// Criar instância do app
const app = createApp(App)

// Configurar Pinia
const pinia = createPinia()

// Registrar plugins
app.use(pinia)
app.use(router)

// Sincronizar quando voltar online
window.addEventListener('online', () => {
  const pdvStore = usePDVStore()
  pdvStore.syncOfflineData()
})

// Montar aplicação
app.mount('#app')