// Impressão de fichas em impressora térmica (58mm/80mm) via navegador.
// Usado na Moderninha Smart: o diálogo de impressão do Android envia
// direto para a impressora embutida.

import QRCode from 'qrcode'

export interface PrintedFiche {
  number: string
  productName: string
  price: number
  paymentLabel: string
  operatorName: string
  date: string
  qrText: string
}

interface PrintSettings {
  paperWidth: 58 | 80
  header: string
  eventName: string
  footer: string
  fontSize: number
  autoPrint: boolean
}

function getPrintSettings(): PrintSettings {
  const fallback: PrintSettings = {
    paperWidth: 58,
    header: 'WJ EVENTOS',
    eventName: '',
    footer: 'Troque sua ficha no balcão',
    fontSize: 12,
    autoPrint: true,
  }
  try {
    const raw = localStorage.getItem('print-settings')
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch {
    // ignora
  }
  return fallback
}

export function shouldAutoPrint(): boolean {
  return getPrintSettings().autoPrint !== false
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function printFiches(fiches: PrintedFiche[]): Promise<void> {
  if (!fiches || fiches.length === 0) return

  const settings = getPrintSettings()
  const width = settings.paperWidth === 80 ? '80mm' : '58mm'
  const fs = settings.fontSize || 12

  const dateStr = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  // QR Code de cada ficha (para controle antifraude no resgate)
  const qrUrls = await Promise.all(
    fiches.map((f) => QRCode.toDataURL(f.qrText, { width: 140, margin: 0 }).catch(() => null))
  )

  const tickets = fiches
    .map((f, i) => {
      const qr = qrUrls[i]
      return `
      <div class="wj-ticket">
        <div style="text-align:center;font-weight:bold;font-size:${fs + 2}pt;">${esc(settings.header || 'WJ EVENTOS')}</div>
        ${settings.eventName ? `<div style="text-align:center;font-weight:bold;font-size:${fs + 1}pt;">${esc(settings.eventName)}</div>` : ''}
        <div style="text-align:center;">- - - - - - - - - -</div>
        <div style="text-align:center;font-weight:bold;font-size:${fs + 8}pt;margin:4pt 0;">${esc(f.productName)}</div>
        <div style="text-align:center;font-size:${fs + 2}pt;">${esc(brl(f.price))}</div>
        <div style="text-align:center;font-weight:bold;font-size:${fs + 4}pt;margin:4pt 0;">FICHA Nº ${esc(f.number)}</div>
        ${qr ? `<div style="text-align:center;"><img src="${qr}" style="width:32mm;height:32mm;" /></div>` : ''}
        <div style="text-align:center;font-size:${fs - 1}pt;">${esc(dateStr)}</div>
        <div style="text-align:center;font-size:${fs - 1}pt;">${esc(f.paymentLabel)} • ${esc(f.operatorName)}</div>
        <div style="text-align:center;">- - - - - - - - - -</div>
        <div style="text-align:center;font-size:${fs - 1}pt;">${esc(settings.footer)}</div>
      </div>`
    })
    .join('')

  let area = document.getElementById('wj-print-area')
  if (!area) {
    area = document.createElement('div')
    area.id = 'wj-print-area'
    document.body.appendChild(area)
  }
  area.innerHTML = `<style>@page { size: ${width} auto; margin: 0; }</style>` + tickets

  window.print()
}
