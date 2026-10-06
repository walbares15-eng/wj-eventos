// Galeria de fotos de produtos: envie uma vez, reuse em vários cadastros.
// Fica salva no navegador do aparelho e vai junto no Backup.

import { processImageFile } from './products'

export interface GalleryPhoto {
  id: string
  label: string
  dataUrl: string
  createdAt: string
}

const KEY = 'wj-gallery'
// Fotos da galeria são reduzidas (320px) para caberem centenas delas
// no armazenamento do navegador.
const GALLERY_MAX_SIZE = 320

export function loadGallery(): GalleryPhoto[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignora
  }
  return []
}

export function saveGallery(list: GalleryPhoto[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    alert('Armazenamento cheio: a galeria não coube inteira. Apague fotos antigas ou use imagens menores.')
  }
}

export async function addPhotosToGallery(files: FileList | File[]): Promise<GalleryPhoto[]> {
  const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
  const list = loadGallery()
  let added = 0
  for (const file of arr) {
    try {
      const dataUrl = await processImageFile(file, GALLERY_MAX_SIZE)
      const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
      list.push({
        id: 'img-' + Date.now() + '-' + added,
        label: base ? base.slice(0, 40) : `Foto ${list.length + 1}`,
        dataUrl,
        createdAt: new Date().toISOString(),
      })
      added += 1
    } catch {
      // pula arquivo inválido
    }
  }
  saveGallery(list)
  return list
}

export function deleteGalleryPhoto(id: string): GalleryPhoto[] {
  const list = loadGallery().filter((p) => p.id !== id)
  saveGallery(list)
  return list
}

export function renameGalleryPhoto(id: string, label: string): GalleryPhoto[] {
  const list = loadGallery().map((p) => (p.id === id ? { ...p, label } : p))
  saveGallery(list)
  return list
}
