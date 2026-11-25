import type { Axle, PartStatus, Side } from '../types/part.ts'

/** Rótulo e cores do badge de cada status (tons legíveis no tema escuro). */
export const STATUS_BADGES: Record<PartStatus, { label: string; className: string }> = {
  disponivel: { label: 'Disponível', className: 'bg-green-500/15 text-green-400 ring-green-500/30' },
  reservada: { label: 'Reservada', className: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30' },
  vendida: { label: 'Vendida', className: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  'uso-proprio': { label: 'Uso próprio', className: 'bg-blue-500/15 text-blue-400 ring-blue-500/30' },
}

export const AXLE_LABELS: Record<Axle, string> = {
  dianteira: 'Dianteira',
  traseira: 'Traseira',
}

export const SIDE_LABELS: Record<Side, string> = {
  esquerdo: 'Esquerdo',
  direito: 'Direito',
}

const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatPrice(value?: number) {
  return value === undefined ? 'Sem preço' : priceFormatter.format(value)
}
