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
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:2px;">Bem-vindo à WiseDrops</p>
    <h1 style="margin:0 0 20px;font-size:28px;line-height:1.2;color:#1a1a1a;font-weight:700;letter-spacing:-0.02em;">
      Que bom ter você aqui, ${firstName}.
    </h1>

    <p style="margin:0 0 16px;color:#374151;line-height:1.7;font-size:16px;">
      A WiseDrops nasceu de uma frustração simples: tratamento com cannabis medicinal no Brasil ainda é uma jornada confusa, cara e desumana. Paciente correndo atrás de médico, atrás de receita, atrás de produto. Sem ninguém olhando o quadro inteiro.
    </p>

    <p style="margin:0 0 24px;color:#374151;line-height:1.7;font-size:16px;">
      A gente fez diferente. Aqui, você fala com médico de verdade — não chatbot. Recebe receita digital validada, com lastro ANVISA. Compra produto direto pela plataforma, com acompanhamento contínuo. E quem cuida de você é sempre o mesmo médico ao longo do tratamento.
    </p>

    <!-- 2 caminhos -->
    <div style="border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin:0 0 24px;background:#fafafa;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:2px;">Próximo passo</p>
      <p style="margin:0 0 20px;font-size:18px;color:#1a1a1a;font-weight:600;">Escolha como você quer começar:</p>

      <div style="border-left:3px solid #ea580c;padding:4px 16px;margin:0 0 16px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">1. Quero avaliação médica</p>
        <p style="margin:0;color:#525252;font-size:14px;line-height:1.5;">Faça nosso diagnóstico inicial em 3 minutos. Identificamos sua condição prioritária e te conectamos a um médico especialista em até 48h.</p>
      </div>

      <div style="border-left:3px solid #5b7d5b;padding:4px 16px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">2. Já tenho receita médica</p>
        <p style="margin:0;color:#525252;font-size:14px;line-height:1.5;">Pule a consulta. Faça upload da receita e documentação. Após aprovação (até 24h), libera o catálogo de produtos direto.</p>
      </div>
    </div>

    <div style="margin:0 0 12px;">${button('Fazer meu diagnóstico', quizUrl)}</div>
    <div style="margin:0 0 28px;">
      <a href="${uploadUrl}" style="color:#3a4f3a;font-size:14px;font-weight:600;text-decoration:none;border-bottom:1px solid #aabfaa;padding-bottom:1px;">Já tenho receita → enviar documentação</a>
    </div>

    <!-- Diferenciais -->
    <div style="border-top:1px solid #ececec;padding-top:24px;margin:0 0 24px;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:2px;">O que muda na WiseDrops</p>

      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td valign="top" style="padding:0 0 14px;width:32px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#fff7ed;text-align:center;line-height:28px;">
              <span style="font-size:14px;">✓</span>
            </div>
          </td>
          <td valign="top" style="padding:0 0 14px 12px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Médicos certificados em cannabis medicinal</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Todos com RDC 327, currículo verificado e formação específica.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" style="padding:0 0 14px;width:32px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#fff7ed;text-align:center;line-height:28px;">
              <span style="font-size:14px;">✓</span>
            </div>
          </td>
          <td valign="top" style="padding:0 0 14px 12px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Receita digital + ANVISA na mesma plataforma</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Sem corrida atrás de farmácia. A gente cuida do protocolo pra você.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" style="padding:0 0 14px;width:32px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#fff7ed;text-align:center;line-height:28px;">
              <span style="font-size:14px;">✓</span>
            </div>
          </td>
          <td valign="top" style="padding:0 0 14px 12px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Acompanhamento contínuo, mesmo médico</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Cannabis exige ajuste fino. Aqui você não é atendido por médico diferente toda vez.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" style="padding:0;width:32px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#f4f7f4;text-align:center;line-height:28px;">
              <span style="font-size:14px;">🔒</span>
            </div>
          </td>
          <td valign="top" style="padding:0 0 0 12px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Seus dados são protegidos pela LGPD</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Sigilo médico, criptografia e plataforma regulamentada ANVISA.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Suporte humano -->
    <div style="background:#f4f7f4;border-left:3px solid #5b7d5b;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 8px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1a1a1a;">Vai dar tudo certo. E se não der, a gente resolve.</p>
      <p style="margin:0;font-size:13px;color:#525252;line-height:1.6;">
        Qualquer coisa, responde esse e-mail ou chama no WhatsApp <a href="https://wa.me/14073835692" style="color:#3a4f3a;text-decoration:underline;font-weight:600;">+1 (407) 383-5692</a>.
        Tem gente real do outro lado, todos os dias.
      </p>
    </div>
  `
  await send(input.patientEmail, `${firstName}, sua jornada começa aqui ✨`, layout('Bem-vindo', body))
}

/** E-mail de cadastro recebido ao médico (antes da aprovação admin). */
export async function sendDoctorRegistrationReceivedEmail(input: {
  doctorEmail: string
  doctorName: string
}): Promise<void> {
  const firstName = input.doctorName.split(' ')[0]
  const body = `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:2px;">Cadastro recebido</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;color:#1a1a1a;font-weight:700;letter-spacing:-0.02em;">
      Obrigado por se cadastrar, Dr(a). ${firstName}.
    </h1>

    <p style="margin:0 0 16px;color:#374151;line-height:1.7;font-size:16px;">
      Cannabis medicinal precisa de médicos como você — sérios, com formação real e disposição pra ouvir o paciente em vez de receitar no escuro. Por isso a gente faz uma análise cuidadosa de cada cadastro antes de liberar.
    </p>

    <!-- Timeline -->
    <div style="border:1px solid #e5e5e5;border-radius:12px;padding:20px 24px;margin:0 0 24px;background:#fafafa;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:2px;">O que acontece agora</p>
      <p style="margin:0 0 18px;font-size:16px;color:#1a1a1a;font-weight:600;">3 etapas até você começar a atender:</p>

      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td valign="top" style="padding:0 0 14px;width:36px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#ea580c;color:#fff;text-align:center;line-height:28px;font-size:13px;font-weight:700;">1</div>
          </td>
          <td valign="top" style="padding:0 0 14px 14px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Análise da documentação</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Verificação CRM no portal CFM + diploma + RDC 327. Até 1-3 dias úteis.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" style="padding:0 0 14px;width:36px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#fed7aa;color:#9a3412;text-align:center;line-height:28px;font-size:13px;font-weight:700;">2</div>
          </td>
          <td valign="top" style="padding:0 0 14px 14px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">E-mail de aprovação</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Te avisamos quando estiver pronto pra acessar o painel completo.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" style="padding:0;width:36px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#fed7aa;color:#9a3412;text-align:center;line-height:28px;font-size:13px;font-weight:700;">3</div>
          </td>
          <td valign="top" style="padding:0 0 0 14px;">
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">Configuração e primeiro paciente</p>
            <p style="margin:2px 0 0;font-size:13px;color:#737373;line-height:1.5;">Defina sua agenda, valor de consulta e bio. Pacientes começam a chegar.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Diferenciais pro médico -->
    <div style="border-top:1px solid #ececec;padding-top:24px;margin:0 0 24px;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:2px;">Por que ser parte da WiseDrops</p>

      <p style="margin:0 0 12px;color:#374151;line-height:1.7;font-size:15px;">
        <strong style="color:#1a1a1a;">Captação feita pra você.</strong> Você foca no atendimento. A gente traz o paciente.
      </p>
      <p style="margin:0 0 12px;color:#374151;line-height:1.7;font-size:15px;">
        <strong style="color:#1a1a1a;">Prontuário eletrônico real.</strong> Quiz da paciente + histórico + receitas anteriores numa tela só antes de cada consulta.
      </p>
      <p style="margin:0;color:#374151;line-height:1.7;font-size:15px;">
        <strong style="color:#1a1a1a;">Compliance que protege você.</strong> Receita digital com lastro, ANVISA automatizada, LGPD.
      </p>
    </div>

    <div style="background:#f4f7f4;border-left:3px solid #5b7d5b;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 8px;">
      <p style="margin:0;font-size:13px;color:#525252;line-height:1.6;">
        Qualquer dúvida durante a análise: WhatsApp <a href="https://wa.me/14073835692" style="color:#3a4f3a;text-decoration:underline;font-weight:600;">+1 (407) 383-5692</a>.
      </p>
    </div>
  `
  await send(input.doctorEmail, `Dr(a). ${firstName}, recebemos seu cadastro`, layout('Cadastro recebido', body))
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
  const riskColor =
    input.riskLevel === 'high' ? '#b42318' :
    input.riskLevel === 'medium' ? '#b45309' :
    '#3a4f3a'
  const focusItems = input.consultationFocus.slice(0, 4).map((f) =>
    `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#e6ede6;color:#3a4f3a;font-size:12px;font-weight:600;margin:0 6px 6px 0;">${f}</span>`
  ).join('')

  const body = `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:2px;">Sua avaliação está pronta</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;color:#1a1a1a;font-weight:700;letter-spacing:-0.02em;">
      Boa, ${firstName}. Diagnóstico inicial completo.
    </h1>

    <p style="margin:0 0 24px;color:#374151;line-height:1.7;font-size:16px;">
      Lemos suas respostas com cuidado. Aqui está o que identificamos — e o próximo passo certo pra você.
    </p>

    <!-- Card resumo -->
    <div style="border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;margin:0 0 24px;">
      <div style="background:#fafafa;padding:14px 20px;border-bottom:1px solid #e5e5e5;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:2px;">Sua avaliação clínica</p>
      </div>
      <div style="padding:20px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr>
            <td valign="top" style="padding:0 0 14px;">
              <p style="margin:0 0 4px;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Prioridade clínica</p>
              <p style="margin:0;font-size:17px;color:${riskColor};font-weight:700;">${riskLabel}</p>
            </td>
          </tr>
          <tr>
            <td valign="top" style="padding:0 0 14px;">
              <p style="margin:0 0 4px;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Condição prioritária</p>
              <p style="margin:0;font-size:16px;color:#1a1a1a;font-weight:600;">${input.priorityCondition}</p>
            </td>
          </tr>
          ${focusItems ? `
          <tr>
            <td valign="top" style="padding:0;">
              <p style="margin:0 0 8px;font-size:12px;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Foco recomendado da consulta</p>
              <div>${focusItems}</div>
            </td>
          </tr>` : ''}
        </table>
      </div>
    </div>

    <!-- Próximo passo -->
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:2px;">Próximo passo</p>
      <p style="margin:0 0 8px;font-size:18px;color:#1a1a1a;font-weight:600;">Escolher seu médico prescritor</p>
      <p style="margin:0 0 16px;color:#525252;font-size:14px;line-height:1.6;">
        Temos médicos certificados em cannabis medicinal disponíveis pra consulta em até <strong>48 horas</strong>. Escolha pelo perfil que mais combina com você — bio, especialidade, valor, horários.
      </p>
      <div>${button('Ver médicos disponíveis', url)}</div>
    </div>

    <!-- Reforço de confiança -->
    <div style="border-top:1px solid #ececec;padding-top:20px;">
      <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
        <strong style="color:#1a1a1a;">Suas respostas são confidenciais.</strong> Só o médico que você escolher vai ter acesso. Nenhuma seguradora, nenhum dado de saúde sai daqui.
      </p>
      <p style="margin:0;font-size:13px;color:#737373;line-height:1.6;">
        Dúvida ou prefere falar antes de agendar? Chama no WhatsApp <a href="https://wa.me/14073835692" style="color:#c2410c;font-weight:600;text-decoration:underline;">+1 (407) 383-5692</a>.
      </p>
    </div>
  `
  await send(input.patientEmail, `${firstName}, sua avaliação está pronta`, layout('Avaliação pronta', body))
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
