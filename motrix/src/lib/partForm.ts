import type { Axle, BodyType, Part, PartCondition, PartStatus, Side } from '../types/part.ts'

export const CONDITIONS: { value: PartCondition; label: string; tag: string }[] = [
  { value: 'nova', label: 'Nova', tag: 'nova' },
  { value: 'usada-boa', label: 'Usada (boa)', tag: 'usada' },
  { value: 'usada-com-avaria', label: 'Usada com avaria', tag: 'com-avaria' },
  { value: 'para-recuperar', label: 'Para recuperar', tag: 'precisa-reparo' },
]

export const STATUSES: { value: PartStatus; label: string; tag: string }[] = [
  { value: 'disponivel', label: 'Disponível', tag: 'a-venda' },
  { value: 'reservada', label: 'Reservada', tag: 'reservada' },
  { value: 'vendida', label: 'Vendida', tag: 'vendida' },
  { value: 'uso-proprio', label: 'Uso próprio', tag: 'uso-proprio' },
]

export interface FormState {
  name: string
  categoryId: string
  oemNumber: string
  brand: string
  model: string
  version: string
  yearStart: string
  yearEnd: string
  bodyType: BodyType | ''
  axle: Axle | ''
  side: Side | ''
  condition: PartCondition
  damageDescription: string
  color: string
  cost: string
  salePrice: string
  status: PartStatus
}

export const INITIAL_FORM: FormState = {
  name: '',
  categoryId: '',
  oemNumber: '',
  brand: '',
  model: '',
  version: '',
  yearStart: '',
  yearEnd: '',
  bodyType: '',
  axle: '',
  side: '',
  condition: 'nova',
  damageDescription: '',
  color: '',
  cost: '',
  salePrice: '',
  status: 'disponivel',
}

/** "Gol G5" -> "gol-g5", "Iluminação" -> "iluminacao" */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toOptionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value)
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function buildAutoTags(form: FormState, categoryName: string) {
  const tags: string[] = []
  const push = (type: string, value: string) => {
    const slug = slugify(value)
    if (slug) tags.push(`${type}:${slug}`)
  }

  push('categoria', categoryName)
  if (form.axle) push('posicao', form.axle === 'dianteira' ? 'dianteiro' : 'traseiro')
  if (form.side) push('posicao', form.side === 'esquerdo' ? 'lado-esquerdo' : 'lado-direito')
  push('marca', form.brand)
  push('modelo', `${form.model} ${form.version}`)
  push('condicao', CONDITIONS.find((c) => c.value === form.condition)?.tag ?? '')
  push('destino', STATUSES.find((s) => s.value === form.status)?.tag ?? '')
  push('cor', form.color)
  return tags
}

/** Preenche o formulário com os dados de uma peça já salva (para edição). */
export function formFromPart(part: Part): FormState {
  const c = part.compatibility
  const text = (value?: string | number) => (value === undefined ? '' : String(value))
  return {
    name: part.name,
    categoryId: part.categoryId,
    oemNumber: text(part.oemNumber),
    brand: c.brand,
    model: c.model,
    version: text(c.version),
    yearStart: text(c.yearStart),
    yearEnd: text(c.yearEnd),
    bodyType: c.bodyType ?? '',
    axle: c.axle ?? '',
    side: c.side ?? '',
    condition: part.condition,
    damageDescription: text(part.damageDescription),
    color: text(part.color),
    cost: text(part.cost),
    salePrice: text(part.salePrice),
    status: part.status,
  }
}

/**
 * Tags que o usuário adicionou à mão: as tags salvas menos as que seriam geradas
 * automaticamente pelos campos atuais. As automáticas são recalculadas ao salvar.
 */
export function manualTagsFromPart(part: Part) {
  const autoTags = new Set(buildAutoTags(formFromPart(part), part.category))
  return part.tags.filter((tag) => !autoTags.has(tag))
}

/** A mesma peça com outro status; as tags automáticas (destino:*) acompanham a mudança. */
export function partWithStatus(part: Part, status: PartStatus): Part {
  const form = { ...formFromPart(part), status }
  return { ...part, ...partFromForm(form, part.category, manualTagsFromPart(part)) }
}

/** Mensagem de erro se o formulário não puder ser salvo; null se estiver ok. */
export function validatePartForm(form: FormState) {
  if (!form.categoryId) return 'Selecione ou adicione uma categoria.'
  const yearStart = toOptionalNumber(form.yearStart)
  const yearEnd = toOptionalNumber(form.yearEnd)
  if (yearStart !== undefined && yearEnd !== undefined && yearEnd < yearStart) {
    return 'O ano final não pode ser menor que o ano inicial.'
  }
  return null
}

/** Monta a peça a partir do formulário (sem id e sem fotos). */
export function partFromForm(form: FormState, categoryName: string, manualTags: string[]): Part {
  const autoTags = buildAutoTags(form, categoryName)
  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    category: categoryName,
    oemNumber: toOptionalText(form.oemNumber),
    compatibility: {
      brand: form.brand.trim(),
      model: form.model.trim(),
      version: toOptionalText(form.version),
      yearStart: toOptionalNumber(form.yearStart),
      yearEnd: toOptionalNumber(form.yearEnd),
      bodyType: form.bodyType || undefined,
      axle: form.axle || undefined,
      side: form.side || undefined,
    },
    condition: form.condition,
    damageDescription: toOptionalText(form.damageDescription),
    color: toOptionalText(form.color),
    cost: toOptionalNumber(form.cost),
    salePrice: toOptionalNumber(form.salePrice),
    status: form.status,
    tags: [...new Set([...autoTags, ...manualTags])],
  }
}

