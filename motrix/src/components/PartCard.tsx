import { AXLE_LABELS, formatPrice, SIDE_LABELS, STATUS_BADGES } from '../lib/partLabels.ts'
import type { Part, PartStatus } from '../types/part.ts'

export function StatusBadge({ status }: { status: PartStatus }) {
  const badge = STATUS_BADGES[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
    >
      {badge.label}
    </span>
  )
}

/** Placeholder neutro para peças sem foto. */
export function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-quaternary text-body">
      <svg
        className="w-8 h-8"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
        />
      </svg>
    </div>
  )
}

interface PartCardProps {
  part: Part
  onOpen: (part: Part) => void
}

export default function PartCard({ part, onOpen }: PartCardProps) {
  const { brand, model, axle, side } = part.compatibility
  const cover = part.photoUrls?.[0]
  const position = [axle && AXLE_LABELS[axle], side && SIDE_LABELS[side]].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={() => onOpen(part)}
      aria-haspopup="dialog"
      // No Tailwind v4, hover: só vale em dispositivos com hover real, então o efeito não fica preso após o toque.
      className="flex w-full items-stretch gap-4 overflow-hidden p-3 text-start bg-neutral-secondary-medium border border-default-strong rounded-base shadow-xs cursor-pointer select-none [-webkit-tap-highlight-color:transparent] transition duration-200 ease-out hover:bg-neutral-tertiary-medium hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-medium motion-reduce:transition-none"
    >
      <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-base sm:w-44">
        {cover ? (
          <img src={cover} alt={part.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 min-w-0 truncate text-base font-semibold text-heading sm:text-lg">
            {part.name}
          </h3>
          <StatusBadge status={part.status} />
        </div>

        {part.category && <p className="m-0 truncate text-sm text-body">{part.category}</p>}

        <p className="m-0 truncate text-sm text-body">
          {brand} {model}
          {part.color && ` · ${part.color}`}
        </p>

        {position && <p className="m-0 truncate text-sm text-body">{position}</p>}

        <p className="m-0 mt-auto pt-1 text-base font-semibold text-heading">
          {formatPrice(part.salePrice)}
        </p>
      </div>
    </button>
  )
}
