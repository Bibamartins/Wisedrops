'use client'

import { useState } from 'react'

// --- Types ---
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

// --- Mock Data ---
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
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01401-000',
    isDefault: true,
  },
  {
    id: 'addr-002',
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1578',
    complement: '12o andar',
    neighborhood: 'Bela Vista',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01310-200',
    isDefault: false,
  },
]

const MOCK_NOTIFICATIONS: NotificationPref[] = [
  { type: 'dose_reminder', label: 'Lembrete de Dose', email: false, push: true, whatsapp: true },
  { type: 'appointment', label: 'Consultas e Agendamentos', email: true, push: true, whatsapp: true },
  { type: 'order_update', label: 'Atualizacao de Pedido', email: true, push: true, whatsapp: false },
  { type: 'prescription_expiry', label: 'Vencimento de Receita', email: true, push: true, whatsapp: true },
  { type: 'promotions', label: 'Promocoes e Novidades', email: true, push: false, whatsapp: false },
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
    product: 'THC:CBD 1:1 Oleo 10mg/mL',
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

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<string>('personal')
  const [profile, setProfile] = useState(MOCK_PROFILE)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [isEditing, setIsEditing] = useState(false)
  const [editProfile, setEditProfile] = useState(MOCK_PROFILE)
  const [lgpdExportRequested, setLgpdExportRequested] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const sections = [
    { key: 'personal', label: 'Dados Pessoais', icon: '👤' },
    { key: 'addresses', label: 'Enderecos', icon: '📍' },
    { key: 'notifications', label: 'Notificacoes', icon: '🔔' },
    { key: 'anvisa', label: 'Autorizacoes ANVISA', icon: '📋' },
    { key: 'payment', label: 'Pagamento', icon: '💳' },
    { key: 'lgpd', label: 'Privacidade (LGPD)', icon: '🔒' },
  ]

  const toggleNotification = (index: number, channel: 'email' | 'push' | 'whatsapp') => {
    setNotifications((prev) =>
      prev.map((n, i) => (i === index ? { ...n, [channel]: !n[channel] } : n))
    )
  }

  const handleSaveProfile = () => {
    setProfile(editProfile)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-surface-900">Meu Perfil</h1>
        <p className="text-surface-500">Gerencie suas informacoes e preferencias</p>
      </div>

      {/* Profile Summary Card */}
      <div className="p-6 rounded-2xl gradient-brand text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {profile.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <p className="text-xl font-heading font-bold">{profile.name}</p>
            <p className="text-sm text-white/70">{profile.email}</p>
            <p className="text-sm text-white/70">{profile.phone}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="p-2 rounded-2xl bg-white border border-surface-200 shadow-sm">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-left ${
                  activeSection === section.key
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-50'
                }`}
              >
                <span>{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1">
          {/* === Personal Info === */}
          {activeSection === 'personal' && (
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-surface-900">Dados Pessoais</h2>
                {!isEditing ? (
                  <button
                    onClick={() => { setIsEditing(true); setEditProfile(profile) }}
                    className="px-4 py-2 rounded-lg border border-surface-200 text-surface-700 text-sm font-medium hover:bg-surface-50 transition"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg border border-surface-200 text-surface-500 text-sm font-medium hover:bg-surface-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium hover:opacity-90 transition"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  {[
                    { label: 'Nome Completo', value: profile.name },
                    { label: 'E-mail', value: profile.email },
                    { label: 'Telefone', value: profile.phone },
                    { label: 'CPF', value: profile.cpf },
                    { label: 'Data de Nascimento', value: new Date(profile.birthDate).toLocaleDateString('pt-BR') },
                    { label: 'Genero', value: profile.gender },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                      <span className="text-sm text-surface-500">{field.label}</span>
                      <span className="text-sm font-medium text-surface-900">{field.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Nome Completo', key: 'name' as const },
                    { label: 'E-mail', key: 'email' as const },
                    { label: 'Telefone', key: 'phone' as const },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm text-surface-500 mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={editProfile[field.key]}
                        onChange={(e) => setEditProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm text-surface-500 mb-1">CPF</label>
                    <input
                      type="text"
                      value={profile.cpf}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-surface-100 bg-surface-50 text-surface-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-surface-400 mt-1">CPF nao pode ser alterado</p>
                  </div>
                  <div>
                    <label className="block text-sm text-surface-500 mb-1">Genero</label>
                    <select
                      value={editProfile.gender}
                      onChange={(e) => setEditProfile((prev) => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option>Feminino</option>
                      <option>Masculino</option>
                      <option>Nao-binario</option>
                      <option>Prefiro nao informar</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === Addresses === */}
          {activeSection === 'addresses' && (
            <div className="space-y-4">
              {MOCK_ADDRESSES.map((addr) => (
                <div key={addr.id} className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-surface-900">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                          Padrao
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm text-brand-600 hover:underline">Editar</button>
                      {!addr.isDefault && (
                        <button className="text-sm text-red-500 hover:underline">Remover</button>
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
              <button className="w-full p-4 rounded-2xl border-2 border-dashed border-surface-300 text-surface-500 font-medium hover:border-brand-300 hover:text-brand-600 transition text-center">
                + Adicionar Novo Endereco
              </button>
            </div>
          )}

          {/* === Notifications === */}
          {activeSection === 'notifications' && (
            <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
              <h2 className="font-heading font-semibold text-surface-900 mb-6">Preferencias de Notificacao</h2>

              {/* Header */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 mb-4 pb-3 border-b border-surface-200">
                <span className="text-xs text-surface-500 uppercase tracking-wide">Tipo</span>
                <span className="text-xs text-surface-500 uppercase tracking-wide w-16 text-center">E-mail</span>
                <span className="text-xs text-surface-500 uppercase tracking-wide w-16 text-center">Push</span>
                <span className="text-xs text-surface-500 uppercase tracking-wide w-20 text-center">WhatsApp</span>
              </div>

              {notifications.map((notif, i) => (
                <div key={notif.type} className="grid grid-cols-[1fr,auto,auto,auto] gap-4 py-3 items-center border-b border-surface-100 last:border-0">
                  <span className="text-sm text-surface-700">{notif.label}</span>
                  {(['email', 'push', 'whatsapp'] as const).map((channel) => (
                    <div key={channel} className={channel === 'whatsapp' ? 'w-20 flex justify-center' : 'w-16 flex justify-center'}>
                      <button
                        onClick={() => toggleNotification(i, channel)}
                        className={`w-11 h-6 rounded-full transition relative ${
                          notif[channel] ? 'bg-brand-500' : 'bg-surface-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            notif[channel] ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* === ANVISA Authorizations === */}
          {activeSection === 'anvisa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">ℹ️</span>
                  <p className="text-sm text-blue-800">
                    As autorizacoes ANVISA sao emitidas automaticamente quando voce compra um produto importado.
                    Cada autorizacao e valida por 1 ano.
                  </p>
                </div>
              </div>

              {MOCK_ANVISA_AUTHS.map((auth) => (
                <div key={auth.id} className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-surface-900">{auth.protocol}</p>
                      <p className="text-sm text-surface-600 mt-1">{auth.product}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        auth.status === 'ACTIVE'
                          ? 'bg-brand-100 text-brand-700'
                          : auth.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-surface-100 text-surface-500'
                      }`}
                    >
                      {auth.status === 'ACTIVE' && 'Ativa'}
                      {auth.status === 'PENDING' && 'Pendente'}
                      {auth.status === 'EXPIRED' && 'Expirada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-surface-500">
                    <span>Emissao: {new Date(auth.issuedDate).toLocaleDateString('pt-BR')}</span>
                    <span>Validade: {new Date(auth.expiresDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === Payment Methods === */}
          {activeSection === 'payment' && (
            <div className="space-y-4">
              {MOCK_PAYMENT_METHODS.map((method) => (
                <div key={method.id} className="p-5 rounded-2xl bg-white border border-surface-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
                        <span className="text-lg">{method.type === 'pix' ? '⚡' : '💳'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-surface-900">
                            {method.type === 'credit_card'
                              ? `${method.brand} **** ${method.last4}`
                              : method.label}
                          </p>
                          {method.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
                              Padrao
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500">
                          {method.type === 'credit_card' ? 'Cartao de Credito' : 'PIX'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <button className="text-xs text-brand-600 hover:underline">Tornar padrao</button>
                      )}
                      <button className="text-xs text-red-500 hover:underline">Remover</button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full p-4 rounded-2xl border-2 border-dashed border-surface-300 text-surface-500 font-medium hover:border-brand-300 hover:text-brand-600 transition text-center">
                + Adicionar Forma de Pagamento
              </button>
            </div>
          )}

          {/* === LGPD === */}
          {activeSection === 'lgpd' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-surface-200 shadow-sm">
                <h2 className="font-heading font-semibold text-surface-900 mb-2">Privacidade e Dados</h2>
                <p className="text-sm text-surface-500 mb-6">
                  Em conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018),
                  voce pode exercer seus direitos sobre os dados pessoais armazenados pela WiseDrops.
                </p>

                {/* Export Data */}
                <div className="p-5 rounded-xl bg-surface-50 border border-surface-200 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-surface-900 mb-1">Exportar Meus Dados</h3>
                      <p className="text-sm text-surface-500">
                        Solicite uma copia de todos os dados pessoais armazenados. Voce recebera
                        um arquivo por e-mail em ate 15 dias uteis.
                      </p>
                    </div>
                  </div>
                  {lgpdExportRequested ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-brand-600">
                      <span>✅</span> Solicitacao enviada. Voce recebera os dados por e-mail.
                    </div>
                  ) : (
                    <button
                      onClick={() => setLgpdExportRequested(true)}
                      className="mt-3 px-4 py-2 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition"
                    >
                      Solicitar Exportacao
                    </button>
                  )}
                </div>

                {/* Delete Account */}
                <div className="p-5 rounded-xl bg-red-50 border border-red-200">
                  <h3 className="font-medium text-red-800 mb-1">Excluir Minha Conta</h3>
                  <p className="text-sm text-red-600 mb-3">
                    Ao excluir sua conta, todos os seus dados serao permanentemente removidos. Dados
                    de prescricao e prontuario serao retidos pelo prazo legal (20 anos). Esta acao
                    e irreversivel.
                  </p>
                  {showDeleteConfirm ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-800">
                        Tem certeza? Esta acao nao pode ser desfeita.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 rounded-lg border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition"
                        >
                          Cancelar
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition">
                          Confirmar Exclusao
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-100 transition"
                    >
                      Excluir Conta
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
