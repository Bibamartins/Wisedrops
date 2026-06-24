'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { AlertCircle, Stethoscope, ClipboardList, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Login Page — layout split 2 colunas (form esq / hero dir)
// Logica de auth mantida intacta (NextAuth signIn + getSession)
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (!result || result.error) {
      setLoading(false)
      setErrorMsg('Email ou senha invalidos. Verifique seus dados e tente novamente.')
      return
    }

    // Fetch session to read role for redirect
    const session = await getSession()
    setLoading(false)

    const role = session?.user?.role
    if (role === 'DOCTOR') {
      router.push('/doctor-dashboard')
    } else if (role === 'ADMIN') {
      router.push('/admin-dashboard')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen flex bg-surface-50">

      {/* ------------------------------------------------------------------ */}
      {/* Coluna esquerda — formulario (100% mobile, 40% desktop)             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-xs group-hover:bg-brand-700 transition-colors duration-150">
              <span className="text-white font-heading font-bold text-sm leading-none">W</span>
            </div>
            <span className="font-heading font-semibold text-lg text-surface-900 tracking-tight">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-semibold text-h1 text-surface-900 tracking-tight mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-surface-600">
              Entre na sua conta para continuar seu tratamento.
            </p>
          </div>

          {/* Form card */}
          <Card variant="default" padding="lg" className="shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-surface-700 leading-none">
                    Senha
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-brand-700 hover:text-brand-800 transition-colors duration-150 font-medium"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Erro de auth */}
              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded bg-error-50 border border-error-100"
                >
                  <AlertCircle size={14} strokeWidth={2} className="text-error-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-error-700">{errorMsg}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Entrar
              </Button>
            </form>
          </Card>

          {/* Links de rodape */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-surface-600">
              Nao tem conta?{' '}
              <Link
                href="/register"
                className="text-brand-700 font-medium hover:text-brand-800 transition-colors duration-150"
              >
                Cadastre-se gratis
              </Link>
            </p>
            <Link
              href="/seja-medico"
              className="block w-full text-center py-3 rounded-md border border-dashed border-surface-200 text-surface-500 text-sm hover:border-sage-300 hover:text-sage-700 transition-colors duration-150"
            >
              Sou medico — credenciar-se na plataforma
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Coluna direita — hero visual (oculto em mobile, 60% desktop)        */}
      {/* ------------------------------------------------------------------ */}
      {/* Recalibração premium: bg-surface-900 (preto editorial) — não bg-brand-50.
          Headline grande domina. Feature list sem caixinhas decorativas. */}
      <div className="hidden lg:flex flex-1 bg-surface-900 flex-col justify-between px-20 py-24 relative overflow-hidden">
        {/* Watermark sutil */}
        <div aria-hidden className="absolute -top-20 -right-32 text-[20rem] font-heading font-extrabold text-white/[0.02] leading-none tracking-tighter select-none">
          W
        </div>

        <div className="relative">
          <p className="text-overline text-brand-400 uppercase tracking-widest font-semibold">
            Cannabis medicinal
          </p>
        </div>

        <div className="max-w-lg relative">
          <h2 className="font-heading font-extrabold text-white tracking-[-0.04em] leading-[0.95] text-5xl xl:text-6xl text-balance">
            Tratamento sério.<br />
            <span className="text-brand-400">Sem julgamento.</span>
          </h2>
          <p className="mt-8 text-body-lg text-white/60 leading-relaxed max-w-md">
            Médicos prescritores que ouvem você. Receita digital. Acesso aos produtos certificados.
            Tudo num só lugar, do começo ao fim do seu tratamento.
          </p>
        </div>

        <div className="relative pt-12 border-t border-white/10">
          <p className="text-xs text-white/40 leading-relaxed max-w-md">
            Plataforma regulamentada pela ANVISA — RDC 327/2019 e RDC 660/2022.
            Seus dados sao protegidos pela LGPD.
          </p>
        </div>
      </div>
    </div>
  )
}
