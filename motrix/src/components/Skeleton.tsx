interface SkeletonProps {
  label?: string
  /** Quantos cards de placeholder exibir. */
  count?: number
}

const barClassName = 'bg-neutral-quaternary rounded-full'

/** Placeholder com o mesmo formato do PartCard (foto 4:3 à esquerda, textos e preço à direita). */
function PartCardSkeleton() {
  return (
    <div className="flex w-full items-stretch gap-4 p-3 bg-neutral-secondary-medium border border-default-strong rounded-base shadow-xs">
      <div className="aspect-[4/3] w-28 shrink-0 rounded-base bg-neutral-quaternary sm:w-44" />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Nome + badge de status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-6 flex-1 items-center sm:h-7">
            <div className={`${barClassName} h-3 w-3/5 max-w-56`} />
          </div>
          <div className={`${barClassName} h-5 w-16 shrink-0`} />
        </div>
        {/* Categoria, marca/modelo e posição */}
        <div className="flex h-5 items-center">
          <div className={`${barClassName} h-2 w-1/3 max-w-32`} />
        </div>
        <div className="flex h-5 items-center">
          <div className={`${barClassName} h-2 w-1/2 max-w-48`} />
        </div>
        <div className="flex h-5 items-center">
          <div className={`${barClassName} h-2 w-1/4 max-w-28`} />
        </div>
        {/* Preço */}
        <div className="mt-auto flex h-7 items-end pt-1">
          <div className={`${barClassName} h-3 w-20`} />
        </div>
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
