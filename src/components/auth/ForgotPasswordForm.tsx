'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

interface Props {
  locale: string
}

export default function ForgotPasswordForm({ locale }: Props) {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/${locale}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo })

    if (error) {
      setServerError('Une erreur est survenue. Vérifiez votre adresse email.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-verified" />
        </div>
        <div>
          <p className="font-semibold text-dark">Email envoyé !</p>
          <p className="text-sm text-soft mt-1">
            Un lien de réinitialisation a été envoyé à{' '}
            <span className="font-medium text-dark">{getValues('email')}</span>.
          </p>
          <p className="text-xs text-soft mt-2">Vérifiez votre boîte mail (et les spams).</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Adresse email"
        type="email"
        autoComplete="email"
        placeholder="vous@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
        Envoyer le lien
      </Button>
    </form>
  )
}
