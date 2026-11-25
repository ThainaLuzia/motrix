export type BodyType = '2-portas' | '4-portas' | 'hatch' | 'seda'
export type Axle = 'dianteira' | 'traseira'
export type Side = 'esquerdo' | 'direito'
export type PartCondition = 'nova' | 'usada-boa' | 'usada-com-avaria' | 'para-recuperar'
export type PartStatus = 'disponivel' | 'reservada' | 'vendida' | 'uso-proprio'

export interface PartCompatibility {
  brand: string
  model: string
  version?: string
  yearStart?: number
  yearEnd?: number
  bodyType?: BodyType
  axle?: Axle
  side?: Side
}

/** Linha da tabela public.categorias. */
export interface Category {
  id: string
  name: string
}

export interface Part {
  /** Gerado pelo banco; ausente enquanto a peça ainda não foi salva. */
  id?: string
  name: string
  /** FK para categorias.id. */
  categoryId: string
  /** Nome da categoria (só para exibição). */
  category: string
  /** Número original (part number / OEM). Opcional. */
  oemNumber?: string
  compatibility: PartCompatibility
  condition: PartCondition
  damageDescription?: string
  color?: string
  /** Quanto a peça custou. */
  cost?: number
  /** Valor pelo qual se quer vender. */
  salePrice?: number
  status: PartStatus
  /** Tags no formato tipo:valor (ex.: categoria:lataria, posicao:lado-esquerdo). */
  tags: string[]
  /** Fotos da peça. Ainda não são enviadas ao Supabase (não há tabela/bucket para elas). */
  photos?: File[]
}
