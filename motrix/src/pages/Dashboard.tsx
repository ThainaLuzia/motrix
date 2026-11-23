import { useEffect, useRef, useState, type SubmitEvent } from 'react'

const CATEGORIES = ['Todas as categorias', 'Motor', 'Freios', 'Suspensão', 'Elétrica']

const dropdownItemClassName =
  'block w-full p-2 text-start hover:bg-neutral-tertiary-medium hover:text-heading rounded-md cursor-pointer'

export default function Dashboard() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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

  return (
    <section id="dashboard" className="flex flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="m-0 text-2xl font-bold">Motrix</h1>

        <form className="w-full max-w-2xl" onSubmit={handleSearch}>
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
                className="inline-flex h-full items-center z-10 text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-s-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer"
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
                    d="M9.143 4H4.857A.857.857 0 0 0 4 4.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 10 9.143V4.857A.857.857 0 0 0 9.143 4Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 20 9.143V4.857A.857.857 0 0 0 19.143 4Zm-10 10H4.857a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286A.857.857 0 0 0 9.143 14Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286a.857.857 0 0 0-.857-.857Z"
                  />
                </svg>
                {category}
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
                  className="absolute start-0 top-full mt-1 z-20 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44"
                >
                  <ul
                    role="listbox"
                    aria-labelledby="dropdown-button"
                    className="p-2 text-sm text-body font-medium"
                  >
                    {CATEGORIES.map((item) => (
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
              className="px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body"
              placeholder="Buscar peças..."
            />
            <button
              type="submit"
              className="inline-flex items-center text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-e-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer"
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
                  strokeWidth="2"
                  d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
              Buscar
            </button>
          </div>
        </form>
      </header>
    </section>
  )
}
