// Produtos compartilhados entre PDV e Admin.
// - SEM banco configurado: ficam salvos no navegador do aparelho.
// - COM Supabase configurado: o Admin (PC) grava no banco e os celulares
//   leem de lá; o navegador guarda cópia para funcionar offline.

import supabaseService from '@/services/supabase.service'

export interface StoredProduct {
  id: string
  name: string
  price: number
  color: string
  active: boolean
  stock: number | null
  image: string | null
}

// Evento padrão (mesmo UUID do seed em database.sql)
export const DEFAULT_EVENT_ID = '11111111-1111-1111-1111-111111111111'

const KEY = 'wj-products'

export const defaultProducts: StoredProduct[] = [
  { id: 'prod-1', name: 'Cerveja', price: 8, color: '#f59e0b', active: true, stock: 200, image: null },
  { id: 'prod-2', name: 'Refrigerante', price: 5, color: '#ef4444', active: true, stock: 150, image: null },
  { id: 'prod-3', name: 'Espetinho', price: 6, color: '#8b5cf6', active: true, stock: 100, image: null },
  { id: 'prod-4', name: 'Água', price: 3, color: '#3b82f6', active: true, stock: null, image: null },
  { id: 'prod-5', name: 'Whisky', price: 15, color: '#78350f', active: true, stock: 50, image: null },
  { id: 'prod-6', name: 'Vinho', price: 12, color: '#7f1d1d', active: true, stock: 5, image: null },
]

export function loadProducts(): StoredProduct[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignora e usa o padrão
  }
  return defaultProducts.map((p) => ({ ...p }))
}

export function saveProducts(list: StoredProduct[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    alert('Não foi possível salvar: armazenamento do navegador cheio. Use fotos menores.')
  }
}

export function isLocalId(id: string): boolean {
  return id.startsWith('prod-')
}

// Há banco compartilhado configurado?
export function hasSharedDb(): boolean {
  try {
    const url = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || ''
    return url.startsWith('http') && !url.includes('placeholder')
  } catch {
    return false
  }
}

function rowToProduct(row: any): StoredProduct {
  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price),
    color: row.color || '#10b981',
    active: row.active !== false,
    stock: row.stock ?? null,
    image: row.image || null,
  }
}

// Lê do banco (com cache local + migração da primeira vez)
export async function loadProductsAsync(): Promise<StoredProduct[]> {
  const local = loadProducts()
  if (!hasSharedDb()) return local
  try {
    const { data, error } = await supabaseService.select('products', {
      select: 'id,event_id,name,price,color,active,stock,image',
      filter: 'event_id',
      value: DEFAULT_EVENT_ID,
      orderBy: 'name',
      ascending: true,
    })
    if (error || !data) return local
    let list = (data as any[]).map(rowToProduct)

    // Banco vazio + aparelho com produtos: migra tudo para o banco
    if (list.length === 0 && local.length > 0) {
      for (const p of local) {
        try {
          await supabaseService.insert('products', {
            event_id: DEFAULT_EVENT_ID,
            name: p.name,
            price: p.price,
            color: p.color,
            active: p.active,
            stock: p.stock,
            image: p.image,
          })
        } catch {
          // ignora item com falha e segue
        }
      }
      const retry = await supabaseService.select('products', {
        select: 'id,event_id,name,price,color,active,stock,image',
        filter: 'event_id',
        value: DEFAULT_EVENT_ID,
        orderBy: 'name',
        ascending: true,
      })
      if (!retry.error && retry.data) list = (retry.data as any[]).map(rowToProduct)
    }

    if (list.length > 0) saveProducts(list)
    return list.length > 0 ? list : local
  } catch {
    return local
  }
}

export async function createProductAsync(
  p: Omit<StoredProduct, 'id'>
): Promise<StoredProduct> {
  const localFallback: StoredProduct = { ...p, id: 'prod-' + Date.now() }
  if (!hasSharedDb()) {
    const list = loadProducts()
    list.push(localFallback)
    saveProducts(list)
    return localFallback
  }
  try {
    const { data, error } = await supabaseService.insert(
      'products',
      {
        event_id: DEFAULT_EVENT_ID,
        name: p.name,
        price: p.price,
        color: p.color,
        active: p.active,
        stock: p.stock,
        image: p.image,
      },
      { returning: '*' }
    )
    if (error || !data) throw error || new Error('sem retorno do banco')
    const row = Array.isArray(data) ? data[0] : data
    const created = rowToProduct(row)
    const list = loadProducts()
    list.push(created)
    saveProducts(list)
    return created
  } catch {
    const list = loadProducts()
    list.push(localFallback)
    saveProducts(list)
    return localFallback
  }
}

export async function updateProductAsync(p: StoredProduct): Promise<StoredProduct> {
  const persistLocal = () => {
    const list = loadProducts().map((x) => (x.id === p.id ? p : x))
    saveProducts(list)
  }
  if (hasSharedDb() && !isLocalId(p.id)) {
    try {
      const { error } = await supabaseService.update(
        'products',
        {
          name: p.name,
          price: p.price,
          color: p.color,
          active: p.active,
          stock: p.stock,
          image: p.image,
        },
        { filter: 'id', value: p.id }
      )
      if (error) throw error
    } catch {
      // mantém local mesmo se o banco falhar
    }
  }
  persistLocal()
  return p
}

export async function deleteProductAsync(id: string): Promise<void> {
  if (hasSharedDb() && !isLocalId(id)) {
    try {
      await supabaseService.delete('products', { filter: 'id', value: id })
    } catch {
      // segue removendo local
    }
  }
  saveProducts(loadProducts().filter((x) => x.id !== id))
}

// Lê um arquivo de imagem e devolve um JPEG redimensionado (base64),
// para a foto não estourar o limite do armazenamento local.
export function processImageFile(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas indisponível'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}
