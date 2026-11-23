import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import CreatePartModal from '../components/CreatePartModal.tsx'
import type { Part } from '../types/part.ts'

const ALL_CATEGORIES = 'Todas as categorias'
const DEFAULT_CATEGORIES = [
  'Lataria',
  'Iluminação',
  'Acabamento',
  'Elétrica',
  'Motor',
  'Freios',
  'Suspensão',
]

const dropdownItemClassName =
  'block w-full p-2 text-start hover:bg-neutral-tertiary-medium hover:text-heading rounded-md cursor-pointer'

export default function Dashboard() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDropdownOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsDropdownOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDropdownOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get('search') ?? '').trim()
    if (!query) return
    // TODO: integrar com a busca de peças
    console.log({ category, query })
  }

  function handleCreate(part: Part) {
    // TODO: integrar com o cadastro de peças
    console.log(part)
  }

  return (
    <section id="dashboard" className="flex flex-1 flex-col px-4 py-8 sm:px-6">
      {/* Mobile: nome em cima e busca embaixo. A partir de md: 3 colunas com a busca no centro da tela. */}
      <header className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_minmax(0,42rem)_1fr]">
        <h1 className="m-0 text-2xl font-bold text-center md:text-start">Motrix</h1>

        <div className="flex w-full gap-2">
          <form className="min-w-0 flex-1" onSubmit={handleSearch}>
            <div className="flex shadow-xs rounded-base -space-x-0.5">
              <label htmlFor="search-dropdown" className="sr-only">
                Buscar peças
              </label>
              <div ref={dropdownRef} className="relative shrink-0">
                <button
                  id="dropdown-button"
                  type="button"
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  aria-controls="dropdown"
                  className="inline-flex h-full items-center z-10 text-body bg-neutral-secondary-medium box-border border border-default-strong hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-3 sm:px-4 py-2.5 focus:outline-none cursor-pointer whitespace-nowrap"
                >
                  <svg
                    className="w-4 h-4 sm:me-1.5"
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
                      d="M9.143 4H4.857A.857.857 0 0 0 4 4.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 10 9.143V4.857A.857.857 0 0 0 9.143 4Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 20 9.143V4.857A.857.857 0 0 0 19.143 4Zm-10 10H4.857a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286A.857.857 0 0 0 9.143 14Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286a.857.857 0 0 0-.857-.857Z"
                    />
                  </svg>
                  <span className="sr-only sm:not-sr-only">{category}</span>
                  <svg
                    className="w-4 h-4 ms-1.5"
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
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div
                    id="dropdown"
                    className="absolute start-0 top-full mt-1 z-20 bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg w-44"
                  >
                    <ul
                      role="listbox"
                      aria-labelledby="dropdown-button"
                      className="p-2 text-sm text-body font-medium"
                    >
                      {[ALL_CATEGORIES, ...categories].map((item) => (
                        <li key={item} role="option" aria-selected={item === category}>
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(item)
                              setIsDropdownOpen(false)
                            }}
                            className={`${dropdownItemClassName} ${item === category ? 'text-heading' : ''}`}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <input
                type="search"
                id="search-dropdown"
                name="search"
                required
                className="min-w-0 px-3 py-2.5 bg-neutral-secondary-medium border border-default-strong text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body"
                placeholder="Buscar peças..."
              />
              <button
                type="submit"
                className="inline-flex items-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-e-base text-sm px-3 sm:px-4 py-2.5 focus:outline-none cursor-pointer shrink-0"
              >
                <svg
                  className="w-4 h-4 sm:me-1.5"
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
                    strokeWidth="2"
                    d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>
                <span className="sr-only sm:not-sr-only">Buscar</span>
              </button>
            </div>
          </form>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-strong hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 sm:px-4 py-2.5 focus:outline-none cursor-pointer shrink-0"
          >
            <svg
              className="w-4 h-4 sm:me-1.5"
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
            <span className="sr-only sm:not-sr-only">Criar</span>
          </button>
        </div>
      </header>

      <CreatePartModal
        open={isCreateOpen}
        categories={categories}
        onAddCategory={(name) => setCategories((current) => [...current, name])}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </section>
  )
}
