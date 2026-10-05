// Produtos compartilhados entre PDV e Admin, persistidos no navegador.
// Quando o Supabase estiver configurado, esta camada pode ser trocada
// pela leitura do banco sem mudar os componentes.

export interface StoredProduct {
  id: string
  name: string
  price: number
  color: string
  active: boolean
  stock: number | null
  image: string | null
}

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
