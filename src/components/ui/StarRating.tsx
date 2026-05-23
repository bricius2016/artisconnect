'use client'

import { clsx } from 'clsx'

interface StarRatingProps {
  rating: number | null
  count?: number
  size?: 'sm' | 'md'
  showEmpty?: boolean
}

export default function StarRating({ rating, count, size = 'sm', showEmpty = false }: StarRatingProps) {
  if (!rating && !showEmpty) return null

  const value = rating ?? 0
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={clsx(starSize, star <= Math.round(value) ? 'text-amber-400' : 'text-border')}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      {value > 0 && (
        <span className={clsx('font-semibold text-dark', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={clsx('text-soft', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({count})
        </span>
      )}
    </span>
  )
}
