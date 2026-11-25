import { partRowGridClassName } from './PartCard.tsx'

interface SkeletonProps {
  label?: string
  /** Quantos cards de placeholder exibir. */
  count?: number
}

const barClassName = 'bg-neutral-quaternary rounded-full'
const cellClassName = 'col-span-2 flex h-5 items-center md:col-span-1'

/** Placeholder com o mesmo formato do PartCard (linha única no md+, empilhado no celular). */
function PartCardSkeleton() {
  return (
    <div
      className={`${partRowGridClassName} w-full px-3 py-2 bg-neutral-secondary-medium border border-default-strong rounded-base shadow-xs`}
    >
      <div className="row-span-5 size-16 self-start rounded-base bg-neutral-quaternary md:row-span-1 md:self-center" />
      {/* Nome */}
      <div className="flex h-7 items-center">
        <div className={`${barClassName} h-3.5 w-3/4 max-w-56`} />
      </div>
      {/* Categoria, carro e posição */}
      <div className={cellClassName}>
        <div className={`${barClassName} h-2 w-2/3 max-w-32`} />
      </div>
      <div className={cellClassName}>
        <div className={`${barClassName} h-2 w-3/4 max-w-48`} />
      </div>
      <div className={cellClassName}>
        <div className={`${barClassName} h-2 w-2/3 max-w-28`} />
      </div>
      {/* Preço */}
      <div className={`${cellClassName} h-6`}>
        <div className={`${barClassName} h-3 w-20`} />
      </div>
      {/* Status */}
      <div className="col-start-3 row-start-1 flex justify-end self-start md:col-start-auto md:row-start-auto md:self-center">
        <div className={`${barClassName} h-5 w-16`} />
      </div>
    </div>
  )
}

/** Lista de cards animados exibida enquanto o catálogo carrega. */
export default function Skeleton({ label = 'Carregando...', count = 3 }: SkeletonProps) {
  return (
    <div role="status" className="animate-pulse motion-reduce:animate-none">
      <ul className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <PartCardSkeleton />
          </li>
        ))}
      </ul>
      <span className="sr-only">{label}</span>
    </div>
  )
}
