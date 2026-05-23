import { clsx } from 'clsx'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClass = sizes[size]
  if (src) {
    return (
      <div className={clsx('relative rounded-full overflow-hidden flex-shrink-0', sizeClass, className)}>
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    )
  }
  return (
    <div className={clsx('rounded-full bg-brand-light text-brand-dark font-bold flex items-center justify-center flex-shrink-0', sizeClass, className)}>
      {initials(name)}
    </div>
  )
}
