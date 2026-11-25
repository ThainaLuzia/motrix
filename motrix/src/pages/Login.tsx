import { useEffect, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase.ts'

const TITLE = 'Faça seu Login'
const TYPE_SPEED_MS = 80
const DELETE_SPEED_MS = 40
const PAUSE_AFTER_TYPE_MS = 2000
const PAUSE_AFTER_DELETE_MS = 500

const inputClassName =
  'block w-full ps-9 py-2.5 bg-neutral-secondary-medium border border-default-strong text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setError('')
    setIsLoading(true)

    // A sessão do Supabase Auth é o que preenche pecas.user_id (auth.uid()) e libera o RLS.
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email ou senha inválidos.')
      setIsLoading(false)
      return
    }

    try {
      await import('./Dashboard.tsx')
      navigate('/dashboard')
    } catch {
      setIsLoading(false)
    }
  }
  const [typedLength, setTypedLength] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReducedMotion) return

    let delay = isDeleting ? DELETE_SPEED_MS : TYPE_SPEED_MS
    let next = () => setTypedLength((length) => length + (isDeleting ? -1 : 1))

    if (!isDeleting && typedLength === TITLE.length) {
      delay = PAUSE_AFTER_TYPE_MS
      next = () => setIsDeleting(true)
    } else if (isDeleting && typedLength === 0) {
      delay = PAUSE_AFTER_DELETE_MS
      next = () => setIsDeleting(false)
    }

    const timeout = setTimeout(next, delay)
    return () => clearTimeout(timeout)
  }, [typedLength, isDeleting, prefersReducedMotion])

  const visibleLength = prefersReducedMotion ? TITLE.length : typedLength

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm text-left">
        <h1 className="text-center" aria-label={TITLE}>
          <span aria-hidden="true">{TITLE.slice(0, visibleLength)}</span>
          <span
            aria-hidden="true"
            className="inline-block w-0.5 h-[1em] ms-1 align-middle bg-current animate-pulse"
          />
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">
              Seu Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-body"
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
                    d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="email"
                name="email"
                required
                autoComplete="username"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={() => setError('')}
                className={`${inputClassName} pe-3`}
                placeholder="Digite seu email aqui..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">
              Sua Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-body"
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
                    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  />
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                onChange={() => setError('')}
                className={`${inputClassName} pe-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                aria-controls="password"
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-body hover:text-heading cursor-pointer"
              >
                {showPassword ? (
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
                      d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                    />
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-sm font-medium text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex w-full items-center justify-center text-white bg-brand hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium rounded-base text-sm px-4 py-2.5 focus:outline-none cursor-pointer disabled:cursor-wait disabled:opacity-80"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 me-2 animate-spin"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                  />
                </svg>
                Carregando...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
