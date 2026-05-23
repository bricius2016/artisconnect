'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['client', 'prestataire', 'entreprise']),
})

type FormData = z.infer<typeof schema>

interface Props {
  locale: string
  defaultRole: 'client' | 'prestataire' | 'entreprise'
}

const ROLES = [
  { value: 'client', labelKey: 'role_client', icon: '🔍' },
  { value: 'prestataire', labelKey: 'role_pro', icon: '🔨' },
  { value: 'entreprise', labelKey: 'role_entreprise', icon: '🏢' },
] as const

export default function RegisterForm({ locale, defaultRole }: Props) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        },
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/${locale}/dashboard`), 1500)
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-semibold text-dark">Compte créé avec succès !</p>
        <p className="text-sm text-mid mt-1">Redirection en cours…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role selector */}
      <div>
        <p className="label">Je suis…</p>
        <div className="grid grid-cols-1 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setValue('role', r.value)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors',
                selectedRole === r.value
                  ? 'border-brand bg-brand-pale text-brand font-semibold'
                  : 'border-border text-mid hover:border-soft'
              )}
            >
              <span>{r.icon}</span>
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('first_name')}
          autoComplete="given-name"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          label={t('last_name')}
          autoComplete="family-name"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>

      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label={t('password')}
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        {t('submit_register')}
      </Button>
    </form>
  )
}
