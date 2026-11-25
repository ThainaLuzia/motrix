import { useEffect, useRef } from 'react'
import type { CategorySummary } from './CategoryCard.tsx'

interface CategoryModalProps {
  /** Categoria aberta; null mantém o modal fechado. */
  category: CategorySummary | null
  onClose: () => void
}

export default function CategoryModal({ category, onClose }: CategoryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = category !== null

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

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="category-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90svh] overflow-hidden open:flex open:flex-col p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default-strong px-4 py-4 sm:px-6">
        <h2 id="category-modal-title" className="m-0 min-w-0 truncate text-xl font-semibold text-heading">
          {category?.name}
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

      {/* TODO: conteúdo da categoria será estruturado depois. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6" />
    </dialog>
  )
}
