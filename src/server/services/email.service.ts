/**
 * Email Service — Resend
 *
 * Envia e-mails transacionais via Resend. Tudo é "fire-and-forget":
 * se RESEND_API_KEY não estiver setado, a função loga e retorna sem
 * lançar erro — o app continua funcionando.
 *
 * Use estes helpers em todos os pontos que disparam comunicação:
 * - sendDoctorNewConsultationEmail   → médico recebe quando paciente paga
 * - sendPatientConsultationConfirmedEmail → paciente recebe confirmação
 * - sendDoctorApprovedEmail          → médico aprovado pelo admin
 * - sendPatientPrescriptionReadyEmail → receita pronta
 * - sendPatientOrderConfirmedEmail   → pedido pago
 */

import { Resend } from 'resend'

const KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'WiseDrops <onboarding@resend.dev>'
const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? 'https://wisedrops.com'

let _client: Resend | null = null
function client(): Resend | null {
  if (!KEY) return null
  if (!_client) _client = new Resend(KEY)
  return _client
}

export function emailConfigured(): boolean {
  return !!KEY
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const c = client()
  if (!c) {
    console.log('[email] RESEND_API_KEY ausente, pulando envio:', { to, subject })
    return
  }
  try {
    const result = await c.emails.send({ from: FROM, to, subject, html })
    if (result.error) {
      console.error('[email] Resend retornou erro:', { to, subject, err: result.error })
    } else {
      console.log('[email] enviado:', { to, subject, id: result.data?.id })
    }
  } catch (err) {
    console.error('[email] exceção no envio:', { to, subject, err })
    // Nunca relança — e-mail nunca bloqueia o fluxo do app
  }
}

// ---------------------------------------------------------------------------
// Template helpers (HTML simples, on-brand)
// ---------------------------------------------------------------------------

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f7f5;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border:1px solid #ececec;border-radius:16px;padding:32px;">
      <div style="margin-bottom:24px;">
        <span style="font-size:22px;font-weight:700;color:#ea580c;">WiseDrops</span>
        <span style="color:#6b7280;font-size:14px;margin-left:8px;">cannabis medicinal</span>
      </div>
      ${body}
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #ececec;color:#9ca3af;font-size:12px;line-height:1.6;">
        Você está recebendo este e-mail porque tem conta ativa na WiseDrops.<br/>
        <a href="${BASE_URL}" style="color:#9ca3af;">${BASE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#ea580c;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}

// ---------------------------------------------------------------------------
// Helpers públicos
// ---------------------------------------------------------------------------

export async function sendDoctorNewConsultationEmail(input: {
  doctorEmail: string
  doctorName: string
  patientName: string
  patientHasQuiz: boolean
  scheduledAt: Date
  consultationId: string
}): Promise<void> {
  const when = fmtDateTime(input.scheduledAt)
  const consultUrl = `${BASE_URL}/doctor-consultations`
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Nova consulta confirmada</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">Dr(a). ${input.doctorName.split(' ')[0]},</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      <strong>${input.patientName}</strong> agendou e <strong>pagou</strong> uma consulta com você:
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#9a3412;">Quando</p>
      <p style="margin:0;font-size:16px;color:#1a1a1a;font-weight:600;">${when}</p>
    </div>
    ${
      input.patientHasQuiz
        ? `<p style="margin:0 0 20px;color:#374151;line-height:1.6;">
            <strong>A paciente completou o quiz inicial.</strong> Recomendamos ler as respostas antes do atendimento — isso ajuda a chegar direto ao ponto.
           </p>`
        : `<p style="margin:0 0 20px;color:#374151;line-height:1.6;">A paciente ainda não preencheu o quiz inicial.</p>`
    }
    <div style="margin:0 0 8px;">${button('Ver consulta no painel', consultUrl)}</div>
  `
  await send(input.doctorEmail, `Nova consulta com ${input.patientName.split(' ')[0]} — ${when}`, layout('Nova consulta', body))
}

export async function sendPatientConsultationConfirmedEmail(input: {
  patientEmail: string
  patientName: string
  doctorName: string
  scheduledAt: Date
  consultationId: string
}): Promise<void> {
  const when = fmtDateTime(input.scheduledAt)
  const url = `${BASE_URL}/consultations`
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Sua consulta está confirmada</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">Olá, ${input.patientName.split(' ')[0]}!</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Pagamento recebido. Sua consulta com <strong>${input.doctorName}</strong> está marcada para:
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#166534;">Data e horário</p>
      <p style="margin:0;font-size:16px;color:#1a1a1a;font-weight:600;">${when}</p>
    </div>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;font-size:14px;">
      Acesse o link da sala de vídeo no painel até <strong>10 minutos antes</strong> do horário. Use Chrome ou Safari atualizado, fone de ouvido e ambiente bem iluminado.
    </p>
    <div style="margin:0 0 8px;">${button('Ver minha consulta', url)}</div>
  `
  await send(input.patientEmail, `Consulta confirmada para ${when}`, layout('Consulta confirmada', body))
}

export async function sendDoctorApprovedEmail(input: {
  doctorEmail: string
  doctorName: string
}): Promise<void> {
  const url = `${BASE_URL}/doctor-dashboard`
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Sua conta de médico foi aprovada</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">Dr(a). ${input.doctorName.split(' ')[0]},</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Bem-vindo(a) à WiseDrops. Sua documentação foi verificada e seu perfil está ativo. Você já pode configurar sua agenda, valor de consulta e começar a atender.
    </p>
    <div style="margin:0 0 8px;">${button('Acessar painel', url)}</div>
  `
  await send(input.doctorEmail, 'Conta WiseDrops aprovada — pronto para atender', layout('Conta aprovada', body))
}

export async function sendPatientPrescriptionReadyEmail(input: {
  patientEmail: string
  patientName: string
  prescriptionId: string
}): Promise<void> {
  const url = `${BASE_URL}/prescriptions`
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Sua receita está pronta</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">${input.patientName.split(' ')[0]},</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Seu médico emitiu a receita digital. Você já pode usá-la para iniciar o processo de autorização ANVISA e comprar o produto na plataforma.
    </p>
    <div style="margin:0 0 8px;">${button('Ver receita', url)}</div>
  `
  await send(input.patientEmail, 'Sua receita está pronta na WiseDrops', layout('Receita pronta', body))
}

/** E-mail de boas-vindas ao paciente recém-cadastrado. */
export async function sendPatientWelcomeEmail(input: {
  patientEmail: string
  patientName: string
}): Promise<void> {
  const quizUrl = `${BASE_URL}/quiz`
  const uploadUrl = `${BASE_URL}/upload-receita`
  const firstName = input.patientName.split(' ')[0]
  const body = `
    <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a1a;">Bem-vindo(a) à WiseDrops, ${firstName}!</h1>
    <p style="margin:0 0 16px;color:#374151;line-height:1.6;">
      Sua conta foi criada com sucesso. Estamos aqui pra te conectar a médicos prescritores certificados em cannabis medicinal, com acompanhamento real do começo ao fim do tratamento.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">Como você prefere começar?</p>
      <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>1.</strong> Faça nosso diagnóstico inicial em 3 minutos e seja conectado ao médico ideal pra sua condição.
      </p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        <strong>2.</strong> Já tem receita médica? Pule pro upload de documentação e libere o catálogo direto.
      </p>
    </div>

    <div style="margin:0 0 12px;">${button('Fazer diagnóstico', quizUrl)}</div>
    <div style="margin:0 0 8px;">
      <a href="${uploadUrl}" style="color:#ea580c;font-size:14px;text-decoration:underline;">Já tenho receita →</a>
    </div>

    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp <a href="https://wa.me/14073835692" style="color:#ea580c;">+1 (407) 383-5692</a>.
    </p>
  `
  await send(input.patientEmail, `Bem-vindo à WiseDrops, ${firstName}!`, layout('Bem-vindo', body))
}

/** E-mail de cadastro recebido ao médico (antes da aprovação admin). */
export async function sendDoctorRegistrationReceivedEmail(input: {
  doctorEmail: string
  doctorName: string
}): Promise<void> {
  const firstName = input.doctorName.split(' ')[0]
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Cadastro recebido</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">Dr(a). ${firstName},</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Recebemos seu cadastro como médico prescritor na WiseDrops. Vamos analisar sua documentação (CRM, diploma, RDC 327) em até <strong>1 a 3 dias úteis</strong>.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin:0 0 20px;">
      <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">
        <strong>Próximo passo:</strong> Aguarde nosso e-mail confirmando a aprovação. Após aprovado, você acessa o painel pra configurar agenda, valor de consulta e começar a atender.
      </p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
      Dúvidas? Responde este e-mail ou WhatsApp <a href="https://wa.me/14073835692" style="color:#ea580c;">+1 (407) 383-5692</a>.
    </p>
  `
  await send(input.doctorEmail, 'Cadastro recebido — análise em 1 a 3 dias', layout('Cadastro recebido', body))
}

/** E-mail pós-quiz com resumo + próximo passo. */
export async function sendPatientQuizCompletedEmail(input: {
  patientEmail: string
  patientName: string
  riskLevel: string // 'low' | 'medium' | 'high'
  priorityCondition: string
  consultationFocus: string[]
}): Promise<void> {
  const url = `${BASE_URL}/medicos`
  const firstName = input.patientName.split(' ')[0]
  const riskLabel =
    input.riskLevel === 'high' ? 'Alta' :
    input.riskLevel === 'medium' ? 'Média' :
    'Baixa'
  const focusItems = input.consultationFocus.slice(0, 4).map((f) =>
    `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#e6ede6;color:#3a4f3a;font-size:12px;margin:0 4px 4px 0;">${f}</span>`
  ).join('')

  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;">Seu diagnóstico inicial está pronto, ${firstName}</h1>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Analisamos suas respostas e identificamos o foco da sua próxima consulta. Agora é hora de escolher um médico prescritor.
    </p>

    <div style="background:#f8f7f5;border:1px solid #e5e5e5;border-radius:10px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#737373;text-transform:uppercase;letter-spacing:1px;">Sua avaliação</p>
      <p style="margin:0 0 4px;color:#1a1a1a;font-size:15px;"><strong>Prioridade clínica:</strong> ${riskLabel}</p>
      <p style="margin:0 0 12px;color:#1a1a1a;font-size:15px;"><strong>Condição prioritária:</strong> ${input.priorityCondition}</p>
      ${focusItems ? `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#737373;">Foco da consulta</p><div>${focusItems}</div>` : ''}
    </div>

    <div style="margin:0 0 12px;">${button('Escolher médico', url)}</div>

    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Você tem médicos certificados em cannabis medicinal disponíveis pra consulta em até 48h. Sem custo de plataforma além do valor da consulta médica.
    </p>
  `
  await send(input.patientEmail, 'Sua avaliação está pronta — próximo passo: médico', layout('Avaliação pronta', body))
}

export async function sendPatientOrderConfirmedEmail(input: {
  patientEmail: string
  patientName: string
  orderId: string
  totalCents: number
}): Promise<void> {
  const total = (input.totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const url = `${BASE_URL}/orders`
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;">Pagamento confirmado</h1>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">${input.patientName.split(' ')[0]},</p>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6;">
      Recebemos seu pagamento de <strong>${total}</strong>. Estamos iniciando o protocolo ANVISA. Você receberá atualizações por aqui em cada etapa: aprovação, envio e entrega.
    </p>
    <div style="margin:0 0 8px;">${button('Acompanhar pedido', url)}</div>
  `
  await send(input.patientEmail, 'Pedido confirmado na WiseDrops', layout('Pedido confirmado', body))
}
