import Link from 'next/link'

export const metadata = {
  title: 'Termos de Uso · WiseDrops',
  description: 'Termos de uso da plataforma WiseDrops — cannabis medicinal.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-heading font-bold text-lg text-surface-900">
              Wise<span className="text-brand-600">Drops</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-surface-600 hover:text-brand-600 transition">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-overline text-brand-700 mb-3 uppercase tracking-widest font-semibold">Documento legal</p>
        <h1 className="font-heading font-bold text-4xl text-surface-900 tracking-tight mb-4">Termos de Uso</h1>
        <p className="text-surface-500 mb-12">Última atualização: 24 de junho de 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-body text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">1. Aceitação dos termos</h2>
            <p>
              Ao acessar e utilizar a plataforma WiseDrops, você concorda com estes Termos de Uso. Se não concordar com qualquer
              um dos termos, recomendamos que não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">2. Sobre a plataforma</h2>
            <p>
              A WiseDrops é uma plataforma de telemedicina especializada em cannabis medicinal. Conectamos pacientes a médicos
              prescritores certificados, intermediamos consultas por vídeo, hospedamos receitas digitais e orientamos o processo
              de autorização ANVISA (RDC 327/2019 e RDC 660/2022).
            </p>
            <p className="mt-3">
              <strong>Não somos uma farmácia</strong>. A dispensação de produtos é feita por estabelecimentos parceiros autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">3. Cadastro e responsabilidades</h2>
            <p>
              Você é responsável por fornecer informações verdadeiras, manter a segurança da sua senha e zelar pelo uso adequado
              da plataforma. Cadastros falsos ou tentativas de fraude resultam em suspensão imediata.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">4. Consultas médicas</h2>
            <p>
              As consultas são prestadas por médicos registrados nos respectivos conselhos regionais (CRM). A relação clínica
              estabelecida entre médico e paciente segue as normas do Conselho Federal de Medicina (CFM Resolução 2.314/2022) e
              do Código de Ética Médica.
            </p>
            <p className="mt-3">
              A WiseDrops não interfere em decisões clínicas. O médico tem autonomia profissional para prescrever, ajustar
              dosagens ou recusar prescrição.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">5. Pagamentos</h2>
            <p>
              O valor da consulta é exibido no momento do agendamento. Pagamentos são processados via gateways externos seguros
              (PayPal). A WiseDrops não armazena dados de cartão de crédito.
            </p>
            <p className="mt-3">
              Reembolsos são tratados caso a caso, conforme política de cancelamento vigente.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">6. Receitas e ANVISA</h2>
            <p>
              Receitas emitidas na plataforma são digitais e válidas conforme regulamentação vigente. O processo de autorização
              ANVISA (quando aplicável) tem prazo médio de 3 a 5 dias úteis e segue critérios próprios do órgão regulador.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">7. Limitação de responsabilidade</h2>
            <p>
              A WiseDrops oferece a infraestrutura tecnológica. Decisões clínicas, prescrições e resultados terapêuticos são de
              responsabilidade do médico assistente e do paciente, conforme prática médica.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">8. Alterações</h2>
            <p>
              Estes termos podem ser atualizados. Alterações relevantes serão comunicadas por e-mail aos usuários cadastrados.
              O uso continuado da plataforma após a notificação constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">9. Foro e legislação</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Eventuais disputas serão dirimidas no foro da comarca de São Paulo/SP,
              salvo disposição legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-h2 font-heading font-semibold text-surface-900 mb-3">10. Contato</h2>
            <p>
              Dúvidas sobre estes termos: <a href="mailto:contato@wisedrops.com.br" className="text-brand-700 underline">contato@wisedrops.com.br</a>{' '}
              ou <a href="https://wa.me/14073835692" className="text-brand-700 underline">WhatsApp +1 (407) 383-5692</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
