import { createClient } from '@supabase/supabase-js'
import type {
  Event,
  Product,
  Operator,
  Sale,
  Fiche,
  CashRegister,
  SyncQueueItem,
  AuthUser,
  ReportData,
  DashboardSummary,
  SalesByProduct,
  SalesByPaymentMethod,
  SalesByHour,
  SalesByOperator,
  SalesByEvent,
  PaymentMethod,
} from '@/types'

export interface Database {
  public: {
    [_key: string]: unknown
  }
}

export interface Tables {
  EventsTable: {
    Row: Event
    Insert: Partial<Event>
    Update: Partial<Event>
    Relationships: never
  }
  ProductsTable: {
    Row: Product
    Insert: Partial<Product>
    Update: Partial<Product>
    Relationships: never
  }
  OperatorsTable: {
    Row: Operator
    Insert: Partial<Operator>
    Update: Partial<Operator>
    Relationships: never
  }
  SalesTable: {
    Row: Sale
    Insert: Partial<Sale>
    Update: Partial<Sale>
    Relationships: never
  }
  FichesTable: {
    Row: Fiche
    Insert: Partial<Fiche>
    Update: Partial<Fiche>
    Relationships: never
  }
  CashRegistersTable: {
    Row: CashRegister
    Insert: Partial<CashRegister>
    Update: Partial<CashRegister>
    Relationships: never
  }
  SyncQueueTable: {
    Row: SyncQueueItem
    Insert: Partial<SyncQueueItem>
    Update: Partial<SyncQueueItem>
    Relationships: never
  }
  SaleItemsTable: {
    Row: SaleItem
    Insert: Partial<SaleItem>
    Update: Partial<SaleItem>
    Relationships: never
  }
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number
  createdAt: string
}

export class SupabaseService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }

  // Auth methods — com modo demonstração local (sem Supabase configurado)
  async signIn(pin: string): Promise<{ user: AuthUser; error: Error | null }> {
    const demoUsers: Record<string, AuthUser> = {
      '0000': { id: 'op-1', name: 'Wanderley (Admin)', role: 'admin', pin: '0000' },
      '1111': { id: 'op-2', name: 'Caixa 1', role: 'operator', pin: '1111' },
      '2222': { id: 'op-4', name: 'Caixa 2', role: 'operator', pin: '2222' },
      '3333': { id: 'op-5', name: 'Caixa 3', role: 'operator', pin: '3333' },
      '4444': { id: 'op-6', name: 'Caixa 4', role: 'operator', pin: '4444' },
      '1234': { id: 'op-3', name: 'João (Supervisor)', role: 'supervisor', pin: '1234' },
    }

    // Tenta Supabase primeiro; se falhar (sem env/DB), cai no modo demo
    try {
      const { data: { user }, error } = await this.supabase.auth.signInWithPassword({
        email: 'admin@event.com',
        password: pin,
      })

      if (!error && user) {
        return { user: null, error }
      }

      const { data: operator, error: opError } = await (this.supabase as any)
        .from('operators')
        .select('*')
        .eq('pin', pin)
        .single()

      if (!opError && operator) {
        const op = operator as Operator
        return {
          user: { id: op.id, name: op.name, role: op.role, pin: op.pin },
          error: null,
        }
      }
    } catch {
      // ignora erro de rede — usa demo abaixo
    }

    const demo = demoUsers[pin]
    if (demo) {
      localStorage.setItem('wj-demo-user', JSON.stringify(demo))
      return { user: demo, error: null }
    }

    return { user: null, error: new Error('PIN incorreto') }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut()
    } catch {
      // ignora
    }
    localStorage.removeItem('wj-demo-user')
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (user) {
        const { data: operator } = await (this.supabase as any)
          .from('operators')
          .select('*')
          .eq('id', user.id)
          .single()

        if (operator) return operator as AuthUser | null
      }
    } catch {
      // ignora — tenta demo abaixo
    }

    try {
      const raw = localStorage.getItem('wj-demo-user')
      if (raw) return JSON.parse(raw) as AuthUser
    } catch {
      // ignora
    }
    return null
  }

  // General CRUD methods
  async select<T extends keyof Database['public']>(
    table: T,
    options?: {
      filter?: string
      value?: any
      select?: string
      orderBy?: string
      ascending?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (this.supabase as any).from(table as string).select(options?.select || '*')

      if (options?.filter && options?.value !== undefined) {
        query = query.eq(options.filter, options.value)
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? false,
        })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async insert<T extends keyof Database['public']>(
    table: T,
    values: any,
    options?: {
      returning?: string
      headers?: Record<string, string>
    }
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (this.supabase as any).from(table as string).insert(values)

      if (options?.returning) {
        query = query.select(options.returning)
      }

      if (options?.headers) {
        query = query.headers(options.headers)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async update<T extends keyof Database['public']>(
    table: T,
    values: any,
    options?: {
      filter?: string
      value?: any
      returning?: string
    }
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (this.supabase as any).from(table as string).update(values)

      if (options?.filter && options?.value !== undefined) {
        query = query.eq(options.filter, options.value)
      }

      if (options?.returning) {
        query = query.select(options.returning)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async delete(
    table: string,
    options?: {
      filter?: string
      value?: any
    }
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (this.supabase as any).from(table).delete()

      if (options?.filter && options?.value !== undefined) {
        query = query.eq(options.filter, options.value)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Subscribe to real-time changes
  subscribe<T extends keyof Database['public']>(
    table: T,
    callback: (payload: any) => void
  ): () => void {
    const channel = this.supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table as string,
        } as any,
        (payload: any) => callback(payload)
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }

  // Fila offline LOCAL (navegador do aparelho) — as vendas sem internet
  // ficam gravadas aqui e sobem quando a internet voltar.
  private readLocalQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem('wj-sync-queue')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignora
    }
    return []
  }

  private writeLocalQueue(items: SyncQueueItem[]): void {
    try {
      localStorage.setItem('wj-sync-queue', JSON.stringify(items))
    } catch {
      // ignora
    }
  }

  // Offline queue management
  async addToSyncQueue(item: SyncQueueItem): Promise<{ data: any; error: Error | null }> {
    try {
      const queue = this.readLocalQueue()
      queue.push({
        ...item,
        attempts: 0,
        lastAttempt: null,
        createdAt: new Date().toISOString(),
      } as SyncQueueItem)
      this.writeLocalQueue(queue)
      console.log('✅ Venda guardada para sincronizar:', item.id)
      return { data: item, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async getPendingSyncItems(): Promise<{ data: any; error: Error | null }> {
    try {
      const pending = this.readLocalQueue().filter(
        (i: any) => i.status !== 'synced' && (i.attempts || 0) < 10
      )
      return { data: pending, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<{ data: any; error: Error | null }> {
    try {
      let queue = this.readLocalQueue()
      if ((updates as any).status === 'synced') {
        queue = queue.filter((i: any) => i.id !== id)
      } else {
        queue = queue.map((i: any) => (i.id === id ? { ...i, ...updates } : i))
      }
      this.writeLocalQueue(queue)
      return { data: updates, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Sales methods
  async createSale(
    sale: Partial<Sale>,
    items: Partial<SaleItem>[],
    fiches: Partial<Fiche>[]
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // Iniciar transação
      const { data: saleData, error: saleError } = await this.insert(
        'sales',
        sale,
        { returning: '*' }
      )

      if (saleError) throw saleError

      // Criar itens da venda
      const itemsWithSaleId = items.map(item => ({
        ...item,
        sale_id: saleData[0].id,
      }))

      const { data: itemsData, error: itemsError } = await this.insert(
        'sale_items',
        itemsWithSaleId,
        { returning: '*' }
      )

      if (itemsError) throw itemsError

      // Criar fichas
      const fichesWithSaleId = fiches.map(fiche => ({
        ...fiche,
        sale_id: saleData[0].id,
      }))

      const { data: fichesData, error: fichesError } = await this.insert(
        'fiches',
        fichesWithSaleId,
        { returning: '*' }
      )

      if (fichesError) throw fichesError

      return { data: { sale: saleData[0], items: itemsData, fiches: fichesData }, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Query helpers
  async getEventDashboardData(eventId: string, startDate: string, endDate: string) {
    try {
      const [
        salesRes, productsRes, operatorsRes, paymentMethodsRes, hoursRes
      ] = await Promise.all([
        this.supabase.from('sales').select('*').eq('event_id', eventId).gte('created_at', startDate).lte('created_at', endDate),
        this.supabase.from('products').select('*').eq('event_id', eventId),
        this.supabase.from('operators').select('*'),
        this.supabase.from('sales').select('payment_method').eq('event_id', eventId).gte('created_at', startDate).lte('created_at', endDate),
        this.supabase.from('sales').select('hour(created_at)').eq('event_id', eventId).gte('created_at', startDate).lte('created_at', endDate)
      ])

      const sales = salesRes.data || []
      const products = productsRes.data || []
      const operators = operatorsRes.data || []
      const paymentMethods = paymentMethodsRes.data || []
      const hours = hoursRes.data || []

      // Processar dados para dashboard
      const dashboardData = this.processDashboardData(sales, products, operators, paymentMethods, hours)

      return { data: dashboardData, error: salesRes.error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  private processDashboardData(
    sales: any[],
    products: any[],
    operators: any[],
    paymentMethods: any[],
    hours: any[]
  ): ReportData {
    const summary: DashboardSummary = {
      totalSales: sales.length,
      totalTickets: sales.reduce((sum, sale) => sum + (sale.fiche_numbers?.length || 0), 0),
      averageTicket: 0,
      totalTransactions: 0,
    }

    if (summary.totalSales > 0) {
      summary.averageTicket = sales.reduce((sum, sale) => sum + sale.total, 0) / summary.totalSales
    }

    const byProduct: SalesByProduct[] = []
    const byPaymentMethod: SalesByPaymentMethod[] = []
    const byHour: SalesByHour[] = []
    const byOperator: SalesByOperator[] = []
    const byEvent: SalesByEvent[] = []

    // Processar vendas por produto
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.product_id)
      const existing = byProduct.find(p => p.product === product?.name)
      if (existing) {
        existing.quantity += sale.quantity
        existing.total += sale.total
      } else {
        byProduct.push({
          product: product?.name || 'Desconhecido',
          quantity: sale.quantity,
          total: sale.total,
          percentage: 0,
        })
      }
    })

    // Processar vendas por forma de pagamento
    const paymentMap: Record<PaymentMethod, number> = {}
    sales.forEach(sale => {
      paymentMap[sale.payment_method] = (paymentMap[sale.payment_method] || 0) + sale.total
    })

    byPaymentMethod.push(
      ...Object.entries(paymentMap).map(([method, total]) => ({
        method: method as PaymentMethod,
        total,
        percentage: 0,
      }))
    )

    return {
      summary,
      byProduct,
      byPaymentMethod,
      byHour,
      byOperator,
      byEvent,
      ficheStats: [],
      cashRegisters: [],
    }
  }

  // Utility methods
  async generateFicheNumber(eventId: string): Promise<string> {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')

    // Sem Supabase configurado → numeração sequencial local (por mês)
    const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || ''
    const hasRealDb = envUrl.startsWith('http') && !envUrl.includes('placeholder')
    if (!hasRealDb) {
      return this.nextLocalFicheNumber(yyyy, mm)
    }

    // Com banco: sufixo único por horário — 4 celulares vendendo juntos
    // nunca repetem o número, com ou sem internet.
    const suffix = Date.now().toString(36).toUpperCase().slice(-6)
    return `${yyyy}-${mm}-${suffix}`
  }

  private nextLocalFicheNumber(yyyy: number, mm: string): string {
    const key = `wj-fiche-seq-${yyyy}-${mm}`
    let n = 0
    try {
      n = parseInt(localStorage.getItem(key) || '0', 10) || 0
    } catch {
      n = 0
    }
    n += 1
    try {
      localStorage.setItem(key, String(n))
    } catch {
      // ignora
    }
    return `${yyyy}-${mm}-${String(n).padStart(3, '0')}`
  }

  // Encryption utilities
  async encryptPIN(pin: string): Promise<string> {
    // Implementação simples - em produção usar bcrypt
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async verifyPIN(encryptedPIN: string, inputPIN: string): Promise<boolean> {
    const inputHash = await this.encryptPIN(inputPIN)
    return encryptedPIN === inputHash
  }

  // Passthrough para acesso direto (usado pelas stores)
  from(table: string): any {
    return (this.supabase as any).from(table)
  }
}

const supabaseService = new SupabaseService()

export default supabaseService