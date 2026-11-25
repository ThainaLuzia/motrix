import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import CreatePartModal from '../components/CreatePartModal.tsx'
import Navbar, { type NavbarUser } from '../components/Navbar.tsx'
import PartCard from '../components/PartCard.tsx'
import PartModal from '../components/PartModal.tsx'
import Skeleton from '../components/Skeleton.tsx'
import { primaryButtonClassName } from '../components/PartFormFields.tsx'
import { partWithStatus } from '../lib/partForm.ts'
import { supabase } from '../lib/supabase.ts'
import {
  createCategory,
  createPart,
  deletePart,
  fetchCategories,
  fetchParts,
  updatePart,
} from '../services/parts.ts'
import type { Category, Part, PartStatus } from '../types/part.ts'

const ALL_CATEGORIES = 'Todas as categorias'

/** Minúsculas e sem acentos, para a busca ignorar caixa e acentuação. */
function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [parts, setParts] = useState<Part[]>([])
  const [query, setQuery] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [openPart, setOpenPart] = useState<Part | null>(null)
  const [user, setUser] = useState<NavbarUser | null>(null)

  // Sem sessão o RLS bloqueia tudo (e pecas.user_id = auth.uid()), então volta para o login.
  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }
      if (cancelled) return
      const { user: authUser } = data.session
      const metadata = authUser.user_metadata ?? {}
      const email = authUser.email ?? ''
      setUser({
        name: metadata.full_name || metadata.name || email.split('@')[0] || 'Usuário',
        email,
        avatarUrl: metadata.avatar_url || metadata.picture || undefined,
      })
      try {
        const [loadedCategories, loadedParts] = await Promise.all([fetchCategories(), fetchParts()])
        if (cancelled) return
        setCategories(loadedCategories)
        setParts(loadedParts)
      } catch (err) {
        if (!cancelled) setLoadError(`Não foi possível carregar o catálogo: ${(err as Error).message}`)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  // Filtro local: o catálogo inteiro já está em memória. O texto casa com o nome da peça ou da categoria.
  const filteredParts = useMemo(() => {
    const term = normalize(query)
    return parts.filter((part) => {
      if (category !== ALL_CATEGORIES && part.category !== category) return false
      if (!term) return true
      return normalize(part.name).includes(term) || normalize(part.category).includes(term)
    })
  }, [parts, category, query])

  const isFiltering = category !== ALL_CATEGORIES || normalize(query) !== ''

  const categoryOptions = useMemo(
    () => [ALL_CATEGORIES, ...categories.map((c) => c.name)],
    [categories],
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function handleCreate(part: Part) {
    // createPart também envia part.photos para o Storage e grava em peca_fotos.
    const saved = await createPart(part)
    setParts((current) => [saved, ...current])
  }

  async function handleSave(id: string, part: Part) {
    const saved = await updatePart(id, part)
    setParts((current) => current.map((item) => (item.id === id ? saved : item)))
  }

  async function handleStatusChange(part: Part, status: PartStatus) {
    if (!part.id) return
    await handleSave(part.id, partWithStatus(part, status))
  }

  async function handleDelete(id: string) {
    await deletePart(id)
    setParts((current) => current.filter((item) => item.id !== id))
  }

  async function handleAddCategory(name: string) {
    const created = await createCategory(name)
    setCategories((current) =>
      [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    )
    return created
  }

  return (
    <>
      <Navbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        categoryOptions={categoryOptions}
        onCategoryChange={setCategory}
        user={user}
        onSignOut={handleSignOut}
      />

      <section
        id="dashboard"
        className="mx-auto flex w-full max-w-[1126px] flex-1 flex-col px-4 py-8 sm:px-6"
      >
        <CreatePartModal
          open={isCreateOpen}
          categories={categories}
          onAddCategory={handleAddCategory}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreate}
        />

        <div className="flex-1 overflow-y-auto">
          {/* Cabeçalho: título à esquerda e ações à direita; em telas pequenas as ações quebram para a linha de baixo. */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-2">
            <h2 className="m-0 text-3xl font-bold text-heading">Produtos</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                aria-haspopup="dialog"
                className={primaryButtonClassName}
              >
                <svg
                  className="w-4 h-4 me-1.5"
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
                    d="M5 12h14m-7 7V5"
                  />
                </svg>
                Criar
              </button>
            </div>
          </div>

          {loadError && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-400">
              {loadError}
            </p>
          )}

          {isLoading && (
            <div className="mt-4 p-2">
              <Skeleton label="Carregando catálogo..." />
            </div>
          )}

          {!isLoading && !loadError && parts.length === 0 && (
            <p className="mt-4 p-2 text-sm text-body">Nenhuma peça cadastrada ainda.</p>
          )}

          {!isLoading && isFiltering && parts.length > 0 && filteredParts.length === 0 && (
            <p className="mt-4 p-2 text-sm text-body">Nenhuma peça encontrada para esta busca.</p>
          )}

          {!isLoading && filteredParts.length > 0 && (
            // Ordem do backend (created_at desc); peças novas entram no topo via handleCreate.
            // p-2 dá folga para o efeito de hover não ser cortado pelo overflow do contêiner.
            <ul className="mt-4 flex flex-col gap-3 p-2">
              {filteredParts.map((part, index) => (
                <li key={part.id ?? index}>
                  <PartCard part={part} onOpen={setOpenPart} onStatusChange={handleStatusChange} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <PartModal
          part={openPart}
          categories={categories}
          onAddCategory={handleAddCategory}
          onClose={() => setOpenPart(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </section>
    </>
  )
}
