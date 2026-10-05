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

  // Auth methods
  async signIn(pin: string): Promise<{ user: AuthUser; error: Error | null }> {
    try {
      const { data: { user, error } } = await this.supabase.auth.signInWithPassword({
        email: 'admin@event.com', // Fallback admin email
        password: pin,
      })

      if (error) {
        // Fallback to direct operator check
        const { data: operators, error: opError } = await this.supabase
          .from('operators')
          .select('*')
          .eq('pin', pin)
          .single()

        if (opError || !operators) {
          return { user: null, error: new Error('PIN incorreto') }
        }

        // Create a session for the operator
        const operator = operators as Operator
        await this.supabase.auth.setSession({
          access_token: 'operator-' + operator.id,
          refresh_token: 'operator-refresh-' + operator.id,
        })

        return {
          user: {
            id: operator.id,
            name: operator.name,
            role: operator.role,
            pin: operator.pin,
          },
          error: null,
        }
      }

      return { user: null, error }
    } catch (error) {
      return { user: null, error: error as Error }
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    // Get operator info
    const { data: operator } = await this.supabase
      .from('operators')
      .select('*')
      .eq('id', user.id)
      .single()

    return operator as AuthUser | null
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

  // Offline queue management
  async addToSyncQueue(item: SyncQueueItem): Promise<{ data: any; error: Error | null }> {
    try {
      const { data, error } = await this.insert('sync_queue', {
        ...item,
        lastAttempt: null,
        attempts: 0,
        createdAt: new Date().toISOString(),
      })

      if (!error) {
        console.log('✅ Item adicionado à fila de sincronização:', item.id)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async getPendingSyncItems(): Promise<{ data: any; error: Error | null }> {
    try {
      const { data, error } = await this.select('sync_queue', {
        filter: 'status',
        value: 'pending',
        select: '*',
        orderBy: 'created_at',
        ascending: true,
        limit: 100,
      })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const { data, error } = await this.update('sync_queue', updates, {
        filter: 'id',
        value: id,
        returning: '*',
      })

      return { data, error }
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
    const today = new Date().toISOString().split('T')[0]
    const { data: event } = await this.supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single()

    const todaySales = await this.supabase
      .from('fiches')
      .select('number')
      .eq('event_id', eventId)
      .like('number', `${today.split('-')[0]}-${today.split('-')[1]}-%`)

    const count = (todaySales.data?.length || 0) + 1
    const paddedCount = count.toString().padStart(3, '0')

    return `${today.split('-')[0]}-${today.split('-')[1]}-${paddedCount}`
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