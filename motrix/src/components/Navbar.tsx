import { useEffect, useRef, useState, type RefObject, type SubmitEvent } from 'react'

export type NavbarUser = {
  name: string
  email: string
  avatarUrl?: string
}

type NavbarProps = {
  query: string
  onQueryChange: (query: string) => void
  category: string
  /** Opções do filtro, já incluindo a opção "todas". */
  categoryOptions: string[]
  onCategoryChange: (category: string) => void
  onCreate: () => void
  user: NavbarUser | null
  onSignOut: () => Promise<void>
}

const dropdownItemClassName =
  'block w-full p-2 text-start hover:bg-neutral-tertiary-medium hover:text-heading rounded-md cursor-pointer'

/** Fecha um dropdown ao clicar fora dele ou apertar Esc. */
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, setOpen: (open: boolean) => void) {
  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, open, setOpen])
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

export default function Navbar({
  query,
  onQueryChange,
  category,
  categoryOptions,
  onCategoryChange,
  onCreate,
  user,
  onSignOut,
}: NavbarProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useDismiss(categoryRef, isCategoryOpen, setIsCategoryOpen)
  useDismiss(userRef, isUserOpen, setIsUserOpen)

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    // A busca já filtra enquanto digita; o submit só evita recarregar a página.
    event.preventDefault()
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await onSignOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <nav className="bg-neutral-primary sticky w-full z-30 top-0 start-0 border-b border-default">
      {/* Mobile: nome e usuário em cima, busca embaixo. A partir de md: 3 colunas com a busca no centro. */}
      <div className="max-w-screen-xl mx-auto p-4 grid grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_minmax(0,42rem)_1fr]">
        <h1 className="m-0 col-start-1 row-start-1 text-2xl font-bold text-start text-heading whitespace-nowrap">
          Motrix
        </h1>

        <div className="col-span-2 flex w-full gap-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <form className="min-w-0 flex-1" onSubmit={handleSearch}>
            <div className="flex shadow-xs rounded-base -space-x-0.5">
              <label htmlFor="search-dropdown" className="sr-only">
                Buscar peças
              </label>
              <div ref={categoryRef} className="relative shrink-0">
                <button
                  id="dropdown-button"
                  type="button"
                  onClick={() => setIsCategoryOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isCategoryOpen}
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
                {isCategoryOpen && (
                  <div
                    id="dropdown"
                    className="absolute start-0 top-full mt-1 z-20 bg-neutral-primary-medium border border-default-strong rounded-base shadow-lg w-44"
                  >
                    <ul
                      role="listbox"
                      aria-labelledby="dropdown-button"
                      className="p-2 text-sm text-body font-medium"
                    >
                      {categoryOptions.map((item) => (
                        <li key={item} role="option" aria-selected={item === category}>
                          <button
                            type="button"
                            onClick={() => {
                              onCategoryChange(item)
                              setIsCategoryOpen(false)
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
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
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
            onClick={onCreate}
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

        <div ref={userRef} className="relative col-start-2 row-start-1 justify-self-end md:col-start-3">
          {user && (
            <>
              <button
                type="button"
                id="user-menu-button"
                onClick={() => setIsUserOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isUserOpen}
                aria-controls="user-dropdown"
                className="flex items-center gap-2 text-sm rounded-full focus:outline-none focus:ring-4 focus:ring-neutral-tertiary cursor-pointer"
              >
                <span className="sr-only">Abrir menu do usuário</span>
                {user.avatarUrl ? (
                  <img className="w-8 h-8 rounded-full object-cover" src={user.avatarUrl} alt="" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex w-8 h-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
                  >
                    {initials(user.name)}
                  </span>
                )}
              </button>
              {isUserOpen && (
                <div
                  id="user-dropdown"
                  className="absolute end-0 top-full mt-2 z-50 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-56 text-start"
                >
                  <div className="flex items-center gap-3 px-4 py-3 text-sm border-b border-default">
                    {user.avatarUrl ? (
                      <img className="w-9 h-9 shrink-0 rounded-full object-cover" src={user.avatarUrl} alt="" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
                      >
                        {initials(user.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <span className="block text-heading font-medium truncate">{user.name}</span>
                      <span className="block text-body truncate">{user.email}</span>
                    </div>
                  </div>
                  <ul role="menu" aria-labelledby="user-menu-button" className="p-2 text-sm text-body font-medium">
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className={`${dropdownItemClassName} inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait`}
                      >
                        <svg
                          className="w-4 h-4"
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
                            d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
                          />
                        </svg>
                        {isSigningOut ? 'Saindo...' : 'Sair'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
