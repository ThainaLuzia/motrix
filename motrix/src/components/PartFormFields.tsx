import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import type { Axle, BodyType, Category, Side } from '../types/part.ts'
import { buildAutoTags, CONDITIONS, slugify, STATUSES, type FormState } from '../lib/partForm.ts'

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

export const labelClassName = 'block mb-2.5 text-sm font-medium text-heading'
export const inputClassName =
  'block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-strong text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body'
const fieldsetClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2'
export const legendClassName = 'mb-4 text-base font-semibold text-heading'
// Radio customizado: o <input> fica sr-only (continua acessível e navegável pelo teclado) e o círculo
// visível é o <span> irmão, estilizado via peer-checked / peer-focus-visible.
const radioLabelClassName = 'relative inline-flex items-center gap-3 text-sm text-body cursor-pointer'
const radioInputClassName = 'peer sr-only'
const radioCircleClassName =
  'grid size-6 shrink-0 place-items-center rounded-full border-2 border-default-strong bg-neutral-secondary-medium transition-colors duration-200 after:size-full after:scale-0 after:rounded-full after:bg-brand after:transition-transform after:duration-300 after:ease-[cubic-bezier(.34,1.9,.64,1)] peer-checked:border-brand peer-checked:after:scale-100 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-medium motion-reduce:transition-none motion-reduce:after:transition-none'
const radioTextClassName = 'transition-colors peer-checked:font-medium peer-checked:text-heading'
export const secondaryButtonClassName =
  'inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-strong hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer'
export const primaryButtonClassName =
  'inline-flex items-center justify-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer'
export const dangerButtonClassName =
  'inline-flex items-center justify-center text-white bg-red-600 hover:bg-red-700 box-border border border-transparent focus:ring-4 focus:ring-red-500/40 shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer'
const dropdownButtonClassName =
  'flex w-full items-center justify-between gap-2 px-3 py-2.5 bg-neutral-secondary-medium border border-default-strong text-sm text-start rounded-base shadow-xs hover:bg-neutral-tertiary-medium focus:ring-4 focus:ring-brand-medium focus:border-brand focus:outline-none cursor-pointer'
const dropdownItemClassName =
  'inline-flex items-center w-full p-2 text-start hover:bg-neutral-tertiary-medium hover:text-heading rounded cursor-pointer'

interface DropdownOption<T extends string> {
  value: T
  label: string
}

interface DropdownProps<T extends string> {
  id: string
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
}

/** Dropdown no modelo do Flowbite, controlado pelo React (mesmo padrão do Dashboard). */
function Dropdown<T extends string>({ id, value, options, onChange, placeholder }: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = `${id}-menu`
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function close() {
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  function select(option: T) {
    onChange(option)
    close()
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        // Esc fecha só o dropdown, sem fechar o modal.
        if (event.key === 'Escape' && isOpen) {
          event.preventDefault()
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={dropdownButtonClassName}
      >
        <span className={`truncate ${selected ? 'text-heading' : 'text-body'}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className="w-4 h-4 shrink-0 -me-0.5 text-body"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          id={menuId}
          className="absolute start-0 top-full mt-1 z-20 w-full min-w-44 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg"
        >
          <ul role="listbox" aria-labelledby={id} className="max-h-60 overflow-y-auto p-2 text-sm text-body font-medium">
            {options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => select(option.value)}
                  className={`${dropdownItemClassName} ${option.value === value ? 'text-heading' : ''}`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Enter em campos auxiliares adiciona o item em vez de enviar o formulário. */
function onEnter(action: () => void) {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    action()
  }
}

interface PartFormFieldsProps {
  /** Prefixo dos ids dos campos; precisa ser único porque os dois modais ficam montados juntos. */
  idPrefix: string
  form: FormState
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void
  categories: Category[]
  /** Cria a categoria no banco e devolve a linha criada. */
  onAddCategory: (name: string) => Promise<Category>
  manualTags: string[]
  onManualTagsChange: (tags: string[]) => void
  /** Mostra um erro no rodapé do modal (ex.: falha ao criar categoria). */
  onError: (message: string) => void
  nameInputRef?: Ref<HTMLInputElement>
}

/** Campos da peça (identificação, compatibilidade, estado, valor e tags), usados ao criar e ao editar. */
export default function PartFormFields({
  idPrefix,
  form,
  onChange: update,
  categories,
  onAddCategory,
  manualTags,
  onManualTagsChange,
  onError,
  nameInputRef,
}: PartFormFieldsProps) {
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState('')
  const id = (name: string) => `${idPrefix}-${name}`

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_VALUE) {
      setIsAddingCategory(true)
      update('categoryId', '')
      return
    }
    setIsAddingCategory(false)
    update('categoryId', value)
  }

  async function addCategory() {
    const name = newCategory.trim()
    if (!name || isSavingCategory) return
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      update('categoryId', existing.id)
    } else {
      setIsSavingCategory(true)
      try {
        const created = await onAddCategory(name)
        update('categoryId', created.id)
      } catch (err) {
        onError(`Não foi possível criar a categoria: ${(err as Error).message}`)
        return
      } finally {
        setIsSavingCategory(false)
      }
    }
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
    if (!manualTags.includes(tag)) onManualTagsChange([...manualTags, tag])
    setTagInput('')
    setTagError('')
  }

  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? ''
  const autoTags = buildAutoTags(form, categoryName)
  const requiresDamageDescription =
    form.condition === 'usada-com-avaria' || form.condition === 'para-recuperar'

  return (
    <>
      <fieldset>
        <legend className={legendClassName}>Identificação</legend>
        <div className={fieldsetClassName}>
          <div className="sm:col-span-2">
            <label htmlFor={id('name')} className={labelClassName}>
              Nome
            </label>
            <input
              ref={nameInputRef}
              id={id('name')}
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClassName}
              placeholder="Ex.: Porta, Para-choque, Maçaneta externa"
            />
          </div>

          <div>
            <label htmlFor={id('category')} className={labelClassName}>
              Categoria
            </label>
            <Dropdown
              id={id('category')}
              value={isAddingCategory ? NEW_CATEGORY_VALUE : form.categoryId}
              onChange={handleCategoryChange}
              placeholder="Selecione..."
              options={[
                ...categories.map((item) => ({ value: item.id, label: item.name })),
                { value: NEW_CATEGORY_VALUE, label: '+ Nova categoria' },
              ]}
            />
            {isAddingCategory && (
              <div className="mt-2 flex gap-2">
                <label htmlFor={id('new-category')} className="sr-only">
                  Nome da nova categoria
                </label>
                <input
                  id={id('new-category')}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={onEnter(addCategory)}
                  className={`${inputClassName} min-w-0`}
                  placeholder="Ex.: Vidros"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={isSavingCategory}
                  aria-busy={isSavingCategory}
                  className={`${secondaryButtonClassName} shrink-0 disabled:cursor-wait disabled:opacity-80`}
                >
                  {isSavingCategory ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={id('oem')} className={labelClassName}>
              Número original (OEM) <span className="font-normal text-body">— opcional</span>
            </label>
            <input
              id={id('oem')}
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
            <label htmlFor={id('brand')} className={labelClassName}>
              Marca
            </label>
            <input
              id={id('brand')}
              required
              value={form.brand}
              onChange={(e) => update('brand', e.target.value)}
              className={inputClassName}
              placeholder="Ex.: VW"
            />
          </div>
          <div>
            <label htmlFor={id('model')} className={labelClassName}>
              Modelo
            </label>
            <input
              id={id('model')}
              required
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              className={inputClassName}
              placeholder="Ex.: Gol"
            />
          </div>
          <div>
            <label htmlFor={id('version')} className={labelClassName}>
              Versão
            </label>
            <input
              id={id('version')}
              value={form.version}
              onChange={(e) => update('version', e.target.value)}
              className={inputClassName}
              placeholder="Ex.: G5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={id('year-start')} className={labelClassName}>
                Ano inicial
              </label>
              <input
                id={id('year-start')}
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
              <label htmlFor={id('year-end')} className={labelClassName}>
                Ano final
              </label>
              <input
                id={id('year-end')}
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
            <label htmlFor={id('body-type')} className={labelClassName}>
              Tipo de carroceria
            </label>
            <Dropdown<BodyType | ''>
              id={id('body-type')}
              value={form.bodyType}
              onChange={(value) => update('bodyType', value)}
              options={[{ value: '', label: 'Não se aplica' }, ...BODY_TYPES]}
            />
          </div>

          <fieldset>
            <legend className={labelClassName}>Posição</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {AXLES.map((item) => (
                <label key={item.label} className={radioLabelClassName}>
                  <input
                    type="radio"
                    name={id('axle')}
                    value={item.value}
                    checked={form.axle === item.value}
                    onChange={() => update('axle', item.value)}
                    className={radioInputClassName}
                  />
                  <span aria-hidden="true" className={radioCircleClassName} />
                  <span className={radioTextClassName}>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={labelClassName}>Lado</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {SIDES.map((item) => (
                <label key={item.label} className={radioLabelClassName}>
                  <input
                    type="radio"
                    name={id('side')}
                    value={item.value}
                    checked={form.side === item.value}
                    onChange={() => update('side', item.value)}
                    className={radioInputClassName}
                  />
                  <span aria-hidden="true" className={radioCircleClassName} />
                  <span className={radioTextClassName}>{item.label}</span>
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
            <label htmlFor={id('condition')} className={labelClassName}>
              Condição
            </label>
            <Dropdown
              id={id('condition')}
              value={form.condition}
              onChange={(value) => update('condition', value)}
              options={CONDITIONS}
            />
          </div>
          <div>
            <label htmlFor={id('color')} className={labelClassName}>
              Cor
            </label>
            <input
              id={id('color')}
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className={inputClassName}
              placeholder="Ex.: Prata ou código da tinta"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={id('damage')} className={labelClassName}>
              Descrição das avarias
              {!requiresDamageDescription && <span className="font-normal text-body"> — opcional</span>}
            </label>
            <textarea
              id={id('damage')}
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
            <label htmlFor={id('cost')} className={labelClassName}>
              Valor (custo)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-sm text-body pointer-events-none">
                R$
              </span>
              <input
                id={id('cost')}
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
            <label htmlFor={id('sale-price')} className={labelClassName}>
              Valor de venda
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-sm text-body pointer-events-none">
                R$
              </span>
              <input
                id={id('sale-price')}
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
            <label htmlFor={id('status')} className={labelClassName}>
              Status
            </label>
            <Dropdown
              id={id('status')}
              value={form.status}
              onChange={(value) => update('status', value)}
              options={STATUSES}
            />
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
                onClick={() => onManualTagsChange(manualTags.filter((t) => t !== tag))}
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
          <label htmlFor={id('tag')} className="sr-only">
            Nova tag
          </label>
          <input
            id={id('tag')}
            list={id('tag-suggestions')}
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value)
              setTagError('')
            }}
            onKeyDown={onEnter(addTag)}
            aria-invalid={tagError ? true : undefined}
            aria-describedby={tagError ? id('tag-error') : undefined}
            className={`${inputClassName} min-w-0`}
            placeholder="Ex.: situacao:completa"
          />
          <datalist id={id('tag-suggestions')}>
            {TAG_SUGGESTIONS.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button type="button" onClick={addTag} className={`${secondaryButtonClassName} shrink-0`}>
            Adicionar
          </button>
        </div>
        {tagError && (
          <p id={id('tag-error')} role="alert" className="mt-2 text-sm font-medium text-red-400">
            {tagError}
          </p>
        )}
      </fieldset>
    </>
  )
}
