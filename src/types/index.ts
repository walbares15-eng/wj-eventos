export type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'courtesy'

export type SaleStatus = 'pending' | 'synced' | 'cancelled' | 'refunded'

export type FicheStatus = 'issued' | 'redeemed' | 'cancelled'

export type OperatorRole = 'admin' | 'operator' | 'supervisor'

export interface Event {
  id: string
  name: string
  date: string
  location: string
  status: 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  eventId: string
  name: string
  price: number
  color: string
  active: boolean
  stock: number | null
  createdAt: string
  updatedAt: string
}

export interface Operator {
  id: string
  name: string
  pin: string
  role: OperatorRole
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  eventId: string
  operatorId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  ficheNumbers: string[]
  createdAt: string
  syncedAt: string | null
}

export interface Fiche {
  id: string
  saleId: string
  number: string
  eventId: string
  productId: string
  operatorId: string
  status: FicheStatus
  qrData: string
  issuedAt: string
  redeemedAt: string | null
  cancelledAt: string | null
}

export interface CashRegister {
  id: string
  operatorId: string
  eventId: string
  expectedCash: number
  receivedCash: number
  difference: number
  openedAt: string
  closedAt: string | null
  status: 'open' | 'closed'
}

export interface PrintSettings {
  paperWidth: 58 | 80
  header: string
  footer: string
  fontSize: number
  showLogo: boolean
  logoUrl: string | null
}

export interface AppSettings {
  printSettings: PrintSettings
  currency: string
  timezone: string
  language: string
}

export interface SyncQueueItem {
  id: string
  type: 'sale' | 'fiche' | 'cash_register' | 'operator'
  action: 'create' | 'update' | 'delete'
  data: Record<string, any>
  attempts: number
  lastAttempt: string | null
  createdAt: string
}

export interface AuthUser {
  id: string
  name: string
  role: OperatorRole
  pin: string
}

export interface DashboardSummary {
  totalSales: number
  totalTickets: number
  averageTicket: number
  totalTransactions: number
}

export interface SalesByProduct {
  product: string
  quantity: number
  total: number
  percentage: number
}

export interface SalesByPaymentMethod {
  method: PaymentMethod
  total: number
  percentage: number
}

export interface SalesByHour {
  hour: string
  total: number
  count: number
}

export interface SalesByOperator {
  operator: string
  total: number
  count: number
}

export interface SalesByEvent {
  event: string
  total: number
  count: number
}

export interface FicheStats {
  issued: number
  redeemed: number
  remaining: number
}

export interface CashRegisterReport {
  operator: string
  expectedCash: number
  receivedCash: number
  difference: number
  openedAt: string
  closedAt: string | null
  status: string
}

export interface ReportFilters {
  eventId?: string
  startDate?: string
  endDate?: string
  operatorId?: string
  productId?: string
  paymentMethod?: PaymentMethod
}

export interface ReportData {
  summary: DashboardSummary
  byProduct: SalesByProduct[]
  byPaymentMethod: SalesByPaymentMethod[]
  byHour: SalesByHour[]
  byOperator: SalesByOperator[]
  byEvent: SalesByEvent[]
  ficheStats: FicheStats[]
  cashRegisters: CashRegisterReport[]
}