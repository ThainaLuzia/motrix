import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type SubmitEvent,
} from 'react'
import type { Category, Part } from '../types/part.ts'
import { isAllowedPhoto, PHOTO_MIME_TYPES } from '../services/parts.ts'
import { INITIAL_FORM, partFromForm, validatePartForm, type FormState } from '../lib/partForm.ts'
import PartFormFields, {
  dialogAnimationClassName,
  dialogContentAnimationClassName,
  legendClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from './PartFormFields.tsx'

interface PhotoItem {
  id: string
  file: File
  /** URL temporária (object URL) usada só para a pré-visualização. */
  url: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface CreatePartModalProps {
  open: boolean
  categories: Category[]
  /** Cria a categoria no banco e devolve a linha criada. */
  onAddCategory: (name: string) => Promise<Category>
  onClose: () => void
  /** Salva a peça no banco; deve lançar erro se falhar. */
  onCreate: (part: Part) => Promise<void>
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
  // Trocar a key remonta os campos e zera o estado interno deles (nova categoria, input de tag).
  const [fieldsKey, setFieldsKey] = useState(0)
  const [manualTags, setManualTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photosRef = useRef<PhotoItem[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  // Libera as URLs de pré-visualização quando o componente sai da tela.
  useEffect(() => {
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url))
  }, [])

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

  function addPhotos(files: FileList | null) {
    if (!files) return
    const selected = Array.from(files)
    const images = selected.filter(isAllowedPhoto)
    const rejected = selected.length - images.length
    setPhotoError(
      rejected > 0
        ? `${rejected} ${rejected === 1 ? 'arquivo ignorado' : 'arquivos ignorados'}: use PNG, JPG ou WEBP de até 5 MB.`
        : '',
    )
    if (images.length === 0) return
    setPhotos((current) => [
      ...current,
      ...images.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })),
    ])
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const photo = current.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.url)
      return current.filter((p) => p.id !== id)
    })
  }

  function handlePhotoInput(event: ChangeEvent<HTMLInputElement>) {
    addPhotos(event.target.files)
    // Permite selecionar o mesmo arquivo de novo depois de removê-lo.
    event.target.value = ''
  }

  function handlePhotoDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDraggingPhotos(false)
    addPhotos(event.dataTransfer.files)
  }

  function resetForm() {
    setForm(INITIAL_FORM)
    setFieldsKey((key) => key + 1)
    setManualTags([])
    setError('')
    photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    setPhotos([])
    setIsDraggingPhotos(false)
    setPhotoError('')
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const validationError = validatePartForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? ''
    const part: Part = {
      ...partFromForm(form, categoryName, manualTags),
      photos: photos.length > 0 ? photos.map((photo) => photo.file) : undefined,
    }

    setIsSubmitting(true)
    try {
      await onCreate(part)
    } catch (err) {
      setError(`Não foi possível salvar a peça: ${(err as Error).message}`)
      return
    } finally {
      setIsSubmitting(false)
    }
    resetForm()
    onClose()
  }

  /**
   * Área de envio de fotos. Sem fotos ela ocupa a largura toda; com fotos vira
   * um card do mesmo tamanho das fotos, logo depois delas.
   */
  function renderPhotoDropzone(compact: boolean) {
    return (
      <label
        htmlFor="part-photos"
        onDragOver={(event) => {
          event.preventDefault()
          setIsDraggingPhotos(true)
        }}
        onDragLeave={() => setIsDraggingPhotos(false)}
        onDrop={handlePhotoDrop}
        className={`flex flex-col items-center justify-center w-full border border-dashed rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${
          compact ? 'flex-1 min-h-40 px-3' : 'h-64'
        } ${
          isDraggingPhotos
            ? 'bg-neutral-tertiary-medium border-brand'
            : 'bg-neutral-secondary-medium border-default-strong'
        }`}
      >
        <div className={`flex flex-col items-center justify-center text-center text-body ${compact ? 'py-4' : 'pt-5 pb-6'}`}>
          <svg
            className={compact ? 'w-7 h-7 mb-2' : 'w-8 h-8 mb-4'}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
            />
          </svg>
          {compact ? (
            <>
              <p className="text-sm font-semibold">Adicionar fotos</p>
              <p className="mt-1 text-xs">Clique ou arraste</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm">
                <span className="font-semibold">Clique para enviar</span> ou arraste e solte
              </p>
              <p className="text-xs">PNG, JPG ou WEBP de até 5 MB — pode selecionar várias fotos</p>
            </>
          )}
        </div>
        <input
          id="part-photos"
          type="file"
          accept={PHOTO_MIME_TYPES.join(',')}
          multiple
          onChange={handlePhotoInput}
          className="hidden"
        />
      </label>
    )
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="create-part-title"
      className={`m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[90svh] overflow-hidden open:flex open:flex-col p-0 text-start bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg backdrop:bg-black/60 ${dialogAnimationClassName}`}
    >
      <form className={`flex min-h-0 flex-1 flex-col ${dialogContentAnimationClassName}`} onSubmit={handleSubmit}>
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
          <PartFormFields
            key={fieldsKey}
            idPrefix="create-part"
            form={form}
            onChange={update}
            categories={categories}
            onAddCategory={onAddCategory}
            manualTags={manualTags}
            onManualTagsChange={setManualTags}
            onError={setError}
            nameInputRef={nameInputRef}
          />

          <fieldset>
            <legend className={legendClassName}>
              Fotos <span className="text-sm font-normal text-body">— opcional</span>
            </legend>
            {photos.length === 0 && renderPhotoDropzone(false)}

            {photos.length > 0 && (
              <ul
                className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                aria-label="Fotos selecionadas"
              >
                {photos.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="relative overflow-hidden bg-neutral-secondary-medium border border-default-strong rounded-base shadow-xs"
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="block w-full aspect-[4/3] object-cover"
                    />
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium text-heading" title={photo.file.name}>
                        {photo.file.name}
                      </p>
                      <p className="text-xs text-body">{formatFileSize(photo.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label={`Remover foto ${photo.file.name}`}
                      className="absolute top-2 end-2 inline-flex items-center justify-center w-8 h-8 text-white bg-black/60 hover:bg-black/80 rounded-base cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
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
                <li className="flex">{renderPhotoDropzone(true)}</li>
              </ul>
            )}
            {photoError && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-400">
                {photoError}
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
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={`${primaryButtonClassName} disabled:cursor-wait disabled:opacity-80`}
          >
            {isSubmitting ? 'Salvando...' : 'Criar peça'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
