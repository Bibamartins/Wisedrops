'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  User,
  MapPin,
  Shield,
  CreditCard,
  Bell,
  ClipboardList,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'

// ---------------------------------------------------------------------------
// Tipos — preservados do original
// ---------------------------------------------------------------------------

interface Address {
  id: string
  label: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zip: string
  isDefault: boolean
}

interface NotificationPref {
  type: string
  label: string
  email: boolean
  push: boolean
  whatsapp: boolean
}

interface AnvisaAuth {
  id: string
  protocol: string
  product: string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  issuedDate: string
  expiresDate: string
}

interface PaymentMethod {
  id: string
  type: 'credit_card' | 'pix'
  label: string
  last4?: string
  brand?: string
  isDefault: boolean
}

// ---------------------------------------------------------------------------
// Mock data — preservado do original
// ---------------------------------------------------------------------------

const MOCK_PROFILE = {
  name: 'Maria Silva',
  email: 'maria.silva@email.com',
  phone: '(11) 99876-5432',
  cpf: '***.***.***-90',
  birthDate: '1988-05-14',
  gender: 'Feminino',
}

const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-001',
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 42',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    zip: '01401-000',
    isDefault: true,
  },
  {
    id: 'addr-002',
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1578',
    complement: '12° andar',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-200',
    isDefault: false,
  },
]

const MOCK_NOTIFICATIONS: NotificationPref[] = [
  { type: 'dose_reminder', label: 'Lembrete de Dose', email: false, push: true, whatsapp: true },
  { type: 'appointment', label: 'Consultas e Agendamentos', email: true, push: true, whatsapp: true },
  { type: 'order_update', label: 'Atualização de Pedido', email: true, push: true, whatsapp: false },
  { type: 'prescription_expiry', label: 'Vencimento de Receita', email: true, push: true, whatsapp: true },
  { type: 'promotions', label: 'Promoções e Novidades', email: true, push: false, whatsapp: false },
  { type: 'lab_results', label: 'Resultados de Exames', email: true, push: true, whatsapp: false },
]

const MOCK_ANVISA_AUTHS: AnvisaAuth[] = [
  {
    id: 'anv-001',
    protocol: 'ANVISA-2026-001847',
    product: 'CBD Full Spectrum 30mg/mL',
    status: 'ACTIVE',
    issuedDate: '2026-02-20',
    expiresDate: '2027-02-20',
  },
  {
    id: 'anv-002',
    protocol: 'ANVISA-2026-000623',
    product: 'THC:CBD 1:1 Óleo 10mg/mL',
    status: 'ACTIVE',
    issuedDate: '2026-01-15',
    expiresDate: '2027-01-15',
  },
  {
    id: 'anv-003',
    protocol: 'ANVISA-2025-004291',
    product: 'CBD Isolado 50mg/mL',
    status: 'EXPIRED',
    issuedDate: '2025-06-25',
    expiresDate: '2026-06-25',
  },
]

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pay-001', type: 'credit_card', label: 'Visa', last4: '4532', brand: 'Visa', isDefault: true },
  { id: 'pay-002', type: 'credit_card', label: 'Mastercard', last4: '8721', brand: 'Mastercard', isDefault: false },
  { id: 'pay-003', type: 'pix', label: 'PIX — CPF', isDefault: false },
]

// ---------------------------------------------------------------------------
// Utilitário de eyebrow editorial
// ---------------------------------------------------------------------------

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-overline text-surface-400 uppercase text-[11px] font-semibold mb-4 tracking-widest">
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Toggle de notificação
// ---------------------------------------------------------------------------

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  label: string
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        checked ? 'bg-brand-600' : 'bg-surface-200'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-150',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Seção: Dados pessoais
// ---------------------------------------------------------------------------

function PersonalSection() {
  const [profile, setProfile] = useState(MOCK_PROFILE)
  const [isEditing, setIsEditing] = useState(false)
  const [editProfile, setEditProfile] = useState(MOCK_PROFILE)

  function handleSave() {
    setProfile(editProfile)
    setIsEditing(false)
  }

  return (
    <Card variant="default" padding="lg">
      <Eyebrow>Dados pessoais</Eyebrow>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-surface-900">
          Informações da conta
        </h2>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsEditing(true); setEditProfile(profile) }}
          >
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-0 divide-y divide-surface-100">
          {[
            { label: 'Nome completo', value: profile.name },
            { label: 'E-mail', value: profile.email },
            { label: 'Telefone', value: profile.phone },
            { label: 'CPF', value: profile.cpf },
            { label: 'Data de nascimento', value: new Date(profile.birthDate).toLocaleDateString('pt-BR') },
            { label: 'Gênero', value: profile.gender },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between py-3">
              <span className="text-sm text-surface-500">{field.label}</span>
              <span className="text-sm font-medium text-surface-900">{field.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {[
            { label: 'Nome completo', key: 'name' as const, type: 'text' },
            { label: 'E-mail', key: 'email' as const, type: 'email' },
            { label: 'Telefone', key: 'phone' as const, type: 'tel' },
          ].map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`profile-${field.key}`}
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                {field.label}
              </label>
              <input
                id={`profile-${field.key}`}
                type={field.type}
                value={editProfile[field.key]}
                onChange={(e) => setEditProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2.5 rounded text-sm text-surface-800 bg-white',
                  'border border-surface-300 placeholder:text-surface-400',
                  'transition-colors duration-150',
                  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
                )}
              />
            </div>
          ))}
          {/* CPF — somente leitura */}
          <div>
            <label htmlFor="profile-cpf" className="block text-sm font-medium text-surface-700 mb-1.5">
              CPF
            </label>
            <input
              id="profile-cpf"
              type="text"
              value={profile.cpf}
              disabled
              aria-describedby="cpf-note"
              className={cn(
                'w-full px-3 py-2.5 rounded text-sm',
                'border border-surface-100 bg-surface-50 text-surface-400 cursor-not-allowed',
              )}
            />
            <p id="cpf-note" className="text-xs text-surface-400 mt-1">
              CPF não pode ser alterado
            </p>
          </div>
          {/* Gênero */}
          <div>
            <label htmlFor="profile-gender" className="block text-sm font-medium text-surface-700 mb-1.5">
              Gênero
            </label>
            <select
              id="profile-gender"
              value={editProfile.gender}
              onChange={(e) => setEditProfile((prev) => ({ ...prev, gender: e.target.value }))}
              className={cn(
                'w-full px-3 py-2.5 rounded text-sm text-surface-800 bg-white',
                'border border-surface-300',
                'transition-colors duration-150',
                'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15',
              )}
            >
              <option>Feminino</option>
              <option>Masculino</option>
              <option>Não-binário</option>
              <option>Prefiro não informar</option>
            </select>
          </div>
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Endereços
// ---------------------------------------------------------------------------

function AddressSection() {
  return (
    <Card variant="default" padding="lg">
      <Eyebrow>Entrega</Eyebrow>
      <h2 className="font-heading font-semibold text-surface-900 mb-6">
        Endereços
      </h2>

      <div className="space-y-4">
        {MOCK_ADDRESSES.map((addr) => (
          <div
            key={addr.id}
            className="p-4 rounded-lg bg-surface-50 border border-surface-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-surface-900 text-sm">{addr.label}</span>
                {addr.isDefault && (
                  <Badge variant="brand" size="sm">Padrão</Badge>
                )}
              </div>
              <div className="flex gap-3">
                <button className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors duration-150">
                  Editar
                </button>
                {!addr.isDefault && (
                  <button className="text-xs font-medium text-error-600 hover:text-error-700 transition-colors duration-150">
                    Remover
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-surface-700">
              {addr.street}, {addr.number}
              {addr.complement && ` — ${addr.complement}`}
            </p>
            <p className="text-sm text-surface-500">
              {addr.neighborhood} — {addr.city}/{addr.state}
            </p>
            <p className="text-sm text-surface-500">CEP: {addr.zip}</p>
          </div>
        ))}

        <button
          className={cn(
            'w-full py-4 rounded-lg border-2 border-dashed border-surface-300 text-surface-500',
            'text-sm font-medium transition-colors duration-150',
            'hover:border-brand-300 hover:text-brand-700',
          )}
        >
          + Adicionar novo endereço
        </button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Notificações
// ---------------------------------------------------------------------------

function NotificationsSection() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  function toggle(index: number, channel: 'email' | 'push' | 'whatsapp') {
    setNotifications((prev) =>
      prev.map((n, i) => (i === index ? { ...n, [channel]: !n[channel] } : n))
    )
  }

  return (
    <Card variant="default" padding="lg">
      <Eyebrow>Comunicação</Eyebrow>
      <h2 className="font-heading font-semibold text-surface-900 mb-6">
        Preferências de notificação
      </h2>

      <div>
        {/* Cabeçalho */}
        <div
          className="grid gap-4 mb-3 pb-3 border-b border-surface-200"
          style={{ gridTemplateColumns: '1fr auto auto auto' }}
          aria-hidden="true"
        >
          <span className="text-xs text-surface-400 font-medium uppercase tracking-wide">Tipo</span>
          <span className="text-xs text-surface-400 font-medium uppercase tracking-wide w-14 text-center">E-mail</span>
          <span className="text-xs text-surface-400 font-medium uppercase tracking-wide w-14 text-center">Push</span>
          <span className="text-xs text-surface-400 font-medium uppercase tracking-wide w-16 text-center">WhatsApp</span>
        </div>

        {notifications.map((notif, i) => (
          <div
            key={notif.type}
            className="grid gap-4 py-3 items-center border-b border-surface-100 last:border-0"
            style={{ gridTemplateColumns: '1fr auto auto auto' }}
          >
            <span className="text-sm text-surface-700">{notif.label}</span>
            <div className="w-14 flex justify-center">
              <ToggleSwitch
                checked={notif.email}
                onChange={() => toggle(i, 'email')}
                label={`${notif.label} — E-mail`}
              />
            </div>
            <div className="w-14 flex justify-center">
              <ToggleSwitch
                checked={notif.push}
                onChange={() => toggle(i, 'push')}
                label={`${notif.label} — Push`}
              />
            </div>
            <div className="w-16 flex justify-center">
              <ToggleSwitch
                checked={notif.whatsapp}
                onChange={() => toggle(i, 'whatsapp')}
                label={`${notif.label} — WhatsApp`}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Autorizações ANVISA
// ---------------------------------------------------------------------------

const ANVISA_STATUS_BADGE: Record<AnvisaAuth['status'], React.ComponentProps<typeof Badge>['variant']> = {
  ACTIVE:  'success',
  PENDING: 'warning',
  EXPIRED: 'neutral',
}

const ANVISA_STATUS_LABEL: Record<AnvisaAuth['status'], string> = {
  ACTIVE:  'Ativa',
  PENDING: 'Pendente',
  EXPIRED: 'Expirada',
}

function AnvisaSection() {
  return (
    <Card variant="default" padding="lg">
      <Eyebrow>Regulatório</Eyebrow>
      <h2 className="font-heading font-semibold text-surface-900 mb-4">
        Autorizações ANVISA
      </h2>

      <div className="p-4 rounded-lg bg-info-50 border border-info-100 mb-5 text-sm text-info-700">
        As autorizações ANVISA são emitidas automaticamente ao adquirir um produto importado.
        Cada autorização é válida por 1 ano.
      </div>

      <div className="space-y-3">
        {MOCK_ANVISA_AUTHS.map((auth) => (
          <div
            key={auth.id}
            className="p-4 rounded-lg border border-surface-200 bg-white"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-surface-900">{auth.protocol}</p>
                <p className="text-sm text-surface-600 mt-0.5">{auth.product}</p>
              </div>
              <Badge variant={ANVISA_STATUS_BADGE[auth.status]}>
                {ANVISA_STATUS_LABEL[auth.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span>Emissão: {new Date(auth.issuedDate).toLocaleDateString('pt-BR')}</span>
              <span>Validade: {new Date(auth.expiresDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Pagamento
// ---------------------------------------------------------------------------

function PaymentSection() {
  return (
    <Card variant="default" padding="lg">
      <Eyebrow>Financeiro</Eyebrow>
      <h2 className="font-heading font-semibold text-surface-900 mb-5">
        Formas de pagamento
      </h2>

      <div className="space-y-3">
        {MOCK_PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 rounded-lg border border-surface-200 bg-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-8 rounded-md bg-surface-100 flex items-center justify-center shrink-0" aria-hidden="true">
                <CreditCard size={16} strokeWidth={1.5} className="text-surface-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-surface-900">
                    {method.type === 'credit_card'
                      ? `${method.brand} **** ${method.last4}`
                      : method.label}
                  </p>
                  {method.isDefault && (
                    <Badge variant="brand" size="sm">Padrão</Badge>
                  )}
                </div>
                <p className="text-xs text-surface-500">
                  {method.type === 'credit_card' ? 'Cartão de crédito' : 'PIX'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              {!method.isDefault && (
                <button className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors duration-150">
                  Tornar padrão
                </button>
              )}
              <button className="text-xs font-medium text-error-600 hover:text-error-700 transition-colors duration-150">
                Remover
              </button>
            </div>
          </div>
        ))}

        <button
          className={cn(
            'w-full py-4 rounded-lg border-2 border-dashed border-surface-300 text-surface-500',
            'text-sm font-medium transition-colors duration-150',
            'hover:border-brand-300 hover:text-brand-700',
          )}
        >
          + Adicionar forma de pagamento
        </button>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Seção: Segurança + Encerrar sessão
// ---------------------------------------------------------------------------

function SecuritySection() {
  const [lgpdExportRequested, setLgpdExportRequested] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="space-y-4">
      {/* Trocar senha */}
      <Card variant="default" padding="lg">
        <Eyebrow>Segurança</Eyebrow>
        <h2 className="font-heading font-semibold text-surface-900 mb-5">
          Senha e acesso
        </h2>

        <Button variant="outline" size="md">
          Alterar senha
        </Button>

        <div className="mt-6 pt-6 border-t border-surface-100">
          <p className="text-sm text-surface-600 mb-4">
            Ao encerrar a sessão, você será redirecionado para a tela de login.
          </p>
          <Button
            variant="ghost"
            size="md"
            iconLeft={<LogOut size={16} strokeWidth={2} />}
            onClick={() => void signOut({ callbackUrl: '/login' })}
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          >
            Encerrar sessão
          </Button>
        </div>
      </Card>

      {/* LGPD */}
      <Card variant="default" padding="lg">
        <Eyebrow>Privacidade</Eyebrow>
        <h2 className="font-heading font-semibold text-surface-900 mb-2">
          Seus dados (LGPD)
        </h2>
        <p className="text-sm text-surface-500 mb-6 leading-relaxed">
          Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018),
          você pode exercer seus direitos sobre os dados pessoais armazenados pela WiseDrops.
        </p>

        {/* Exportar */}
        <div className="p-4 rounded-lg bg-surface-50 border border-surface-200 mb-4">
          <h3 className="text-sm font-semibold text-surface-900 mb-1">Exportar meus dados</h3>
          <p className="text-sm text-surface-500 mb-3">
            Solicite uma cópia de todos os dados pessoais armazenados. Você receberá
            um arquivo por e-mail em até 15 dias úteis.
          </p>
          {lgpdExportRequested ? (
            <p className="text-sm text-success-700 font-medium">
              Solicitação enviada. Você receberá os dados por e-mail.
            </p>
          ) : (
            <Button
              variant="sage"
              size="sm"
              onClick={() => setLgpdExportRequested(true)}
            >
              Solicitar exportação
            </Button>
          )}
        </div>

        {/* Excluir conta */}
        <div className="p-4 rounded-lg bg-error-50 border border-error-100">
          <h3 className="text-sm font-semibold text-error-800 mb-1">Excluir minha conta</h3>
          <p className="text-sm text-error-600 mb-3 leading-relaxed">
            Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
            Dados de prescrição e prontuário serão retidos pelo prazo legal (20 anos).
            Esta ação é irreversível.
          </p>
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-error-800">
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                >
                  Confirmar exclusão
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-error-700 hover:text-error-800 hover:bg-error-100 border border-error-300"
            >
              Excluir conta
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navegação lateral das seções
// ---------------------------------------------------------------------------

type SectionKey = 'personal' | 'addresses' | 'notifications' | 'anvisa' | 'payment' | 'security'

const SECTIONS: {
  key: SectionKey
  label: string
  icon: LucideIcon
}[] = [
  { key: 'personal', label: 'Dados pessoais', icon: User },
  { key: 'addresses', label: 'Endereços', icon: MapPin },
  { key: 'notifications', label: 'Notificações', icon: Bell },
  { key: 'anvisa', label: 'ANVISA', icon: ClipboardList },
  { key: 'payment', label: 'Pagamento', icon: CreditCard },
  { key: 'security', label: 'Segurança', icon: Shield },
]

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('personal')

  // Mock do nome do usuário (em produção viria de useSession)
  const profileName = MOCK_PROFILE.name

  return (
    <div>
      <PageHeader
        title="Meu perfil"
        subtitle="Gerencie suas informações e preferências."
        className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8"
      />

      <div className="pt-6">
        {/* Avatar + nome — bloco editorial */}
        <div className="flex items-center gap-5 mb-8">
          <Avatar name={profileName} size="xl" />
          <div>
            <p className="font-heading font-semibold text-surface-900 text-lg">{profileName}</p>
            <p className="text-sm text-surface-500 mt-0.5">{MOCK_PROFILE.email}</p>
            <p className="text-xs text-surface-400 mt-0.5">
              Upload de foto disponível em breve
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navegação lateral */}
          <nav
            className="lg:w-56 shrink-0"
            aria-label="Seções do perfil"
          >
            <Card variant="default" padding="none">
              <ul className="p-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.key
                  return (
                    <li key={section.key}>
                      <button
                        onClick={() => setActiveSection(section.key)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 text-left',
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-800'
                        )}
                      >
                        <Icon size={16} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" aria-hidden="true" />
                        {section.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </nav>

          {/* Conteúdo da seção */}
          <main className="flex-1 min-w-0">
            {activeSection === 'personal'      && <PersonalSection />}
            {activeSection === 'addresses'     && <AddressSection />}
            {activeSection === 'notifications' && <NotificationsSection />}
            {activeSection === 'anvisa'        && <AnvisaSection />}
            {activeSection === 'payment'       && <PaymentSection />}
            {activeSection === 'security'      && <SecuritySection />}
          </main>
        </div>
      </div>
    </div>
  )
}
