import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { AXLE_LABELS, formatPrice, SIDE_LABELS } from '../lib/partLabels.ts'
import type { Part } from '../types/part.ts'
import { StatusBadge } from './PartCard.tsx'

interface PartModalProps {
  /** Peça aberta; null mantém o modal fechado. */
  part: Part | null
  onClose: () => void
}

/** Bloco com título; cada seção do modal é um destes, então dá para acrescentar outras facilmente. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-body">{title}</h3>
      {children}
    </section>
  )
}

function PartPhotos({ part }: { part: Part }) {
  const urls = part.photoUrls ?? []
  if (urls.length === 0) return <p className="m-0 text-sm text-body">Nenhuma foto cadastrada.</p>
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {urls.map((url, index) => (
        <li key={url} className="aspect-[4/3] overflow-hidden rounded-base">
          <img
            src={url}
            alt={`${part.name} — foto ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </li>
      ))}
    </ul>
  )
}

function PartDetails({ part }: { part: Part }) {
  const { brand, model, axle, side } = part.compatibility
  const rows: [string, ReactNode][] = [
    ['Categoria', part.category || '—'],
    ['Marca', brand],
    ['Modelo', model],
    ['Cor', part.color ?? '—'],
    ['Eixo', axle ? AXLE_LABELS[axle] : '—'],
    ['Lado', side ? SIDE_LABELS[side] : '—'],
    ['Preço de venda', formatPrice(part.salePrice)],
    ['Status', <StatusBadge key="status" status={part.status} />],
  ]
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-body">{label}</dt>
          <dd className="m-0 text-sm font-medium text-heading">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function PartModal({ part, onClose }: PartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = part !== null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Trava a rolagem da página atrás do modal enquanto ele estiver aberto.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const { overflow, paddingRight } = root.style
    const scrollbarWidth = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (scrollbarWidth > 0) root.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      root.style.overflow = overflow
      root.style.paddingRight = paddingRight
    }
  }, [open])

  // O conteúdo preenche o <dialog>, então um clique cujo alvo é o próprio dialog veio do backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    // ESC dispara o evento close nativo do <dialog>, que chama onClose.
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="part-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90svh] overflow-hidden open:flex open:flex-col p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default-strong px-4 py-4 sm:px-6">
        <h2 id="part-modal-title" className="m-0 min-w-0 truncate text-xl font-semibold text-heading">
          {part?.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="inline-flex shrink-0 items-center justify-center w-9 h-9 text-body hover:bg-neutral-tertiary-medium hover:text-heading focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-tertiary rounded-base cursor-pointer"
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

      {/* TODO: conteúdo detalhado da peça será definido depois — basta acrescentar novas <Section>. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
        {part && (
          <>
            <Section title="Fotos">
              <PartPhotos part={part} />
            </Section>
            <Section title="Informações">
              <PartDetails part={part} />
            </Section>
          </>
        )}
      </div>
    </dialog>
  )
}
