import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SubmitEvent,
  type SyntheticEvent,
} from 'react'
import type { Category, Part } from '../types/part.ts'
import {
  formFromPart,
  manualTagsFromPart,
  partFromForm,
  validatePartForm,
  type FormState,
} from '../lib/partForm.ts'
import PartFormFields, {
  dangerButtonClassName,
  dialogAnimationClassName,
  dialogContentAnimationClassName,
  legendClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './PartFormFields.tsx'

interface PartModalProps {
  /** Peça aberta; null mantém o modal fechado. */
  part: Part | null
  categories: Category[]
  /** Cria a categoria no banco e devolve a linha criada. */
  onAddCategory: (name: string) => Promise<Category>
  onClose: () => void
  /** Salva as alterações no banco; deve lançar erro se falhar. */
  onSave: (id: string, part: Part) => Promise<void>
  /** Exclui a peça do banco; deve lançar erro se falhar. */
  onDelete: (id: string) => Promise<void>
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatDate(value?: string) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function CloseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
    </svg>
  )
}

/** Bloco com título no mesmo estilo dos fieldsets do formulário. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={legendClassName}>{title}</h3>
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
          <img src={url} alt={`${part.name} — foto ${index + 1}`} className="h-full w-full object-cover" />
        </li>
      ))}
    </ul>
  )
}

/** Dados preenchidos pelo banco, que não podem ser editados. */
function PartRecord({ part }: { part: Part }) {
  const rows: [string, string][] = [
    ['Cadastrada em', formatDate(part.createdAt)],
    ['Última atualização', formatDate(part.updatedAt)],
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

interface PartEditorProps extends Omit<PartModalProps, 'part'> {
  part: Part & { id: string }
}

/** Conteúdo do modal; montado com key={part.id}, então o formulário recomeça a cada peça aberta. */
function PartEditor({ part, categories, onAddCategory, onClose, onSave, onDelete }: PartEditorProps) {
  const confirmRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<FormState>(() => formFromPart(part))
  const [manualTags, setManualTags] = useState(() => manualTagsFromPart(part))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving || isDeleting) return

    const validationError = validatePartForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? part.category
    setIsSaving(true)
    try {
      await onSave(part.id, partFromForm(form, categoryName, manualTags))
    } catch (err) {
      setError(`Não foi possível salvar as alterações: ${(err as Error).message}`)
      setIsSaving(false)
      return
    }
    onClose()
  }

  function openConfirm() {
    setDeleteError('')
    confirmRef.current?.showModal()
  }

  function closeConfirm() {
    if (!isDeleting) confirmRef.current?.close()
  }

  async function handleDelete() {
    if (isDeleting) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await onDelete(part.id)
    } catch (err) {
      setDeleteError(`Não foi possível excluir a peça: ${(err as Error).message}`)
      setIsDeleting(false)
      return
    }
    confirmRef.current?.close()
    onClose()
  }

  // Esc no popup de confirmação fecha só ele (e não durante a exclusão).
  function handleConfirmCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (isDeleting) event.preventDefault()
  }

  function handleConfirmBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeConfirm()
  }

  const isBusy = isSaving || isDeleting

  return (
    <>
      <form className={`flex min-h-0 flex-1 flex-col ${dialogContentAnimationClassName}`} onSubmit={handleSubmit}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-default-strong px-4 py-4 sm:px-6">
          <h2 id="part-modal-title" className="m-0 min-w-0 truncate text-xl font-semibold text-heading">
            {part.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex shrink-0 items-center justify-center w-9 h-9 text-body hover:bg-neutral-tertiary-medium hover:text-heading focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-tertiary rounded-base cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Section title="Fotos">
            <PartPhotos part={part} />
          </Section>

          <PartFormFields
            idPrefix="edit-part"
            form={form}
            onChange={update}
            categories={categories}
            onAddCategory={onAddCategory}
            manualTags={manualTags}
            onManualTagsChange={setManualTags}
            onError={setError}
          />

          <Section title="Registro">
            <PartRecord part={part} />
          </Section>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-default-strong px-4 py-4 sm:px-6">
          {error && (
            <p role="alert" className="m-0 text-sm font-medium text-red-400">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={openConfirm}
              disabled={isBusy}
              aria-haspopup="dialog"
              className={`${dangerButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Excluir
            </button>
            <button
              type="submit"
              disabled={isBusy}
              aria-busy={isSaving}
              className={`${primaryButtonClassName} disabled:cursor-wait disabled:opacity-80`}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      <dialog
        ref={confirmRef}
        role="alertdialog"
        aria-labelledby="delete-part-title"
        aria-describedby="delete-part-description"
        onCancel={handleConfirmCancel}
        onClick={handleConfirmBackdropClick}
        className={`m-auto w-[calc(100%-2rem)] max-w-md p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60 ${dialogAnimationClassName}`}
      >
        <div className={`flex flex-col items-center gap-4 px-6 py-6 text-center ${dialogContentAnimationClassName}`}>
          <svg
            className="w-12 h-12 text-red-400"
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
              d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <h3 id="delete-part-title" className="m-0 text-lg font-semibold text-heading">
            Excluir “{part.name}”?
          </h3>
          <p id="delete-part-description" className="m-0 text-sm text-body">
            Tem certeza de que deseja executar esta ação? A peça e suas fotos serão apagadas
            permanentemente e isso <strong className="text-heading">não poderá ser revertido</strong>.
          </p>
          {deleteError && (
            <p role="alert" className="m-0 text-sm font-medium text-red-400">
              {deleteError}
            </p>
          )}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={closeConfirm}
              disabled={isDeleting}
              autoFocus
              className={`${secondaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
              className={`${dangerButtonClassName} disabled:cursor-wait disabled:opacity-80`}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}

export default function PartModal({ part, ...props }: PartModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = part !== null
  // Mantém a última peça na tela enquanto a animação de fechamento roda (part já virou null).
  // A cada nova abertura o session muda e o editor remonta, descartando edições não salvas.
  const [prevPart, setPrevPart] = useState(part)
  const [shownPart, setShownPart] = useState(part)
  const [session, setSession] = useState(0)
  if (part !== prevPart) {
    setPrevPart(part)
    if (part) {
      setShownPart(part)
      if (!prevPart) setSession((current) => current + 1)
    }
  }

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

  // O React propaga o close do popup de confirmação (que fica dentro deste dialog) até aqui;
  // só o close do próprio modal deve fechá-lo.
  function handleClose(event: SyntheticEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) props.onClose()
  }

  // O conteúdo preenche o <dialog>, então um clique cujo alvo é o próprio dialog veio do backdrop.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) props.onClose()
  }

  return (
    // ESC dispara o evento close nativo do <dialog>, que chama onClose.
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdropClick}
      aria-labelledby="part-modal-title"
      className={`m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90svh] overflow-hidden open:flex open:flex-col p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60 ${dialogAnimationClassName}`}
    >
      {shownPart?.id && (
        <PartEditor key={`${session}-${shownPart.id}`} part={{ ...shownPart, id: shownPart.id }} {...props} />
      )}
    </dialog>
  )
}
