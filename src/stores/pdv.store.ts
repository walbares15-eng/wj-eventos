import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, PaymentMethod, Sale, Fiche } from '@/types'
import type { PrintedFiche } from '@/utils/ticket'
import { v4 as uuidv4 } from 'uuid'
import supabaseService from '@/services/supabase.service'

export const usePDVStore = defineStore('pdv', () => {
  // State
  const cart = ref<{ product: Product; quantity: number }[]>([])
  const paymentMethod = ref<PaymentMethod | null>(null)
  const isProcessing = ref(false)
  const lastPrintedFiche = ref<string | null>(null)
  const lastTicketBatch = ref<PrintedFiche[]>([])
  const offlineQueue = ref<Array<{ type: string; data: any }>>([])
  const isSyncing = ref(false)

  // Computed
  const totalItems = computed(() => 
    cart.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() => 
    cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  )

  const total = computed(() => subtotal.value)

  const isCartEmpty = computed(() => cart.value.length === 0)

  const canCheckout = computed(() => 
    !isCartEmpty.value && paymentMethod.value !== null
  )

  // Actions
  function addToCart(product: Product) {
    const existingItem = cart.value.find(item => item.product.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.value.push({ product, quantity: 1 })
    }
  }

  function removeFromCart(productId: string) {
    const index = cart.value.findIndex(item => item.product.id === productId)
    if (index !== -1) {
      cart.value.splice(index, 1)
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = cart.value.find(item => item.product.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
      } else {
        item.quantity = quantity
      }
    }
  }

  function clearCart() {
    cart.value = []
    paymentMethod.value = null
  }

  function setPaymentMethod(method: PaymentMethod) {
    paymentMethod.value = method
  }

  async function processSale(
    operatorId: string,
    operatorName: string,
    eventId: string,
    products: Product[]
  ): Promise<{ success: boolean; error?: string; fiches?: PrintedFiche[] }> {
    if (!canCheckout.value) {
      return { success: false, error: 'Carrinho vazio ou forma de pagamento não selecionada' }
    }

    const paymentLabels: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'PIX',
      debit: 'Débito',
      credit: 'Crédito',
      courtesy: 'Cortesia',
    }
    const paymentLabel = paymentLabels[paymentMethod.value as string] || '—'

    try {
      isProcessing.value = true

      // Preparar dados da venda
      const saleId = uuidv4()
      const ficheNumbers: string[] = []
      const saleItems: any[] = []
      const fiches: any[] = []
      const printedFiches: PrintedFiche[] = []
      const fichePromises: Promise<string>[] = []

      // Processar cada item do carrinho
      for (const cartItem of cart.value) {
        // Calcular totais
        const unitPrice = cartItem.product.price
        const totalPrice = unitPrice * cartItem.quantity

        // Adicionar item da venda
        saleItems.push({
          sale_id: saleId,
          product_id: cartItem.product.id,
          quantity: cartItem.quantity,
          unit_price: unitPrice,
        })

        // Gerar fichas (uma por unidade)
        for (let i = 0; i < cartItem.quantity; i++) {
          const ficheNumber = await supabaseService.generateFicheNumber(eventId)
          ficheNumbers.push(ficheNumber)
          const qrText = `WJEVENTOS:${ficheNumber}`

          // Gerar ficha para impressão
          fiches.push({
            sale_id: saleId,
            number: ficheNumber,
            event_id: eventId,
            product_id: cartItem.product.id,
            operator_id: operatorId,
            status: 'issued',
            qr_data: qrText,
          })

          printedFiches.push({
            number: ficheNumber,
            productName: cartItem.product.name,
            price: unitPrice,
            paymentLabel,
            operatorName,
            date: new Date().toISOString(),
            qrText,
          })
        }
      }

      // Criar a venda
      const saleData = {
        id: saleId,
        event_id: eventId,
        operator_id: operatorId,
        total: subtotal.value,
        payment_method: paymentMethod.value,
        status: 'pending',
        fiche_numbers: ficheNumbers,
        created_at: new Date().toISOString(),
      }

      // Se online, salvar no Supabase
      if (navigator.onLine) {
        const { error: saleError } = await supabaseService
          .from('sales')
          .insert(saleData)

        if (saleError) throw saleError

        // Salvar itens
        if (saleItems.length > 0) {
          const { error: itemsError } = await supabaseService
            .from('sale_items')
            .insert(saleItems)

          if (itemsError) throw itemsError
        }

        // Salvar fichas
        if (fiches.length > 0) {
          const { error: fichesError } = await supabaseService
            .from('fiches')
            .insert(fiches)

          if (fichesError) throw fichesError
        }

        // Atualizar última ficha impressa
        lastPrintedFiche.value = ficheNumbers[0] || null
      } else {
        // Modo offline: adicionar à fila
        await Promise.all([
          supabaseService.addToSyncQueue({
            id: uuidv4(),
            type: 'sale',
            action: 'create',
            data: saleData,
            attempts: 0,
            lastAttempt: null,
          }),
          supabaseService.addToSyncQueue({
            id: uuidv4(),
            type: 'sale_item',
            action: 'create',
            data: { items: saleItems },
            attempts: 0,
            lastAttempt: null,
          }),
          supabaseService.addToSyncQueue({
            id: uuidv4(),
            type: 'fiche',
            action: 'create',
            data: { fiches },
            attempts: 0,
            lastAttempt: null,
          })
        ])
      }

      // Limpar carrinho após processamento
      clearCart()

      // Guardar lote para reimpressão
      lastTicketBatch.value = printedFiches
      lastPrintedFiche.value = ficheNumbers[0] || null

      return { success: true, fiches: printedFiches }
    } catch (err) {
      console.error('Erro ao processar venda:', err)
      return { success: false, error: (err as Error).message }
    } finally {
      isProcessing.value = false
    }
  }

  async function reprintLastFiche(operatorId: string, pin: string): Promise<{ success: boolean; error?: string }> {
    if (!lastPrintedFiche.value) {
      return { success: false, error: 'Nenhuma ficha para reimprimir' }
    }

    // Verificar PIN do supervisor (implementação simplificada)
    if (pin !== '1234') { // Em produção, usar serviço de autenticação
      return { success: false, error: 'PIN do supervisor incorreto' }
    }

    try {
      // Buscar última ficha para reimprimir
      const { data: fiche, error } = await supabaseService
        .from('fiches')
        .select('*')
        .eq('number', lastPrintedFiche.value)
        .single()

      if (error) throw error
      if (!fiche) throw new Error('Ficha não encontrada')

      return { success: true, error: undefined, data: fiche }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async function startCashRegister(
    operatorId: string,
    eventId: string,
    expectedCash: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const registerData = {
        id: uuidv4(),
        operator_id: operatorId,
        event_id: eventId,
        expected_cash: expectedCash,
        received_cash: 0,
        difference: 0,
        opened_at: new Date().toISOString(),
        status: 'open',
      }

      if (navigator.onLine) {
        const { error } = await supabaseService
          .from('cash_registers')
          .insert(registerData)

        if (error) throw error
      } else {
        await supabaseService.addToSyncQueue({
          id: uuidv4(),
          type: 'cash_register',
          action: 'create',
          data: registerData,
          attempts: 0,
          lastAttempt: null,
        })
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async function closeCashRegister(
    registerId: string,
    receivedCash: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const difference = receivedCash - (await getExpectedCash(registerId))

      const updateData = {
        received_cash: receivedCash,
        difference: difference,
        closed_at: new Date().toISOString(),
        status: 'closed',
      }

      if (navigator.onLine) {
        const { error } = await supabaseService
          .from('cash_registers')
          .update(updateData)
          .eq('id', registerId)

        if (error) throw error
      } else {
        await supabaseService.addToSyncQueue({
          id: uuidv4(),
          type: 'cash_register',
          action: 'update',
          data: { id: registerId, ...updateData },
          attempts: 0,
          lastAttempt: null,
        })
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async function getExpectedCash(registerId: string): Promise<number> {
    const { data: register } = await supabaseService
      .from('cash_registers')
      .select('expected_cash')
      .eq('id', registerId)
      .single()

    return register?.expected_cash || 0
  }

  // Sync management
  async function syncOfflineData() {
    if (isSyncing.value || !navigator.onLine) return

    try {
      isSyncing.value = true
      const { data: pendingItems } = await supabaseService.getPendingSyncItems()

      if (pendingItems && pendingItems.length > 0) {
        // Processar itens pendentes
        for (const item of pendingItems) {
          try {
            switch (item.type) {
              case 'sale':
                await supabaseService.from('sales').insert(item.data)
                break
              case 'sale_item':
                await supabaseService.from('sale_items').insert(item.data.items)
                break
              case 'fiche':
                await supabaseService.from('fiches').insert(item.data.fiches)
                break
              case 'cash_register':
                if (item.action === 'create') {
                  await supabaseService.from('cash_registers').insert(item.data)
                } else if (item.action === 'update') {
                  await supabaseService.from('cash_registers').update(item.data)
                    .eq('id', item.data.id)
                }
                break
            }

            // Marcar como sincronizado
            await supabaseService.updateSyncQueueItem(item.id, {
              status: 'synced',
              lastAttempt: new Date().toISOString(),
              attempts: item.attempts + 1,
            })
          } catch (err) {
            // Tentar novamente mais tarde
            await supabaseService.updateSyncQueueItem(item.id, {
              attempts: item.attempts + 1,
              lastAttempt: new Date().toISOString(),
            })
          }
        }
      }
    } catch (err) {
      console.error('Erro na sincronização:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // Listeners for online/offline
  function setupNetworkListeners() {
    window.addEventListener('online', () => {
      syncOfflineData()
    })

    window.addEventListener('offline', () => {
      // Quando offline, apenas marcar estado
    })
  }

  return {
    // State
    cart,
    paymentMethod,
    isProcessing,
    lastPrintedFiche,
    lastTicketBatch,
    offlineQueue,
    isSyncing,

    // Computed
    totalItems,
    subtotal,
    total,
    isCartEmpty,
    canCheckout,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setPaymentMethod,
    processSale,
    reprintLastFiche,
    startCashRegister,
    closeCashRegister,
    getExpectedCash,
    syncOfflineData,
    setupNetworkListeners,
  }
})