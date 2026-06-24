# WiseDrops — Arquitetura de Produto
**Versão:** 1.0 · **Data:** 2026-06-24 · **Status:** Documento vivo, fonte da verdade arquitetural

> Este documento existe para responder a uma pergunta: **antes de pintar parede, qual é a planta da casa?** Aqui está o diagnóstico estrutural do WiseDrops, a arquitetura de informação proposta, e as decisões de produto que precedem qualquer design.

---

## 0. Tese

A WiseDrops não é um marketplace de telemedicina com cannabis no final. Não é um e-commerce de CBD com médico na frente. É — ou deveria ser — **a plataforma longitudinal de tratamento com cannabis medicinal no Brasil**.

Longitudinal é a palavra que muda tudo. Sem ela, a economia é venda transacional (consulta única, receita única, produto único) e o LTV mora num teto baixo. Com ela, a economia é assinatura terapêutica (paciente entra para tratar uma condição crônica por meses ou anos), e cada interação fortalece o vínculo.

Tudo neste documento parte dessa tese. Se ela mudar, o documento muda.

---

## 1. Diagnóstico arquitetural (o que está estruturalmente errado hoje)

Sete observações, em ordem de impacto:

### 1.1 Não temos 1 app, temos 3 apps no mesmo domínio
Paciente, médico e admin têm layouts próprios, sidebars próprias, mental models próprios. A coerência entre eles é coincidência, não arquitetura. Como resultado, o sistema parece três produtos sob a mesma marca. Apple Health é UM produto, com vistas diferentes para profissional e usuário. WiseDrops precisa virar isso.

**Consequência prática:** quando um paciente liga pro médico via vídeo, o médico abre OUTRO app pra ver o quiz dela — em vez do quiz estar embutido na sala. Quando o admin aprova um médico, o médico recebe um e-mail e some — não há onboarding visível no app dele. As pontes não existem.

### 1.2 Estados ocultos que o produto não conta
Há pelo menos 8 estados reais no domínio do paciente que existem na lógica do banco, mas **somem na UI**:

| Estado real | Hoje | O que devia ser |
|---|---|---|
| Quiz feito sem agendar | Lead morto | "Você completou seu diagnóstico inicial. Próximo passo: agendar consulta. [CTA]" |
| Aguardando pagamento de consulta | Tela genérica de "agendada" | "Sua consulta segura: pague em 1h ou o horário libera. [Pagar agora]" |
| Consulta acontecendo agora | Nada na dashboard | Banner global "Sua consulta começa em 5 min. [Entrar na sala]" |
| Consulta concluída sem receita | Vazio | "Aguardando seu médico emitir a receita (até 24h)" |
| Receita assinada, ANVISA pendente | Receita aparece como pronta, mas paciente não pode comprar | "Receita assinada. Aguardando autorização ANVISA (~3 dias)" + barra de progresso real |
| Pedido pago, aguardando despacho | Status "PAID" sem prazo | "Pago. Saída prevista: dia X. [Acompanhar]" |
| Tratamento ativo (com pedido recorrente próximo) | Nada | "Seu Sleep CBD acaba em ~10 dias. [Reabastecer]" |
| Paciente que sumiu (30+ dias sem voltar) | Não há sinalização interna | Estado de churn risk → trigger de email + sinal pro médico |

**Cada um desses estados precisa de:** nome curto, ícone, frase clara da próxima ação, prazo (quando houver), CTA explícito. Isso é design de produto, não de UI.

### 1.3 Jornada do paciente fragmentada em 9 telas sem wayfinding
Hoje a sidebar do paciente tem: Dashboard, Consultas, Quiz, Receitas, Documentos, Tratamento, Produtos, Pedidos, Prontuário, Perfil. Um paciente novo abre o app e **não sabe a ordem das coisas**. Sidebar com 10 itens é planilha, não produto.

A jornada real do paciente é:
```
DESCOBERTA → DIAGNÓSTICO → CONSULTA → RECEITA → ACESSO → ACOMPANHAMENTO
```

A IA atual mistura **objetos** (Consultas, Receitas, Pedidos) com **eventos** (Quiz, Tratamento) com **conteúdo** (Documentos, Prontuário). Isso é o sintoma de uma equipe que mapeou tabelas do banco no menu, não jornadas do usuário.

### 1.4 Médico não tem produto, tem painel administrativo
O portal do médico é uma planilha bonita. Lista de pacientes. Lista de consultas. Botão de assinar receita. Nada que ajude o médico a **praticar medicina melhor**.

O que falta no portal do médico (decisão de produto, não de design):
- **Briefing pré-consulta**: tela ÚNICA com quiz da paciente + histórico + última receita + observações próprias antes da consulta. Hoje isso está em 3 telas separadas.
- **Inbox de mensagens pós-consulta**: paciente faz pergunta de dúvida no terceiro dia de tratamento — chega no e-mail do médico ou some? Hoje some.
- **Métricas que importam ao médico**: no-show rate, tempo médio de atendimento, taxa de retorno, satisfação. Médico bom vai querer ver. Hoje só tem financeiro.
- **Modelo de receita**: médico digita do zero todo dia. Devia ter "templates" (receita-base para ansiedade, dor crônica, insônia) editáveis.

### 1.5 Não há identidade de produto, só identidade de marca
"Clínica que respira" é um conceito visual lindo (e correto). Mas não responde:
- Qual é o ato 1, 2, 3 da jornada do paciente?
- Qual é o momento de "wow" — aquele instante onde o paciente fala "isso aqui é diferente"?
- Qual é a voz do produto quando algo dá errado?
- Qual é a voz do produto quando algo dá certo?

Sem essas respostas, design é decoração. Com elas, design é dramaturgia.

### 1.6 Sistema de notificação inexistente
Hoje a comunicação acontece em silos:
- E-mail (Resend, plugado agora) → confirmação de consulta, pagamento, receita pronta
- App (zero notificações in-app)
- WhatsApp (zero)
- Push notification (zero)

O paciente que está em tratamento crônico precisa ser **lembrado de tomar a dose**, **avisado quando a receita está perto de vencer**, **alertado quando o pedido está perto de chegar**. Hoje nada disso existe. E não dá pra construir feature-by-feature — precisa de uma camada de notificação coerente.

### 1.7 Sem multi-tenancy, sem extensibilidade
Hoje o WiseDrops é um único tenant: pacientes, médicos e admin sob o mesmo guarda-chuva. Vai dar problema em 6 meses se:
- Uma clínica quiser oferecer "WiseDrops dela" (white-label)
- Quiser segmentar produtos por região (Cannabis BR vs CBD US)
- Quiser ter múltiplos administradores com escopo diferente

Decisão arquitetural agora: ou modela `Tenant`/`Workspace` no schema desde já (custa 1 sprint), ou aceita que multi-tenancy vai ser uma migração dolorosa no futuro (custa 1 mês).

---

## 2. Os 3 personas — releitura sob a tese longitudinal

### 2.1 Paciente
**Quem é**: 35-55 anos, urbano, dor crônica, ansiedade, insônia ou outra condição que dura meses ou anos. Não é "comprador de CBD curioso" — é alguém em busca de tratamento real. Já tentou outras coisas. Está cansado de não ser ouvido.

**O que ele realmente quer (Jobs To Be Done)**:
1. **Aliviar uma dor específica e contínua** — não comprar produto, aliviar
2. **Confiar em alguém que sabe** — médico que entende cannabis, não médico que receita às cegas
3. **Não ser tratado como criminoso ou usuário recreativo** — dignidade clínica
4. **Saber onde ele está no processo** — quando chega receita, quando chega produto, quando volta médico

**Anti-padrão atual**: tratamos ele como comprador. UI puxa pra "consulte → compre". Devíamos puxar pra "diagnostique → trate → acompanhe → ajuste".

### 2.2 Médico prescritor
**Quem é**: clínico geral, psiquiatra, neuro ou ortopedista que viu valor em cannabis medicinal, fez RDC 327, quer atender pacientes mas não quer construir clínica do zero.

**O que ele realmente quer**:
1. **Renda recorrente sem captação ativa** — paciente cair na mão sem ter que fazer marketing
2. **Ferramenta que respeita o tempo dele** — consulta de 30 min com tudo na tela, sem clicar em 5 telas
3. **Compliance que protege ele** — receita digital com lastro, ANVISA automatizada
4. **Continuidade do paciente** — não quer atender e ver o paciente sumir; quer acompanhar

**Anti-padrão atual**: tratamos ele como prestador transacional (pago por consulta). Devíamos tratar como **médico assistente de longo prazo do paciente**. Isso muda comissão, retorno, dashboard.

### 2.3 Admin (Bianca + time)
**Quem é**: você + um futuro time pequeno (suporte + farmácia + ANVISA + financeiro).

**O que precisa**:
1. **Visão de funil** (quantos pacientes em cada estágio: quiz → consulta → receita → pedido → tratamento ativo)
2. **Alertas operacionais** (pedido travado em ANVISA há 5 dias, paciente sem resposta há 7, médico com no-show acima de 20%)
3. **Aprovação de médicos** com fluxo claro (verificação CRM + diploma + RDC 327)
4. **Financeiro real** (gross, net, comissão médico, custo ANVISA, payout)

**Anti-padrão atual**: admin está modelado como "super-paciente que vê tudo". Devíamos modelar como **centro operacional** com sua própria gramática (filas, SLA, escalada).

---

## 3. Mapa de jornadas

### 3.1 Paciente novo (do zero ao tratamento ativo)
```
[Landing] → [Quiz] → [Resultado: "você se beneficia de avaliação médica"]
   → [Cadastro] → [Escolher médico] → [Pagar consulta] → [Aguardar dia]
   → [Sala de espera 10min antes] → [Consulta] → [Receita assinada]
   → [Aguardar ANVISA 3-5 dias] → [Comprar produto] → [Aguardar entrega]
   → [Começar tratamento] → [Diário de uso] → [Lembrete de retorno em 30d]
   → [Retorno] → [Ajuste de protocolo] → [Reabastecer]
```

**Momentos de fricção identificados:**
- Quiz → Cadastro: drop-off enorme. Paciente fez quiz, viu resultado, ANSIOSO porque viu que tem indicação. Cadastro precisa ser sem fricção (login social? só email + senha?).
- Pagar consulta: hoje só PayPal. Pacientes BR vão querer Pix.
- Aguardar ANVISA: 3-5 dias de silêncio aterroriza paciente. Precisa de barra de progresso real + e-mails de "ainda estamos esperando, é normal".
- Começar tratamento: paciente abriu o frasco e... agora? Falta protocolo escrito ("comece com 5 gotas por 7 dias, depois 8 gotas"). Sem isso, paciente acha que não funcionou e abandona.

### 3.2 Paciente recorrente (retorno + continuidade)
```
[Notificação 25 dias antes do fim do produto] → [Já tem receita válida?]
   → SIM: [Reabastecer em 1 clique]
   → NÃO: [Agendar retorno com mesmo médico] → [Consulta] → [Nova receita] → [Reabastecer]
```

**O que falta hoje:** essa jornada inteira. Hoje paciente que termina o frasco volta pro zero — abre o app, procura, agenda, paga. Devia ser 2 cliques.

### 3.3 Médico novo (cadastro até primeiro paciente)
```
[Convite/landing /seja-medico] → [Cadastro com CRM] → [Upload de docs]
   → [Aguardar aprovação admin 1-3 dias] → [Aprovado: e-mail de boas-vindas]
   → [Configurar agenda + valor + bio] → [Aparecer no marketplace de médicos]
   → [Receber primeira consulta] → [Atender] → [Receber pagamento]
```

**Onboarding zumbi**: após aprovação, médico hoje recebe e-mail e cai num dashboard vazio. Devia ter checklist: "configure agenda, faça bio, complete perfil, e aí a gente te coloca pra receber consultas".

### 3.4 Admin operacional (rotina diária)
```
[Login admin] → [Inbox: novos médicos pra aprovar (3), receitas travadas em ANVISA (2), pedidos atrasados (1), reclamações (0)]
   → [Resolver cada item] → [Ver dashboard semanal: receita, conversão, NPS]
```

**Hoje admin é desorganizado**: precisa procurar problemas em 4 telas diferentes. Devia ter **inbox unificado**.

---

## 4. Information Architecture proposta

Reorganização da navegação dos 3 portais, agrupada por **intent do usuário**, não por **tabela do banco**.

### 4.1 Paciente — 5 áreas (vs 10 atuais)

| Hoje | Proposta | Por quê |
|---|---|---|
| Dashboard | **Home** | Visão diária: próxima consulta, próxima dose, status do pedido, lembretes |
| Quiz · Consultas · Prontuário | **Tratamento** | Tudo da minha condição clínica (quiz, receitas, consultas, evolução) em ÚM lugar |
| Receitas · Documentos | (dentro de Tratamento) | Receita é parte do tratamento, não tela separada |
| Produtos · Pedidos | **Comprar** | Catálogo + meus pedidos |
| Tratamento · Treatment journal | (dentro de Tratamento) | Diário fica como sub-tela de Tratamento |
| Perfil | **Perfil** | Cadastro, dados, segurança |

**Resultado**: 4 áreas (Home, Tratamento, Comprar, Perfil) em vez de 10. Cabe na sidebar, cabe no mental model.

### 4.2 Médico — 4 áreas

| Hoje | Proposta | Por quê |
|---|---|---|
| Dashboard | **Hoje** | O dia de hoje: agenda, próxima consulta, alertas |
| Consultas (lista futura, passada) | (parte de Hoje + Pacientes) | Lista solta vira contextual: dentro de cada paciente |
| Pacientes | **Pacientes** | Lista + cada paciente tem briefing completo (quiz, histórico, receitas) numa tela |
| Receitas (criar nova) | (dentro do paciente) | Receita não é entidade isolada; é ato dentro de consulta |
| Agenda | **Agenda** | Configuração de disponibilidade + folgas |
| Financeiro | **Financeiro** | Ganhos, próximo payout, comissões |
| Produtos | (deletar) | Médico não vende produto; só receita. Esse menu não faz sentido. |

**Resultado**: 4 áreas (Hoje, Pacientes, Agenda, Financeiro). Mais foco.

### 4.3 Admin — 5 áreas

| Hoje | Proposta | Por quê |
|---|---|---|
| Dashboard | **Operacional** | Inbox unificado de problemas (médicos pra aprovar, ANVISA travado, pedidos atrasados) |
| Pedidos | **Pedidos** | Lista + busca + ações |
| Produtos | **Catálogo** | CRUD de produtos, estoque, preço |
| ANVISA queue | (parte de Operacional) | É um problema operacional, não área separada |
| Financeiro | **Financeiro** | Caixa, comissões, payout médicos |
| Médicos | **Pessoas** | Médicos + pacientes (admin precisa ver paciente individual quando há reclamação) |

**Resultado**: 5 áreas (Operacional, Pedidos, Catálogo, Financeiro, Pessoas).

### 4.4 Decisão arquitetural: rotas no Next 14

Hoje:
```
src/app/(patient)/dashboard/page.tsx
src/app/(patient)/consultations/page.tsx
src/app/(patient)/prescriptions/page.tsx
...
```

Proposta (renomeação não-destrutiva — manter URLs por compatibilidade, criar agrupamentos novos):
```
src/app/(patient)/home/page.tsx          ← era dashboard
src/app/(patient)/tratamento/page.tsx    ← novo (consolida quiz+consultas+receitas+prontuário+diário)
src/app/(patient)/tratamento/quiz/...
src/app/(patient)/tratamento/consultas/...
src/app/(patient)/tratamento/receitas/...
src/app/(patient)/tratamento/diario/...
src/app/(patient)/comprar/page.tsx       ← era products
src/app/(patient)/comprar/pedidos/...    ← era orders
src/app/(patient)/perfil/page.tsx        ← era profile
```

**Sem redirect quebrado**: rotas antigas viram redirects 301 pras novas. Compatibilidade total.

---

## 5. Sistema de estados — gramática única

Todo estado do produto que o usuário enxerga tem **4 atributos obrigatórios**:

1. **Nome curto** (1-3 palavras): "Aguardando ANVISA"
2. **Ícone semântico** (lucide): `Clock` (espera), `Loader` (processando), `CheckCircle` (concluído), `AlertCircle` (atenção), `XCircle` (erro/cancelado)
3. **Mensagem completa** (1-2 frases): "Sua receita foi assinada e está em análise na ANVISA. Em média leva 3 a 5 dias úteis."
4. **Próxima ação** (CTA ou nada): "Acompanhar" / "Acelerar contato" / "Cancelar pedido"

**Estados canônicos** (todos os módulos devem usar essa gramática):

### Consulta
- `Agendada` (Clock, sage) → "Consulta marcada para [data]. [Entrar na sala]" (15 min antes)
- `Em andamento` (Loader animado, brand) → "Consulta acontecendo agora. [Voltar à sala]"
- `Concluída – aguardando receita` (Clock, info) → "Aguardando seu médico emitir a receita (até 24h)"
- `Concluída` (CheckCircle, success) → "Consulta concluída. Receita disponível em [link]"
- `Cancelada` (XCircle, error) → "Consulta cancelada. [Reagendar]"

### Receita
- `Rascunho` (interno do médico, paciente não vê)
- `Assinada – aguardando ANVISA` (Loader, info) → "Em análise ANVISA (média 3-5 dias). [Acompanhar]"
- `Aprovada` (CheckCircle, success) → "Aprovada. Você pode comprar o produto. [Comprar agora]"
- `Recusada` (AlertCircle, error) → "Foi necessário corrigir um dado. [Ver mensagem do médico]"
- `Dispensada` (CheckCircle, sage) → "Receita usada para o pedido #X"
- `Expirada` (XCircle, surface-500) → "Receita venceu. [Agendar retorno]"

### Pedido
- `Aguardando pagamento` (Clock, warning) → "Pague em 1h ou o pedido é cancelado. [Pagar]"
- `Pago – em processamento` (Loader, info) → "Pagamento recebido. Preparando despacho."
- `Em rota` (Truck, info) → "Despachado dia X. Previsão: dia Y. [Rastrear]"
- `Entregue` (CheckCircle, success) → "Entregue dia X. [Iniciar tratamento]"
- `Cancelado` (XCircle, error) → "Cancelado. Reembolso em até 5 dias."

### Tratamento
- `Não iniciado` (Pause, surface-500) → "Comece quando receber o produto. [Ver protocolo]"
- `Em andamento` (Loader sutil, sage) → "Dia X de Y do tratamento. Próxima dose: [hora]"
- `Pausa` (Pause, warning) → "Tratamento pausado em [data]. [Retomar] [Falar com médico]"
- `Concluído` (CheckCircle, success) → "Tratamento concluído. [Agendar retorno?]"

### Médico
- `Pendente verificação` (Clock, warning) → admin vê. Médico vê: "Documentação em análise (1-3 dias)"
- `Ativo` (CheckCircle, success)
- `Suspenso` (AlertCircle, error)
- `Inativo voluntário` (Pause, surface-500)

**Cada estado vira componente reutilizável**: `<StatusBadge state="aguardando-anvisa" />` que renderiza nome+ícone+cor em qualquer lugar (lista, card, banner).

---

## 6. 5 Decisões arquiteturais (precisa de você)

### 6.1 O núcleo do produto é longitudinal? (Recomendação: SIM)
Se sim, todas as features priorizam **continuidade** sobre **conversão única**:
- Diário de uso vira central (paciente registra dose diária, evolução)
- Retorno automático em 30/60 dias
- Reabastecimento 1-click
- Médico tem alerta de paciente que sumiu
- Comissão do médico é recorrente (paga por consulta + percentual de produtos de pacientes dele)

Se não, voltamos ao modelo transacional que está hoje, e a economia do negócio segue limitada a CAC × ticket único.

### 6.2 Paciente é o usuário primário? (Recomendação: SIM)
Médico é meio, não fim. Toda decisão visual e arquitetural prioriza:
- "isso ajuda o paciente?" antes de "isso ajuda o médico/admin?"
- Quando há conflito (ex.: paciente quer cancelar consulta 1h antes; médico vai perder o slot), default protege o paciente.

### 6.3 Linear ou hub? (Recomendação: LINEAR pra paciente novo, HUB pra recorrente)
Paciente novo: **guiado**. Próximo passo claro sempre. Não deixa ele se perder.
Paciente recorrente: **hub livre**. Ele já sabe onde tudo está.

Implementação: cada paciente tem um `onboardingState` que muda a home. Paciente em estado "novo" vê só 1 CTA gigante ("Próximo passo: agendar consulta"). Em estado "ativo", vê dashboard rico.

### 6.4 Médico é vendedor ou prestador? (Recomendação: PRESTADOR DE RENDA RECORRENTE)
Não é marketplace de médicos (não competimos entre médicos por preço). É **plataforma de tratamento** onde:
- Médico é contratado pela WiseDrops (modelo de plataforma, não marketplace)
- Preço da consulta é tabela única (não cada médico cobra o seu)
- Médico ganha por consulta + bônus de retenção (paciente que ele atende e volta no mês X paga bônus em Y)
- Paciente é alocado por **especialidade necessária**, não por escolha de médico

Isso simplifica UI (não precisa de marketplace de busca de médico), aumenta retenção (paciente não fica "comprando preço") e dá previsibilidade ao médico.

### 6.5 Multi-tenancy: modelar agora ou depois? (Recomendação: MODELAR AGORA, COM TENANT ÚNICO)
Adicionar `Tenant`/`Workspace` no schema agora custa 1 sprint. Adicionar depois custa 1 mês de migração.

Implementação mínima:
```prisma
model Tenant {
  id    String @id @default(uuid())
  slug  String @unique   // wisedrops, clinicaX, clinicaY
  name  String
  brand Json              // logo, cores, nome de exibição
  ...
}
```
Todo `User`, `Doctor`, `Patient`, `Product` ganha `tenantId`. Pra hoje, tudo é o tenant `wisedrops`. Quando uma clínica quiser ter sua marca, é só criar outro tenant.

---

## 7. Princípios de produto (que vão guiar tudo)

Quatro frases. Devem caber na lapela de qualquer decisão.

### 7.1 Cada tela responde uma pergunta que o paciente está fazendo agora.
Se uma tela não responde a pergunta que o usuário está fazendo nesse momento, ela não existe.

### 7.2 O próximo passo é sempre visível, sempre claro, sempre 1 clique.
Paciente nunca pode estar numa tela e pensar "e agora o que eu faço?". Se pensar, falhamos.

### 7.3 O produto fala a verdade sobre o tempo.
"Em análise" é mentira. "Em análise ANVISA, em média 3-5 dias úteis, último update há 2 horas" é a verdade. Prazo, status, último contato — sempre.

### 7.4 Erros são pessoais; problemas são nossos.
Quando o paciente comete erro (errou senha, errou CEP), a copy é gentil ("acho que tem algo errado aqui — confere?"). Quando o produto falha (Daily caiu, ANVISA timeout), a copy reconhece ("tivemos um problema do nosso lado; vamos resolver e te avisar — não se preocupe").

---

## 8. Roadmap arquitetural (12 PRs em 4 ondas)

### Onda 1 — Fundação (já feita ou em curso)
- ✅ **PR 1** Tokens de design system v2
- ✅ **PR 2** Componentes UI base
- 🔄 **PR 3** Refator de layouts compartilhados (em background)

### Onda 2 — Refundação arquitetural
- **PR 4** Sistema de Estados unificado (StatusBadge + gramática)
- **PR 5** Sidebar reorganizada (5 áreas paciente, 4 médico, 5 admin) com redirects 301
- **PR 6** Schema multi-tenant (campo `tenantId`, tenant `wisedrops` default)

### Onda 3 — Telas críticas reescritas (jornada do paciente)
- **PR 7** `/home` paciente — visão "próximo passo" + estado contextual
- **PR 8** `/tratamento` consolidando quiz + consultas + receitas + diário
- **PR 9** `/comprar` reorganizado (catálogo + pedidos juntos, fluxo de checkout 1-clique pra recorrente)

### Onda 4 — Médico + admin
- **PR 10** Médico: tela única de "briefing pré-consulta" + inbox de mensagens
- **PR 11** Admin: inbox operacional unificado
- **PR 12** Onboarding linear pra paciente novo (1 CTA grande até o tratamento começar)

### Que sai do escopo deste documento (vai pra backlog)
- App nativo / PWA
- WhatsApp integration
- Pix (precisa decisão de gateway)
- ICP-Brasil (precisa decisão regulatória — quando se torna obrigatório?)
- Modo offline (vai precisar quando atender área rural)
- Internacionalização (quando expandir pro EUA)

---

## 9. Lista de coisas pra NÃO fazer (anti-padrões)

Coisas que parecem inovação mas vão te queimar:

- **NÃO crie um marketplace de médicos com fotos e avaliações.** Vira commodity, vira competição por preço, vira reclamação. Tabela única, alocação por especialidade.
- **NÃO gamifique tratamento médico.** Pontos, badges, "streak de 30 dias" — paciente em dor crônica não está procurando jogo. Está procurando alívio.
- **NÃO faça quiz com mais de 12 perguntas.** Cada pergunta a mais derruba conclusão em 8%. 8 perguntas é o limite.
- **NÃO mostre receita aprovada como "pronta pra comprar" enquanto ANVISA não autorizou.** Paciente vai clicar comprar e ver erro. Mostra o estado real.
- **NÃO faça onboarding de médico burocrático.** RDC 327, CRM, diploma — sim. 18 etapas — não. 3 etapas: dados, docs, e "vamos te chamar em 24h".
- **NÃO entregue informação clínica via chatbot.** Toda dúvida clínica passa pelo médico responsável (ou pelo médico de plantão). CX humano. Custa mais. Vale.
- **NÃO pense em "telemedicina" — pense em "acompanhamento longitudinal mediado por médico".** Telemedicina é commodity. Acompanhamento é categoria nova.

---

## 10. O que isso muda agora

Concretamente, nos PRs em curso e nos próximos:

1. **PR 3 (em background agora)**: continua, mas vira PR técnico-neutro — só unifica navbar/sidebar compartilhados. **Não reagrupa menu** (isso fica pra PR 5).
2. **PR 4 (era "telas públicas")**: vira **"Sistema de Estados"** primeiro. Sem isso, qualquer tela nova vai reinventar status do zero.
3. **PR 5**: nova IA da sidebar (5/4/5 áreas) com redirects de URLs antigas.
4. **PR 6**: schema multi-tenant.
5. **Décimo do tempo**: gasto em refundação. **Nove décimos**: gasto em telas que entregam jornada nova.

E o documento vivo: este aqui vira referência pra `wisedrops-design`, `wisedrops-dev-tech-lead`, `wisedrops-dev-frontend`, `wisedrops-dev-backend`. Toda dúvida arquitetural volta aqui.

---

## Apêndice: referências de plataformas que estudamos

Lista curta de produtos no estado-da-arte de saúde digital — boas referências de jornada (não de UI):

- **One Medical** (EUA) — clínica primária premium. Jornada de "1 médico pra você sempre". Inbox de mensagens com médico. App + presencial.
- **Forward Health** (EUA) — saúde preventiva. Tela de "estado de saúde" gigante. Dados longitudinais.
- **Hinge Health** (EUA) — fisioterapia digital longitudinal. Programa de 12 semanas. Onboarding LINEAR perfeito.
- **Maven Clinic** (EUA) — saúde feminina. Especialistas alocados por jornada (fertilidade, gestação, pós-parto). Modelo de alocação ≠ marketplace.
- **Cleerly** (EUA) — cardio. Cada exame vira "linha do tempo de saúde cardiovascular". Inspiração pra tela de Tratamento longitudinal.
- **Hims & Hers** (EUA) — DTC saúde masculina/feminina. Quiz curto + receita digital + assinatura. Inspiração pro fluxo paciente novo.
- **Apple Health** (genérico) — referência de identidade visual + hierarquia de informação. Não tem médico, mas tem o melhor design de "estado de saúde".

Nenhum deles serve de cópia. Todos servem de farol.

---

**Fim do documento.** Próxima revisão: após Bianca decidir as 5 perguntas da seção 6, ou quando PR 4 começar — o que vier primeiro.
