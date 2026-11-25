import { useEffect, useRef, useState } from 'react'
import { STATUSES } from '../lib/partForm.ts'
import { AXLE_LABELS, formatPrice, SIDE_LABELS, STATUS_BADGES } from '../lib/partLabels.ts'
import type { Part, PartStatus } from '../types/part.ts'

const badgeClassName =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'
const dropdownItemClassName =
  'flex w-full items-center p-2 text-start hover:bg-neutral-tertiary-medium rounded cursor-pointer'


export const partRowGridClassName =
  'grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 md:grid-cols-[4rem_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_8rem] md:gap-x-4'
const cellClassName = 'col-span-2 m-0 truncate text-sm text-body md:col-span-1'

export function StatusBadge({ status }: { status: PartStatus }) {
  const badge = STATUS_BADGES[status]
  return <span className={`${badgeClassName} ${badge.className}`}>{badge.label}</span>
}

interface StatusDropdownProps {
  id: string
  status: PartStatus
  disabled?: boolean
  onChange: (status: PartStatus) => void
}


function StatusDropdown({ id, status, disabled, onChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = `${id}-menu`
  const badge = STATUS_BADGES[status]

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

  function select(option: PartStatus) {
    close()
    if (option !== status) onChange(option)
  }

  return (
    <div
      ref={containerRef}
      className="relative z-10 shrink-0"
      onKeyDown={(event) => {
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
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Status: ${badge.label}. Alterar status`}
        className={`${badgeClassName} ${badge.className} gap-1 cursor-pointer hover:brightness-125 focus:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60`}
      >
        {badge.label}
        <svg
          className="w-3 h-3 -me-1"
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
          className="absolute end-0 top-full mt-1 z-20 w-44 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg"
        >
          <ul role="listbox" aria-labelledby={id} className="p-2 text-sm text-body font-medium">
            {STATUSES.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === status}>
                <button type="button" onClick={() => select(option.value)} className={dropdownItemClassName}>
                  <StatusBadge status={option.value} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Placeholder neutro para peças sem foto. */
export function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-quaternary text-body">
      <svg
        className="w-8 h-8"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
        />
      </svg>
    </div>
  )
}

interface PartCardProps {
  part: Part
  onOpen: (part: Part) => void
  /** Salva o novo status no banco; se rejeitar, o card mostra o erro. */
  onStatusChange: (part: Part, status: PartStatus) => Promise<void>
}

export default function PartCard({ part, onOpen, onStatusChange }: PartCardProps) {
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const { brand, model, axle, side } = part.compatibility
  const cover = part.photoUrls?.[0]
  const position = [axle && AXLE_LABELS[axle], side && SIDE_LABELS[side]].filter(Boolean).join(' · ')

  async function handleStatusChange(status: PartStatus) {
    setIsSavingStatus(true)
    setStatusError('')
    try {
      await onStatusChange(part, status)
    } catch (err) {
      setStatusError(`Não foi possível alterar o status: ${(err as Error).message}`)
    } finally {
      setIsSavingStatus(false)
    }
  }

  return (
    // O card não pode ser um <button> porque tem o dropdown de status dentro (botão dentro de botão é inválido).
    // O botão do nome cobre o card todo com ::after (abre o modal); o dropdown fica acima dele (z-10).
    // has-[[aria-expanded=true]] sobe o card aberto para o menu não ficar atrás do card seguinte.
    // isolate prende o z-10 do badge dentro de cada card; sem ele o badge do card seguinte ficaria por cima do menu aberto.
    // No Tailwind v4, hover: só vale em dispositivos com hover real, então o efeito não fica preso após o toque.
    <div
      className={`${partRowGridClassName} relative isolate w-full px-3 py-2 text-start bg-neutral-secondary-medium border border-default-strong rounded-base shadow-xs select-none transition duration-200 ease-out hover:bg-neutral-tertiary-medium hover:shadow-lg hover:-translate-y-0.5 has-[[aria-expanded=true]]:z-10 motion-reduce:transition-none`}
    >
      <div className="row-span-5 size-16 self-start overflow-hidden rounded-base md:row-span-1 md:self-center">
        {cover ? (
          <img src={cover} alt={part.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>

      <h3 className="m-0 min-w-0 truncate text-lg font-bold text-heading md:text-xl">
        <button
          type="button"
          onClick={() => onOpen(part)}
          aria-haspopup="dialog"
          className="max-w-full truncate text-start cursor-pointer [-webkit-tap-highlight-color:transparent] focus:outline-none after:absolute after:inset-0 after:rounded-base focus-visible:after:ring-4 focus-visible:after:ring-brand-medium"
        >
          {part.name}
        </button>
      </h3>

      {/* Colunas vazias continuam renderizadas no md+ para não desalinhar a "tabela". */}
      <p className={`${cellClassName} ${part.category ? '' : 'hidden md:block'}`}>{part.category || '—'}</p>

      <p className={cellClassName}>
        {brand} {model}
        {part.color && ` · ${part.color}`}
      </p>

      <p className={`${cellClassName} ${position ? '' : 'hidden md:block'}`}>{position || '—'}</p>

      <p className="col-span-2 m-0 truncate text-base font-semibold text-heading tabular-nums md:col-span-1">
        {formatPrice(part.salePrice)}
      </p>

      <div className="col-start-3 row-start-1 flex justify-end self-start md:col-start-auto md:row-start-auto md:self-center">
        {part.id ? (
          <StatusDropdown
            id={`part-status-${part.id}`}
            status={part.status}
            disabled={isSavingStatus}
            onChange={handleStatusChange}
          />
        ) : (
          <StatusBadge status={part.status} />
        )}
      </div>

      {statusError && (
        <p role="alert" className="col-span-full m-0 mt-1 text-xs font-medium text-red-400">
          {statusError}
        </p>
      )}
    </div>
  )
}
