import { clsx } from 'clsx'

type BadgeVariant = 'verified' | 'premium' | 'pending' | 'open' | 'closing_soon' | 'closed' | 'awarded'

const styles: Record<BadgeVariant, string> = {
  verified: 'bg-verified text-white',
  premium: 'bg-brand-pale text-brand-dark',
  pending: 'bg-amber-100 text-amber-700',
  open: 'bg-green-100 text-green-700',
  closing_soon: 'bg-orange-100 text-orange-700',
  closed: 'bg-stone-100 text-stone-500',
  awarded: 'bg-blue-100 text-blue-700',
}

interface BadgeProps {
  variant: BadgeVariant
  label: string
  className?: string
}

export default function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full', styles[variant], className)}>
      {label}
    </span>
  )
}
