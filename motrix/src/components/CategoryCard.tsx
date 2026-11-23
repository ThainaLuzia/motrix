export interface CategorySummary {
  name: string
  count: number
}

/**
 * Paleta de fundos para os cards de categoria. Tons escuros/saturados que combinam com o
 * tema escuro e mantêm contraste >= 4.5:1 com texto branco.
 */
const CATEGORY_COLORS = [
  '#1d4ed8', // blue-700
  '#4338ca', // indigo-700
  '#6d28d9', // violet-700
  '#86198f', // fuchsia-800
  '#9d174d', // pink-800
  '#9f1239', // rose-800
  '#991b1b', // red-800
  '#9a3412', // orange-800
  '#92400e', // amber-800
  '#3f6212', // lime-800
  '#065f46', // emerald-800
  '#115e59', // teal-800
  '#155e75', // cyan-800
  '#075985', // sky-800
  '#334155', // slate-700
]

/** Cor estável por categoria: o mesmo nome gera sempre o mesmo índice da paleta (hash djb2). */
function getCategoryColor(name: string) {
  const key = name.trim().toLowerCase()
  let hash = 5381
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

interface CategoryCardProps {
  category: CategorySummary
  onOpen: (category: CategorySummary) => void
}

export default function CategoryCard({ category, onOpen }: CategoryCardProps) {
  const countLabel = `${category.count} ${category.count === 1 ? 'peça' : 'peças'}`

  function handleClick() {
    // Resposta tátil curta em aparelhos com tela de toque (ignorado onde não houver suporte).
    if (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      window.matchMedia?.('(pointer: coarse)').matches
    ) {
      navigator.vibrate(10)
    }
    onOpen(category)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-haspopup="dialog"
      aria-label={`${category.name}, ${countLabel}`}
      style={{ backgroundColor: getCategoryColor(category.name) }}
      // No Tailwind v4, hover: só vale em dispositivos com hover real, então o efeito não fica preso após o toque.
      className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden p-4 text-white border border-white/10 rounded-base shadow-xs cursor-pointer select-none [-webkit-tap-highlight-color:transparent] transition-transform duration-200 ease-out hover:scale-105 hover:shadow-lg active:scale-95 active:duration-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-medium motion-reduce:transition-none"
    >
      <span className="line-clamp-2 max-w-full text-center text-base font-semibold leading-tight break-words sm:text-lg">
        {category.name}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-2 end-3 text-xs font-medium text-white/85 sm:text-sm"
      >
        {countLabel}
      </span>
    </button>
  )
}
