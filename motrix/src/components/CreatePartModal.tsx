import { useEffect, useRef, useState, type KeyboardEvent, type SubmitEvent } from 'react'
import type {
  Axle,
  BodyType,
  Part,
  PartCondition,
  PartStatus,
  Side,
} from '../types/part.ts'

const NEW_CATEGORY_VALUE = '__nova__'
const MIN_YEAR = 1950
const MAX_YEAR = new Date().getFullYear() + 1

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: '2-portas', label: '2 portas' },
  { value: '4-portas', label: '4 portas' },
  { value: 'hatch', label: 'Hatch' },
  { value: 'seda', label: 'Sedã' },
]

const AXLES: { value: Axle | ''; label: string }[] = [
  { value: 'dianteira', label: 'Dianteira' },
  { value: 'traseira', label: 'Traseira' },
  { value: '', label: 'Não se aplica' },
]

const SIDES: { value: Side | ''; label: string }[] = [
  { value: 'esquerdo', label: 'Esquerdo (motorista)' },
  { value: 'direito', label: 'Direito (passageiro)' },
  { value: '', label: 'Não se aplica' },
]

const CONDITIONS: { value: PartCondition; label: string; tag: string }[] = [
  { value: 'nova', label: 'Nova', tag: 'nova' },
  { value: 'usada-boa', label: 'Usada (boa)', tag: 'usada' },
  { value: 'usada-com-avaria', label: 'Usada com avaria', tag: 'com-avaria' },
  { value: 'para-recuperar', label: 'Para recuperar', tag: 'precisa-reparo' },
]

const STATUSES: { value: PartStatus; label: string; tag: string }[] = [
  { value: 'disponivel', label: 'Disponível', tag: 'a-venda' },
  { value: 'reservada', label: 'Reservada', tag: 'reservada' },
  { value: 'vendida', label: 'Vendida', tag: 'vendida' },
  { value: 'uso-proprio', label: 'Uso próprio', tag: 'uso-proprio' },
]

/** Sugestões para tags que não saem automaticamente dos campos do formulário. */
const TAG_SUGGESTIONS = [
  'situacao:completa',
  'situacao:incompleta',
  'situacao:original',
  'situacao:paralela',
  'condicao:precisa-pintar',
  'condicao:precisa-reparo',
  'condicao:sucata',
  'categoria:vidros',
  'categoria:acabamento-interno',
  'categoria:mecanica',
  'categoria:suspensao',
]

const labelClassName = 'block mb-2.5 text-sm font-medium text-heading'
const inputClassName =
  'block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-strong text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body'
const fieldsetClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2'
const legendClassName = 'mb-4 text-base font-semibold text-heading'
const radioClassName =
  'w-4 h-4 text-brand bg-neutral-secondary-medium border-default-strong focus:ring-brand focus:ring-2 cursor-pointer'
const secondaryButtonClassName =
  'inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-strong hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer'
const primaryButtonClassName =
  'inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer'

interface FormState {
  name: string
  category: string
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

const INITIAL_FORM: FormState = {
  name: '',
  category: '',
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
function slugify(value: string) {
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

function buildAutoTags(form: FormState) {
  const tags: string[] = []
  const push = (type: string, value: string) => {
    const slug = slugify(value)
    if (slug) tags.push(`${type}:${slug}`)
  }

  push('categoria', form.category)
  if (form.axle) push('posicao', form.axle === 'dianteira' ? 'dianteiro' : 'traseiro')
  if (form.side) push('posicao', form.side === 'esquerdo' ? 'lado-esquerdo' : 'lado-direito')
  push('marca', form.brand)
  push('modelo', `${form.model} ${form.version}`)
  push('condicao', CONDITIONS.find((c) => c.value === form.condition)?.tag ?? '')
  push('destino', STATUSES.find((s) => s.value === form.status)?.tag ?? '')
  push('cor', form.color)
  return tags
}

interface CreatePartModalProps {
  open: boolean
  categories: string[]
  onAddCategory: (category: string) => void
  onClose: () => void
  onCreate: (part: Part) => void
}

export default function CreatePartModal({
  open,
  categories,
  onAddCategory,
  onClose,
  onCreate,
}: CreatePartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [manualTags, setManualTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      nameInputRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Trava a rolagem da página atrás do modal enquanto ele estiver aberto.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const { overflow, paddingRight } = root.style
    // Compensa a largura da barra de rolagem da página para o conteúdo não "pular".
    const scrollbarWidth = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (scrollbarWidth > 0) root.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      root.style.overflow = overflow
      root.style.paddingRight = paddingRight
    }
  }, [open])

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setIsAddingCategory(true)
      update('category', '')
      return
    }
    setIsAddingCategory(false)
    update('category', value)
  }

  function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    const existing = categories.find((c) => c.toLowerCase() === name.toLowerCase())
    if (!existing) onAddCategory(name)
    update('category', existing ?? name)
    setNewCategory('')
    setIsAddingCategory(false)
  }

  function addTag() {
    const [type = '', ...rest] = tagInput.split(':')
    const tag = `${slugify(type)}:${slugify(rest.join(' '))}`
    if (!slugify(type) || !slugify(rest.join(' '))) {
      setTagError('Use o formato tipo:valor (ex.: situacao:completa).')
      return
    }
    setManualTags((current) => (current.includes(tag) ? current : [...current, tag]))
    setTagInput('')
    setTagError('')
  }

  /** Enter em campos auxiliares adiciona o item em vez de enviar o formulário. */
  function onEnter(action: () => void) {
    return (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      action()
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM)
    setIsAddingCategory(false)
    setNewCategory('')
    setManualTags([])
    setTagInput('')
    setTagError('')
    setError('')
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.category) {
      setError('Selecione ou adicione uma categoria.')
      return
    }

    const yearStart = toOptionalNumber(form.yearStart)
    const yearEnd = toOptionalNumber(form.yearEnd)
    if (yearStart !== undefined && yearEnd !== undefined && yearEnd < yearStart) {
      setError('O ano final não pode ser menor que o ano inicial.')
      return
    }

    const autoTags = buildAutoTags(form)
    onCreate({
      name: form.name.trim(),
      category: form.category,
      oemNumber: toOptionalText(form.oemNumber),
      compatibility: {
        brand: form.brand.trim(),
        model: form.model.trim(),
        version: toOptionalText(form.version),
        yearStart,
        yearEnd,
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
    })
    resetForm()
    onClose()
  }

  const autoTags = buildAutoTags(form)
  const requiresDamageDescription =
    form.condition === 'usada-com-avaria' || form.condition === 'para-recuperar'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="create-part-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90svh] overflow-hidden open:flex open:flex-col p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default-strong px-4 py-4 sm:px-6">
          <h2 id="create-part-title" className="m-0 text-xl font-semibold text-heading">
            Criar peça
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex items-center justify-center w-9 h-9 text-body hover:bg-neutral-tertiary-medium hover:text-heading rounded-base cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <fieldset>
            <legend className={legendClassName}>Identificação</legend>
            <div className={fieldsetClassName}>
              <div className="sm:col-span-2">
                <label htmlFor="part-name" className={labelClassName}>
                  Nome
                </label>
                <input
                  ref={nameInputRef}
                  id="part-name"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: Porta, Para-choque, Maçaneta externa"
                />
              </div>

              <div>
                <label htmlFor="part-category" className={labelClassName}>
                  Categoria
                </label>
                <select
                  id="part-category"
                  required={!isAddingCategory}
                  value={isAddingCategory ? NEW_CATEGORY_VALUE : form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={inputClassName}
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY_VALUE}>+ Nova categoria</option>
                </select>
                {isAddingCategory && (
                  <div className="mt-2 flex gap-2">
                    <label htmlFor="part-new-category" className="sr-only">
                      Nome da nova categoria
                    </label>
                    <input
                      id="part-new-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={onEnter(addCategory)}
                      className={`${inputClassName} min-w-0`}
                      placeholder="Ex.: Vidros"
                    />
                    <button type="button" onClick={addCategory} className={`${secondaryButtonClassName} shrink-0`}>
                      Adicionar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="part-oem" className={labelClassName}>
                  Número original (OEM) <span className="font-normal text-body">— opcional</span>
                </label>
                <input
                  id="part-oem"
                  value={form.oemNumber}
                  onChange={(e) => update('oemNumber', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: 5U4831055"
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClassName}>Compatibilidade</legend>
            <div className={fieldsetClassName}>
              <div>
                <label htmlFor="part-brand" className={labelClassName}>
                  Marca
                </label>
                <input
                  id="part-brand"
                  required
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: VW"
                />
              </div>
              <div>
                <label htmlFor="part-model" className={labelClassName}>
                  Modelo
                </label>
                <input
                  id="part-model"
                  required
                  value={form.model}
                  onChange={(e) => update('model', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: Gol"
                />
              </div>
              <div>
                <label htmlFor="part-version" className={labelClassName}>
                  Versão
                </label>
                <input
                  id="part-version"
                  value={form.version}
                  onChange={(e) => update('version', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: G5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="part-year-start" className={labelClassName}>
                    Ano inicial
                  </label>
                  <input
                    id="part-year-start"
                    type="number"
                    inputMode="numeric"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={form.yearStart}
                    onChange={(e) => update('yearStart', e.target.value)}
                    className={inputClassName}
                    placeholder="2008"
                  />
                </div>
                <div>
                  <label htmlFor="part-year-end" className={labelClassName}>
                    Ano final
                  </label>
                  <input
                    id="part-year-end"
                    type="number"
                    inputMode="numeric"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={form.yearEnd}
                    onChange={(e) => update('yearEnd', e.target.value)}
                    className={inputClassName}
                    placeholder="2012"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="part-body-type" className={labelClassName}>
                  Tipo de carroceria
                </label>
                <select
                  id="part-body-type"
                  value={form.bodyType}
                  onChange={(e) => update('bodyType', e.target.value as BodyType | '')}
                  className={inputClassName}
                >
                  <option value="">Não se aplica</option>
                  {BODY_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className={labelClassName}>Posição</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {AXLES.map((item) => (
                    <label key={item.label} className="inline-flex items-center gap-2 text-sm text-heading cursor-pointer">
                      <input
                        type="radio"
                        name="part-axle"
                        value={item.value}
                        checked={form.axle === item.value}
                        onChange={() => update('axle', item.value)}
                        className={radioClassName}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className={labelClassName}>Lado</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {SIDES.map((item) => (
                    <label key={item.label} className="inline-flex items-center gap-2 text-sm text-heading cursor-pointer">
                      <input
                        type="radio"
                        name="part-side"
                        value={item.value}
                        checked={form.side === item.value}
                        onChange={() => update('side', item.value)}
                        className={radioClassName}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClassName}>Estado</legend>
            <div className={fieldsetClassName}>
              <div>
                <label htmlFor="part-condition" className={labelClassName}>
                  Condição
                </label>
                <select
                  id="part-condition"
                  required
                  value={form.condition}
                  onChange={(e) => update('condition', e.target.value as PartCondition)}
                  className={inputClassName}
                >
                  {CONDITIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="part-color" className={labelClassName}>
                  Cor
                </label>
                <input
                  id="part-color"
                  value={form.color}
                  onChange={(e) => update('color', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: Prata ou código da tinta"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="part-damage" className={labelClassName}>
                  Descrição das avarias
                  {!requiresDamageDescription && (
                    <span className="font-normal text-body"> — opcional</span>
                  )}
                </label>
                <textarea
                  id="part-damage"
                  rows={3}
                  required={requiresDamageDescription}
                  value={form.damageDescription}
                  onChange={(e) => update('damageDescription', e.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: amassado na parte inferior, risco, suporte quebrado, trinca"
                />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClassName}>Valor</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="part-cost" className={labelClassName}>
                  Valor (custo)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-sm text-body pointer-events-none">
                    R$
                  </span>
                  <input
                    id="part-cost"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => update('cost', e.target.value)}
                    className={`${inputClassName} ps-10`}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="part-sale-price" className={labelClassName}>
                  Valor de venda
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-sm text-body pointer-events-none">
                    R$
                  </span>
                  <input
                    id="part-sale-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => update('salePrice', e.target.value)}
                    className={`${inputClassName} ps-10`}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="part-status" className={labelClassName}>
                  Status
                </label>
                <select
                  id="part-status"
                  required
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as PartStatus)}
                  className={inputClassName}
                >
                  {STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className={legendClassName}>Tags</legend>
            <p className="mb-3 text-sm text-body">
              Geradas a partir dos campos acima. Adicione outras no formato{' '}
              <span className="text-heading">tipo:valor</span>.
            </p>
            <ul className="mb-3 flex flex-wrap gap-2" aria-label="Tags da peça">
              {autoTags.map((tag) => (
                <li
                  key={`auto-${tag}`}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-body bg-neutral-secondary-medium border border-default-strong rounded-base"
                >
                  {tag}
                </li>
              ))}
              {manualTags.map((tag) => (
                <li
                  key={`manual-${tag}`}
                  className="inline-flex items-center gap-1 ps-2.5 pe-1 py-1 text-xs font-medium text-heading bg-brand-softer border border-brand-subtle rounded-base"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setManualTags((current) => current.filter((t) => t !== tag))}
                    aria-label={`Remover tag ${tag}`}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-sm hover:bg-neutral-tertiary-medium cursor-pointer"
                  >
                    <svg
                      className="w-3 h-3"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18 17.94 6M18 18 6.06 6"
                      />
                    </svg>
                  </button>
                </li>
              ))}
              {autoTags.length === 0 && manualTags.length === 0 && (
                <li className="text-sm text-body">Nenhuma tag ainda.</li>
              )}
            </ul>
            <div className="flex gap-2">
              <label htmlFor="part-tag" className="sr-only">
                Nova tag
              </label>
              <input
                id="part-tag"
                list="part-tag-suggestions"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setTagError('')
                }}
                onKeyDown={onEnter(addTag)}
                aria-invalid={tagError ? true : undefined}
                aria-describedby={tagError ? 'part-tag-error' : undefined}
                className={`${inputClassName} min-w-0`}
                placeholder="Ex.: situacao:completa"
              />
              <datalist id="part-tag-suggestions">
                {TAG_SUGGESTIONS.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <button type="button" onClick={addTag} className={`${secondaryButtonClassName} shrink-0`}>
                Adicionar
              </button>
            </div>
            {tagError && (
              <p id="part-tag-error" role="alert" className="mt-2 text-sm font-medium text-red-400">
                {tagError}
              </p>
            )}
          </fieldset>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-default-strong px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {error && (
            <p role="alert" className="text-sm font-medium text-red-400 sm:me-auto">
              {error}
            </p>
          )}
          <button type="button" onClick={onClose} className={secondaryButtonClassName}>
            Cancelar
          </button>
          <button type="submit" className={primaryButtonClassName}>
            Criar peça
          </button>
        </div>
      </form>
    </dialog>
  )
}
