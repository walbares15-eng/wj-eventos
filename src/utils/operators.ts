// Operadores compartilhados entre Admin e login.
// - SEM banco: ficam no navegador do aparelho.
// - COM Supabase: centralizam (mesmo PIN em todos os celulares).

import supabaseService from '@/services/supabase.service'
import { hasSharedDb, isLocalId } from './products'

export interface StoredOperator {
  id: string
  name: string
  pin: string
  role: string
  active: boolean
}

const KEY = 'wj-operators'

export const defaultOperators: StoredOperator[] = [
  { id: 'op-1', name: 'Wanderley', pin: '0000', role: 'admin', active: true },
  { id: 'op-3', name: 'Supervisor', pin: '1234', role: 'supervisor', active: true },
  { id: 'op-2', name: 'Caixa 1', pin: '1111', role: 'operator', active: true },
  { id: 'op-4', name: 'Caixa 2', pin: '2222', role: 'operator', active: true },
  { id: 'op-5', name: 'Caixa 3', pin: '3333', role: 'operator', active: true },
  { id: 'op-6', name: 'Caixa 4', pin: '4444', role: 'operator', active: true },
  { id: 'op-7', name: 'Caixa 5', pin: '5555', role: 'operator', active: true },
  { id: 'op-8', name: 'Caixa 6', pin: '6666', role: 'operator', active: true },
  { id: 'op-9', name: 'Caixa 7', pin: '7777', role: 'operator', active: true },
  { id: 'op-10', name: 'Caixa 8', pin: '8888', role: 'operator', active: true },
  { id: 'op-11', name: 'Caixa 9', pin: '9999', role: 'operator', active: true },
  { id: 'op-12', name: 'Caixa 10', pin: '1010', role: 'operator', active: true },
]

export function loadOperators(): StoredOperator[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignora
  }
  return defaultOperators.map((o) => ({ ...o }))
}

export function saveOperators(list: StoredOperator[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // ignora
  }
}

function rowToOperator(row: any): StoredOperator {
  return {
    id: String(row.id),
    name: row.name,
    pin: row.pin,
    role: row.role || 'operator',
    active: row.active !== false,
  }
}

export async function loadOperatorsAsync(): Promise<StoredOperator[]> {
  const local = loadOperators()
  if (!hasSharedDb()) return local
  try {
    const { data, error } = await supabaseService.select('operators', {
      select: 'id,name,pin,role,active',
      orderBy: 'name',
      ascending: true,
    })
    if (error || !data) return local
    let list = (data as any[]).map(rowToOperator)

    if (list.length === 0 && local.length > 0) {
      for (const o of local) {
        try {
          await supabaseService.insert('operators', {
            name: o.name,
            pin: o.pin,
            role: o.role,
            active: o.active,
          })
        } catch {
          // segue
        }
      }
      const retry = await supabaseService.select('operators', {
        select: 'id,name,pin,role,active',
        orderBy: 'name',
        ascending: true,
      })
      if (!retry.error && retry.data) list = (retry.data as any[]).map(rowToOperator)
    }

    if (list.length > 0) saveOperators(list)
    return list.length > 0 ? list : local
  } catch {
    return local
  }
}

export async function createOperatorAsync(
  o: Omit<StoredOperator, 'id'>
): Promise<StoredOperator> {
  const localFallback: StoredOperator = { ...o, id: 'op-' + Date.now() }
  if (!hasSharedDb()) {
    const list = loadOperators()
    list.push(localFallback)
    saveOperators(list)
    return localFallback
  }
  try {
    const { data, error } = await supabaseService.insert(
      'operators',
      { name: o.name, pin: o.pin, role: o.role, active: o.active },
      { returning: '*' }
    )
    if (error || !data) throw error || new Error('sem retorno do banco')
    const row = Array.isArray(data) ? data[0] : data
    const created = rowToOperator(row)
    const list = loadOperators()
    list.push(created)
    saveOperators(list)
    return created
  } catch {
    const list = loadOperators()
    list.push(localFallback)
    saveOperators(list)
    return localFallback
  }
}

export async function updateOperatorAsync(o: StoredOperator): Promise<StoredOperator> {
  if (hasSharedDb() && !isLocalId(o.id)) {
    try {
      const { error } = await supabaseService.update(
        'operators',
        { name: o.name, pin: o.pin, role: o.role, active: o.active },
        { filter: 'id', value: o.id }
      )
      if (error) throw error
    } catch {
      // mantém local
    }
  }
  saveOperators(loadOperators().map((x) => (x.id === o.id ? o : x)))
  return o
}

export async function deleteOperatorAsync(id: string): Promise<void> {
  if (hasSharedDb() && !isLocalId(id)) {
    try {
      await supabaseService.delete('operators', { filter: 'id', value: id })
    } catch {
      // segue
    }
  }
  saveOperators(loadOperators().filter((x) => x.id !== id))
}

// Busca operador pelo PIN na lista local (para login sem banco)
export function findLocalOperatorByPin(pin: string): StoredOperator | null {
  const found = loadOperators().find((o) => o.pin === pin && o.active !== false)
  return found || null
}
