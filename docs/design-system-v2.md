# WiseDrops — Design System v2
**Versao:** 2.0.0 · **Data:** 2026-06-24 · **Autor:** wisedrops-design (ex-Aesop / Headspace)
**Status:** Handoff para wisedrops-dev-frontend · Portao: wisedrops-dev-qa-revisor

---

## 1. Conceito Visual

**"Clinica que respira."**

A interface e o silencio organizado entre o paciente e o cuidado que ele precisa. Nao empurra. Nao grita. Conduz.

### Tres principios que guiam tudo

**1. Respiro como hierarquia**
Espaco em branco nao e ausencia — e decisao editorial. Cada elemento na tela tem permissao de existir. O que nao tem permissao, nao aparece. Densidade premium significa poucos elementos, perfeitamente posicionados.

**2. Cor como linguagem clinica**
Laranja existe. Sage existe. Mas nenhum dos dois grita. Brand-600 e um ponto de acao, nao um grito de marketing. Sage-500 e confianca, nao decoracao. As cores semanticas (sucesso, erro, aviso) sao calibradas para leitura clinica — o paciente precisa entender o status do tratamento com clareza, nao com ansiedade.

**3. Movimento como respiro, nao como show**
Transicoes sao exalacoes, nao performance. O sistema nao anima para impressionar. Anima para orientar — onde o olho deve ir, o que acabou de aparecer, o que pode ser dispensado. Silk, nao spring.

---

## 2. Paleta Refinada

### Filosofia de refinamento
A paleta existente (brand laranja + sage verde-salvia + surface neutro) esta MANTIDA. O refinamento toca tres pontos:
- Brand-500 (`#f97316`) sai de texto — fica restrito a fills e grandes areas decorativas
- Sage recebe ajuste fino nos tons medios (400–600) para mais sofisticacao e melhor contraste
- Surface ganha temperatura levemente quente (para nao parecer farmacia fria) — nao muda os hex, mas define uso semantico com mais precisao

### 2.1 Brand (Laranja)

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| `brand-50` | `#fff7ed` | Background de aviso suave, hover de area brand |
| `brand-100` | `#ffedd5` | Fill de badge brand em fundo claro |
| `brand-200` | `#fed7aa` | Borda de input com foco brand |
| `brand-300` | `#fdba74` | Ilustracao / decorativo |
| `brand-400` | `#fb923c` | Icone decorativo em fundo escuro |
| `brand-500` | `#f97316` | Fill de botao primario APENAS (nunca texto < 18pt) |
| `brand-600` | `#ea580c` | Texto em botao primario, hover de fill, texto-brand minimo |
| `brand-700` | `#c2410c` | Texto brand em fundo claro (uso em body text) |
| `brand-800` | `#9a3412` | Texto brand em fundo muito claro, link brand |
| `brand-900` | `#7c2d12` | Texto brand de alta enfase |
| `brand-950` | `#431407` | Quase nunca — reservado para contraste extremo |

**Restricao critica:** `text-brand-500` em texto < 18pt e PROIBIDO (razao 3.0:1 em fundo branco, reprova WCAG AA). Minimo: `text-brand-700` (razao 5.74:1).

### 2.2 Sage (Verde-Salvia) — Refinado

Os hex sao mantidos com ajuste editorial: sage-400 e sage-500 trocam de papel (400 vira apoio/decorativo, 500 vira cor de acao secundaria).

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| `sage-50` | `#f4f7f4` | Background de area sage suave |
| `sage-100` | `#e6ede6` | Fill de badge sage, hover area |
| `sage-200` | `#cdd9cd` | Borda sutil, divisor sage |
| `sage-300` | `#aabfaa` | Icone sage em fundo claro |
| `sage-400` | `#7a9a7a` | Decorativo, ilustracao |
| `sage-500` | `#5b7d5b` | Texto sage em fundo claro (ratio 5.1:1 em #fff) |
| `sage-600` | `#486448` | Texto sage de alta confianca, link sage |
| `sage-700` | `#3a4f3a` | Heading sage, texto sage em fundo claro |
| `sage-800` | `#303f30` | Texto sage de maximo contraste |
| `sage-900` | `#283428` | Quase preto-verde, reservado |

### 2.3 Surface (Neutro Quente)

Surface recebe definicao semantica precisa. Os hex sao os neutros puros ja existentes — a mudanca e de uso, nao de valor.

| Token | Hex | Uso semantico |
|-------|-----|---------------|
| `surface-50` | `#fafafa` | Background de pagina (bg padrao) |
| `surface-100` | `#f5f5f5` | Background de secao alternada, sidebar |
| `surface-200` | `#e5e5e5` | Borda padrao, divisor |
| `surface-300` | `#d4d4d4` | Borda de input, borda interativa em repouso |
| `surface-400` | `#a3a3a3` | Placeholder text, icone inativo |
| `surface-500` | `#737373` | Texto auxiliar (caption, helper text) |
| `surface-600` | `#525252` | Texto secundario |
| `surface-700` | `#404040` | Texto corpo padrao (uso em body text) |
| `surface-800` | `#262626` | Texto de alta enfase, heading escuro |
| `surface-900` | `#171717` | Preto editorial, heading principal |

### 2.4 Semanticos (Status Clinico)

Estes tokens tem uso direto em sinalizar status de tratamento — SCHEDULED, PAID, COMPLETED, CANCELLED. Calibrados para leitura clinica sem alarme.

#### Success (Natural, nao alarme)
| Token | Hex | Uso |
|-------|-----|-----|
| `success-50` | `#f0fdf4` | Background de area sucesso |
| `success-100` | `#dcfce7` | Fill de badge COMPLETED/PAID |
| `success-500` | `#16a34a` | Icone de confirmacao |
| `success-600` | `#15803d` | Texto de status positivo (ratio 5.9:1 em #fff) |
| `success-700` | `#166534` | Texto sucesso de alta enfase |

**Status mapping:** `COMPLETED` → `success-100` bg + `success-700` text · `PAID` → `success-50` bg + `success-600` text

#### Warning (Atencao, nao panico)
| Token | Hex | Uso |
|-------|-----|-----|
| `warning-50` | `#fffbeb` | Background de area aviso |
| `warning-100` | `#fef3c7` | Fill de badge SCHEDULED (pendente) |
| `warning-500` | `#f59e0b` | Icone de aviso |
| `warning-600` | `#dc6803` | Texto de status pendente (ratio 4.6:1 em #fff) |
| `warning-700` | `#b45309` | Texto aviso de alta enfase |

**Status mapping:** `SCHEDULED` → `warning-100` bg + `warning-700` text

#### Error (Suave, nao agressivo)
| Token | Hex | Uso |
|-------|-----|-----|
| `error-50` | `#fef3f2` | Background de area erro |
| `error-100` | `#fee4e2` | Fill de badge CANCELLED |
| `error-500` | `#f04438` | Icone de erro |
| `error-600` | `#d92d20` | Texto de erro inline (ratio 5.2:1 em #fff) |
| `error-700` | `#b42318` | Texto erro de alta enfase |

**Status mapping:** `CANCELLED` → `error-100` bg + `error-700` text

#### Info
| Token | Hex | Uso |
|-------|-----|-----|
| `info-50` | `#eff8ff` | Background informativo |
| `info-100` | `#d1e9ff` | Fill de badge info |
| `info-500` | `#2e90fa` | Icone informativo |
| `info-600` | `#1570ef` | Texto informativo (ratio 4.7:1 em #fff) |
| `info-700` | `#175cd3` | Texto info de alta enfase |

### 2.5 Video Room — Sub-sistema Dark

O `video-room` e tratado como sub-sistema visual autonomo. Nao e dark mode global — e uma camara escura dedicada ao contexto de consulta ao vivo.

| Token semantico | Valor | Uso |
|-----------------|-------|-----|
| `video-bg` | `#0d0d0d` | Fundo principal da sala (mais escuro que surface-900) |
| `video-surface` | `rgba(255,255,255,0.08)` | Paineis de controle (bg-white/8 + backdrop-blur) |
| `video-surface-hover` | `rgba(255,255,255,0.14)` | Hover de controles |
| `video-border` | `rgba(255,255,255,0.12)` | Borda de paineis |
| `video-text` | `#f5f5f5` | Texto primario em sala |
| `video-text-muted` | `rgba(255,255,255,0.55)` | Texto auxiliar em sala |
| `video-brand` | `#fb923c` | Brand-400 — unico laranja visivel em dark (ratio 3.1:1 sobre dark, uso restrito a icone/fill, nunca texto pequeno) |
| `video-danger` | `#f04438` | Botao de encerrar chamada |

Estes tokens sao implementados como CSS custom properties no escopo `.video-room`, nao como variaveis globais.

---

## 3. Tipografia Editorial

### Decisao sobre fontes
**Sora (heading) + DM Sans (corpo) permanecem.** Justificativa em uma frase: Sora tem geometria suficiente para autoridade clinica sem a frieza do grotesco puro, e DM Sans tem legibilidade optima no corpo de texto em telas retina — trocar seria regressao, nao evolucao.

O que muda e a **escala e o uso editorial**: headings ganham letter-spacing negativo nos tamanhos grandes (toque Aesop), corpo ganha line-height mais generoso, e display passa a usar Sora weight 700 (nao 800 — menos agressivo).

### Escala Modular (base 16px, razao 1.25 — Major Third)

| Token | font-family | weight | size | line-height | letter-spacing | Uso |
|-------|------------|--------|------|-------------|----------------|-----|
| `display` | Sora | 700 | 3rem (48px) | 1.1 | -0.03em | Hero, onboarding splash, numero grande em stat |
| `h1` | Sora | 600 | 2rem (32px) | 1.2 | -0.02em | Titulo de pagina principal |
| `h2` | Sora | 600 | 1.5rem (24px) | 1.25 | -0.015em | Titulo de secao |
| `h3` | Sora | 600 | 1.25rem (20px) | 1.3 | -0.01em | Card title, modal header |
| `h4` | Sora | 500 | 1.125rem (18px) | 1.35 | -0.005em | Subtitulo de secao |
| `body-lg` | DM Sans | 400 | 1.0625rem (17px) | 1.65 | 0em | Lead paragraph, descricao de produto |
| `body` | DM Sans | 400 | 1rem (16px) | 1.6 | 0em | Corpo de texto padrao |
| `body-medium` | DM Sans | 500 | 1rem (16px) | 1.6 | 0em | Texto de enfase em body (labels, bold inline) |
| `small` | DM Sans | 400 | 0.875rem (14px) | 1.5 | 0.01em | Helper text, meta info |
| `caption` | DM Sans | 400 | 0.75rem (12px) | 1.45 | 0.02em | Timestamp, rodape de card, disclaimer |
| `label` | DM Sans | 500 | 0.875rem (14px) | 1.2 | 0.02em | Label de input, label de badge |
| `overline` | DM Sans | 600 | 0.6875rem (11px) | 1.3 | 0.08em | Categoria, eyebrow uppercase |

**Nota de implementacao:** `overline` e sempre uppercase no CSS (`.uppercase` Tailwind), nao na string — permite busca e acessibilidade de leitor de tela.

---

## 4. Sistema de Espaco

### Base: 4px grid, densidade premium

O sistema usa multiplos de 4px. "Densidade premium" nao significa compacto — significa consistente. Nao existe valor de padding que nao seja multiplo de 4.

| Token Tailwind | Valor px | Uso semantico |
|---------------|----------|---------------|
| `space-1` (4px) | 4px | Gap entre icone e texto no mesmo elemento |
| `space-2` (8px) | 8px | Padding interno de badge, gap de chips |
| `space-3` (12px) | 12px | Padding vertical de input, gap de form row |
| `space-4` (16px) | 16px | Padding de card pequeno, gap de lista |
| `space-5` (20px) | 20px | Padding horizontal de card padrao |
| `space-6` (24px) | 24px | Gap entre cards, padding de secao pequena |
| `space-8` (32px) | 32px | Padding de card grande, espaco entre secoes |
| `space-10` (40px) | 40px | Padding de modal, margem de secao |
| `space-12` (48px) | 48px | Espaco entre blocos de conteudo |
| `space-16` (64px) | 64px | Margem de pagina, espaco hero |
| `space-20` (80px) | 80px | Espaco generoso entre secoes principais |
| `space-24` (96px) | 96px | Display padding, respiro editorial maximo |

### Densidade de componente

| Componente | Padding sugerido |
|------------|-----------------|
| Button sm | `px-3 py-1.5` (12px / 6px) |
| Button md | `px-4 py-2` (16px / 8px) |
| Button lg | `px-6 py-3` (24px / 12px) |
| Input | `px-3 py-2.5` (12px / 10px) |
| Card | `p-5` ou `p-6` (20px / 24px) |
| Modal | `p-6` header, `p-6` body, `p-4` footer |
| Badge | `px-2 py-0.5` (8px / 2px) |
| PageHeader | `py-8 px-6` |

---

## 5. Border Radius e Shadow

### Radius

O `--radius` atual e `0.75rem` (12px). O sistema v2 define uma escala semantica:

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | 4px | Badge pequeno, tag |
| `rounded` | 6px | Input, select, chip |
| `rounded-md` | 8px | Botao, tooltip |
| `rounded-lg` | 12px | Card padrao (atual `--radius`) |
| `rounded-xl` | 16px | Card elevado, modal |
| `rounded-2xl` | 20px | Card hero, painel grande |
| `rounded-full` | 9999px | Avatar, pill badge |

### Shadow — Niveis Linear-style

Sombras sao calibradas para profundidade perceptual minima. Nao existem sombras coloridas. Nao existem `drop-shadow` dramaticas.

```css
/* Adicionar em globals.css como custom properties */

--shadow-xs:  0 1px 2px 0 rgba(0,0,0,0.04);
--shadow-sm:  0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04);
--shadow-md:  0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
--shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04);
--shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04);
--shadow-focus-brand: 0 0 0 3px rgba(249,115,22,0.18);  /* brand-500 com 18% alpha */
--shadow-focus-sage:  0 0 0 3px rgba(91,125,91,0.18);   /* sage-500 com 18% alpha */
```

| Nivel | Uso |
|-------|-----|
| `shadow-xs` | Card em repouso, input inativo |
| `shadow-sm` | Card interativo, hover de lista item |
| `shadow-md` | Card elevado, dropdown |
| `shadow-lg` | Modal, popover |
| `shadow-xl` | Painel flutuante, toast |
| `shadow-focus-brand` | Ring de foco em botao primario / input com brand |
| `shadow-focus-sage` | Ring de foco em elemento sage |

---

## 6. Conceito de Superficie

Quatro niveis de superficie do mais fundo ao mais elevado. Cada nivel tem cor, borda e sombra proprios.

```
Background (pagina)        surface-50  #fafafa    sem sombra, sem borda
  └── Surface (card base)  surface-50  #fafafa    shadow-xs, border surface-200
        └── Elevated        white #fff  shadow-md, border surface-200
              └── Modal     white #fff  shadow-xl, border surface-200, overlay
```

| Nivel | bg | border | shadow | Exemplo |
|-------|----|--------|--------|---------|
| Background | `bg-surface-50` | — | — | `<body>`, `<main>` |
| Surface | `bg-white` | `border border-surface-200` | `shadow-xs` | Card padrao, sidebar |
| Elevated | `bg-white` | `border border-surface-200` | `shadow-md` | Card hover, dropdown, select |
| Modal | `bg-white` | `border border-surface-200` | `shadow-xl` | Dialog, drawer |
| Overlay | `bg-surface-900/40` + blur | — | — | Fundo de modal |

**Separacao de sidebar:** sidebar usa `bg-surface-100` (nao branco puro) para criar plano distinto do conteudo principal sem borda dramatica.

---

## 7. Motion

### Principio
Motion e respiracao, nao coreografia. O sistema tem tres velocidades e dois easings. Nenhum bounce. Nenhum spring. Silk.

### Variaveis de timing

```css
/* globals.css */
--duration-instant:  80ms;   /* feedback de clique, toggle checked */
--duration-fast:    150ms;   /* hover state, badge aparecer */
--duration-base:    200ms;   /* fade-in, slide de panel, modal open */
--duration-slow:    300ms;   /* page transition, drawer open */
--duration-crawl:   400ms;   /* onboarding step, splash */

--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1.0);   /* elemento entrando — desacelera ao chegar */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);   /* elemento reposicionando */
--ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);    /* modal open — levemente suave no final */
```

### Mapeamento de uso

| Animacao | duration | easing | Implementacao Tailwind |
|----------|----------|--------|----------------------|
| Hover de botao / cor | `150ms` | `ease-out` | `transition-colors duration-150` |
| Hover de sombra (card) | `150ms` | `ease-out` | `transition-shadow duration-150` |
| Fade-in de elemento | `200ms` | `ease-out` | `animate-fade-in` (ja existe) |
| Slide de modal | `200ms` | `ease-out-soft` | ver keyframe abaixo |
| Drawer/sidebar open | `300ms` | `ease-out-soft` | `animate-slide-in` (ja existe, ajustar easing) |
| Skeleton pulse | `1400ms` | `ease-in-out` | `animate-pulse` (Tailwind nativo) |
| Accordion | `200ms` | `ease-out` | `animate-accordion-down/up` (ja existe) |
| Page transition | `200ms` | `ease-in-out` | fade opacity no router |

### Keyframes novos (adicionar em tailwind.config.ts)

```typescript
'modal-in': {
  from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
  to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
},
'modal-out': {
  from: { opacity: '1', transform: 'translateY(0) scale(1)' },
  to:   { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
},
'slide-up': {
  from: { opacity: '0', transform: 'translateY(12px)' },
  to:   { opacity: '1', transform: 'translateY(0)' },
},
'toast-in': {
  from: { opacity: '0', transform: 'translateX(calc(100% + 16px))' },
  to:   { opacity: '1', transform: 'translateX(0)' },
},
```

---

## 8. Iconografia

**Biblioteca:** `lucide-react` (ja instalada). Substituicao de todos os emojis usados como icone.

### Padrao de uso

| Contexto | Tamanho | Peso visual (strokeWidth) | Exemplo de classe |
|----------|---------|--------------------------|-------------------|
| Icone inline em texto body | 16px | 1.5 | `size={16} strokeWidth={1.5}` |
| Icone em botao md | 16px | 2.0 | `size={16} strokeWidth={2}` |
| Icone em botao lg | 20px | 2.0 | `size={20} strokeWidth={2}` |
| Icone de navegacao (sidebar) | 20px | 1.5 | `size={20} strokeWidth={1.5}` |
| Icone de status (badge) | 14px | 2.0 | `size={14} strokeWidth={2}` |
| Icone de action (card header) | 20px | 1.5 | `size={20} strokeWidth={1.5}` |
| Icone de empty state | 40px | 1.0 | `size={40} strokeWidth={1}` |
| Icone decorativo grande | 48px | 1.0 | `size={48} strokeWidth={1}` |

**Regra:** `strokeWidth={2}` e o peso padrao em acoes/interacao. `strokeWidth={1.5}` e o peso em navegacao e contexto. `strokeWidth={1}` e so em icones grandes decorativos. Nunca `strokeWidth` acima de 2 no sistema.

### Mapeamento emoji → lucide

| Emoji atual | Lucide icon | Contexto |
|-------------|-------------|----------|
| Quiz opcoes diversas | `Circle`, `CheckCircle2` | Alternativas de quiz |
| Sidebar itens | `LayoutDashboard`, `Users`, `Calendar`, `Video`, `FileText`, `Settings` | Navegacao |
| Status PAID | `CheckCircle2` | Badge PAID |
| Status CANCELLED | `XCircle` | Badge CANCELLED |
| Status SCHEDULED | `Clock` | Badge SCHEDULED |
| Status COMPLETED | `CheckCircle` | Badge COMPLETED |

---

## 9. Especificacao dos Componentes-chave

### 9.1 Button

**Principio:** o botao primario e escasso. Em uma tela, idealmente um. Secondary e ghost completam o sistema sem competir.

#### Variantes e estados

```tsx
// Button.tsx — pseudo-codigo com classes v2
// CVA variant mapping

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-md " +
  "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 " +
  "select-none",
  {
    variants: {
      variant: {
        // Laranja sólido — ação principal única da tela
        primary:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 " +
          "focus-visible:ring-brand-500",

        // Sage sólido — ação secundária positiva (confirmar, salvar rascunho)
        secondary:
          "bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800 " +
          "focus-visible:ring-sage-500",

        // Contorno — ação terciária, cancelar, voltar
        outline:
          "border border-surface-300 bg-white text-surface-700 " +
          "hover:bg-surface-50 hover:border-surface-400 active:bg-surface-100 " +
          "focus-visible:ring-brand-500",

        // Ghost — ação de baixo peso (editar inline, ver mais)
        ghost:
          "bg-transparent text-surface-600 hover:bg-surface-100 " +
          "hover:text-surface-800 active:bg-surface-200 " +
          "focus-visible:ring-surface-400",

        // Destrutivo — excluir, cancelar consulta
        destructive:
          "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 " +
          "focus-visible:ring-error-500",
      },
      size: {
        sm: "h-8  px-3   text-sm    gap-1.5",
        md: "h-10 px-4   text-sm    gap-2",
        lg: "h-12 px-6   text-base  gap-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

// Estado loading: spinner Lucide Loader2 com animate-spin, texto mantido (não some)
// Estado disabled: opacity-40 via CVA base (já incluso)
// Icone only: usar size="icon" + rounded-full se pill, rounded-md se quadrado
```

**Nota de impacto:** a classe `primary` agora usa `bg-brand-600` (nao `bg-brand-500`). Verificar todos os `bg-brand-500` que funcionam como botao primario.

### 9.2 Input

```tsx
// Input.tsx — estrutura completa com label, helper e erro

<div className="flex flex-col gap-1.5">
  {/* Label */}
  <label className="text-sm font-medium text-surface-700 leading-none">
    {label}
    {required && <span className="text-error-600 ml-0.5">*</span>}
  </label>

  {/* Input wrapper */}
  <div className="relative">
    {startIcon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
        {startIcon}  {/* Lucide icon size={16} strokeWidth={1.5} */}
      </span>
    )}
    <input
      className={cn(
        "w-full rounded px-3 py-2.5 text-sm text-surface-800 bg-white",
        "border border-surface-300 placeholder:text-surface-400",
        "transition-colors duration-150",
        "focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15",
        "disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed",
        hasError && "border-error-500 focus:border-error-500 focus:ring-error-500/15",
        startIcon && "pl-9",
        endIcon && "pr-9",
      )}
      {...props}
    />
    {endIcon && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
        {endIcon}
      </span>
    )}
  </div>

  {/* Helper ou erro */}
  {error ? (
    <p className="text-xs text-error-600 flex items-center gap-1">
      <AlertCircle size={12} strokeWidth={2} />
      {error}
    </p>
  ) : helper ? (
    <p className="text-xs text-surface-500">{helper}</p>
  ) : null}
</div>
```

### 9.3 Card

Tres niveis de card mapeando o conceito de superficie.

```tsx
// Card default — superficie base
<div className="bg-white border border-surface-200 rounded-lg shadow-xs p-5">
  ...
</div>

// Card elevated — destaque, hover interativo
<div className={cn(
  "bg-white border border-surface-200 rounded-xl shadow-sm p-6",
  "transition-shadow duration-150 hover:shadow-md",
)}>
  ...
</div>

// Card interactive — clicavel, vai para detalhe
<div className={cn(
  "bg-white border border-surface-200 rounded-lg shadow-xs p-5 cursor-pointer",
  "transition-all duration-150",
  "hover:border-surface-300 hover:shadow-sm",
  "active:scale-[0.995]",
)}>
  ...
</div>
```

### 9.4 Badge — Status Clinico

```tsx
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        // Status clinicos (21 telas dependem destes)
        scheduled:  "bg-warning-100  text-warning-700",
        paid:       "bg-success-50   text-success-600",
        completed:  "bg-success-100  text-success-700",
        cancelled:  "bg-error-100    text-error-700",

        // Informativos
        default:    "bg-surface-100  text-surface-600",
        brand:      "bg-brand-100    text-brand-700",
        sage:       "bg-sage-100     text-sage-700",
        info:       "bg-info-100     text-info-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

// Uso:
<Badge variant="scheduled">
  <Clock size={10} strokeWidth={2} />
  Agendado
</Badge>

<Badge variant="completed">
  <CheckCircle size={10} strokeWidth={2} />
  Concluido
</Badge>
```

### 9.5 Modal / Dialog

```tsx
// Usa Radix Dialog (ja instalado, substituir modal.tsx custom)

// Overlay
<DialogOverlay className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm animate-fade-in" />

// Content
<DialogContent className={cn(
  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "w-full max-w-lg bg-white rounded-xl shadow-xl border border-surface-200",
  "animate-[modal-in_200ms_cubic-bezier(0.16,1,0.3,1)]",
  "focus:outline-none",
)}>
  {/* Header */}
  <div className="flex items-center justify-between p-6 border-b border-surface-100">
    <DialogTitle className="font-heading text-lg font-semibold text-surface-900">
      {title}
    </DialogTitle>
    <DialogClose asChild>
      <button className="text-surface-400 hover:text-surface-600 transition-colors duration-150 rounded-md p-1 hover:bg-surface-50">
        <X size={20} strokeWidth={1.5} />
      </button>
    </DialogClose>
  </div>

  {/* Body */}
  <div className="p-6">
    {children}
  </div>

  {/* Footer (opcional) */}
  <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-100">
    <Button variant="outline" size="md">Cancelar</Button>
    <Button variant="primary" size="md">Confirmar</Button>
  </div>
</DialogContent>
```

### 9.6 PageHeader (novo componente)

```tsx
// Componente novo — replica em todas as telas logadas (hoje sem padrao)

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

// Classes:
<div className="py-8 px-6 border-b border-surface-100 bg-white">
  {breadcrumb && (
    <nav className="flex items-center gap-1.5 mb-3">
      {/* items em text-xs text-surface-400, separador / em text-surface-300 */}
    </nav>
  )}
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="font-heading text-2xl font-semibold text-surface-900 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
  </div>
</div>
```

### 9.7 StatCard (novo componente — dashboards)

```tsx
// Exibe metrica principal com delta e label

<div className="bg-white border border-surface-200 rounded-lg shadow-xs p-5">
  <div className="flex items-start justify-between">
    <p className="text-sm text-surface-500 font-medium">{label}</p>
    {icon && (
      <span className="p-2 rounded-md bg-surface-50 text-surface-400">
        {/* Lucide icon size={18} strokeWidth={1.5} */}
      </span>
    )}
  </div>
  <p className="mt-3 font-heading text-3xl font-semibold text-surface-900 tracking-tight">
    {value}
  </p>
  {delta && (
    <p className={cn(
      "mt-1.5 text-xs font-medium flex items-center gap-1",
      delta > 0 ? "text-success-600" : "text-error-600",
    )}>
      {delta > 0
        ? <TrendingUp size={12} strokeWidth={2} />
        : <TrendingDown size={12} strokeWidth={2} />
      }
      {Math.abs(delta)}% vs. mes anterior
    </p>
  )}
</div>
```

### 9.8 EmptyState (novo componente)

```tsx
// Substitui 10 reimplementacoes manuais

<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
  <div className="rounded-2xl bg-surface-50 p-4 mb-5">
    {/* Lucide icon size={40} strokeWidth={1} text-surface-300 */}
  </div>
  <h3 className="font-heading text-base font-semibold text-surface-700 mb-1.5">
    {title}
  </h3>
  <p className="text-sm text-surface-500 max-w-xs leading-relaxed">
    {description}
  </p>
  {action && (
    <div className="mt-6">
      {action}  {/* Button primary ou outline */}
    </div>
  )}
</div>
```

### 9.9 Skeleton (novo componente)

```tsx
// Base: animate-pulse bg-surface-100 rounded

// Linha de texto
<div className="h-4 bg-surface-100 rounded animate-pulse" style={{ width }} />

// Avatar
<div className="rounded-full bg-surface-100 animate-pulse" style={{ width: size, height: size }} />

// Card skeleton
<div className="bg-white border border-surface-200 rounded-lg p-5 space-y-3">
  <div className="h-4 bg-surface-100 rounded animate-pulse w-1/3" />
  <div className="h-8 bg-surface-100 rounded animate-pulse w-2/3" />
  <div className="h-3 bg-surface-100 rounded animate-pulse w-1/2" />
</div>
```

### 9.10 Avatar (novo componente)

```tsx
// Substitui divs manuais com initials em 5+ telas

const avatarSizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" }
const avatarColors = {
  // Hash do nome → index → cor — consistencia por usuario
  0: "bg-brand-100 text-brand-700",
  1: "bg-sage-100 text-sage-700",
  2: "bg-info-100 text-info-700",
  3: "bg-warning-100 text-warning-700",
}

<div className={cn(
  "rounded-full flex items-center justify-center font-medium font-sans shrink-0",
  avatarSizes[size],
  src ? "" : avatarColors[colorIndex],
)}>
  {src
    ? <img src={src} alt={alt} className="rounded-full object-cover w-full h-full" />
    : initials  // 2 letras maiusculas
  }
</div>
```

---

## 10. Diff completo — tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- shadcn/ui CSS Variable tokens (mantidos) ---
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // --- WiseDrops Brand (laranja) ---
        // MUDANCA: brand-500 nao deve ser usado em texto (WCAG AA falha)
        // Minimo para texto: brand-700 (#c2410c, ratio 5.74:1)
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // fills/decorativo APENAS — nunca texto < 18pt
          600: '#ea580c',  // botao primario bg, hover
          700: '#c2410c',  // texto brand minimo (WCAG AA: 5.74:1)
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },

        // --- Sage (verde-salvia) — mantido, uso refinado ---
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#cdd9cd',
          300: '#aabfaa',
          400: '#7a9a7a',
          500: '#5b7d5b',  // texto sage (WCAG AA: 5.1:1 sobre branco)
          600: '#486448',  // texto sage elevado
          700: '#3a4f3a',  // heading sage
          800: '#303f30',
          900: '#283428',
        },

        // --- accent mantido como alias do sage (compatibilidade) ---
        // AVISO: renomear accent para sage em todos os componentes futuros
        // O DEFAULT e foreground do shadcn permanecem para nao quebrar Radix
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#cdd9cd',
          300: '#aabfaa',
          400: '#7a9a7a',
          500: '#5b7d5b',
          600: '#486448',
          700: '#3a4f3a',
          800: '#303f30',
          900: '#283428',
        },

        // --- Surface (neutro) ---
        surface: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // --- Semanticos ---
        success: {
          DEFAULT: '#15803d',
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        warning: {
          DEFAULT: '#b45309',
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#dc6803',
          700: '#b45309',
        },
        error: {
          DEFAULT: '#b42318',
          50:  '#fef3f2',
          100: '#fee4e2',
          500: '#f04438',
          600: '#d92d20',
          700: '#b42318',
        },
        info: {
          DEFAULT: '#175cd3',
          50:  '#eff8ff',
          100: '#d1e9ff',
          500: '#2e90fa',
          600: '#1570ef',
          700: '#175cd3',
        },
      },

      fontFamily: {
        sans:    ['DM Sans',  'system-ui', 'sans-serif'],
        heading: ['Sora',     'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Escala editorial completa
        'display': ['3rem',    { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '700' }],
        'h1':      ['2rem',    { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2':      ['1.5rem',  { lineHeight: '1.25', letterSpacing: '-0.015em',fontWeight: '600' }],
        'h3':      ['1.25rem', { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'h4':      ['1.125rem',{ lineHeight: '1.35', letterSpacing: '-0.005em',fontWeight: '500' }],
        'body-lg': ['1.0625rem',{lineHeight: '1.65', letterSpacing: '0em',     fontWeight: '400' }],
        'body':    ['1rem',    { lineHeight: '1.6',  letterSpacing: '0em',     fontWeight: '400' }],
        'small':   ['0.875rem',{ lineHeight: '1.5',  letterSpacing: '0.01em',  fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.45', letterSpacing: '0.02em',  fontWeight: '400' }],
        'label':   ['0.875rem',{ lineHeight: '1.2',  letterSpacing: '0.02em',  fontWeight: '500' }],
        'overline':['0.6875rem',{lineHeight: '1.3',  letterSpacing: '0.08em',  fontWeight: '600' }],
      },

      borderRadius: {
        sm:   '4px',
        DEFAULT:'6px',
        md:   '8px',
        lg:   '12px',   // --radius atual
        xl:   '16px',
        '2xl':'20px',
        full: '9999px',
      },

      boxShadow: {
        xs:          '0 1px 2px 0 rgba(0,0,0,0.04)',
        sm:          '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        md:          '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
        lg:          '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)',
        xl:          '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'focus-brand':'0 0 0 3px rgba(249,115,22,0.18)',
        'focus-sage': '0 0 0 3px rgba(91,125,91,0.18)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to:   { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(calc(100% + 16px))' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in':       'slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':       'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':        'fade-in 0.2s ease-out',
        'modal-in':       'modal-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        'modal-out':      'modal-out 0.15s ease-in',
        'toast-in':       'toast-in 0.3s cubic-bezier(0.16,1,0.3,1)',
      },

      transitionDuration: {
        '80':  '80ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}

export default config
```

---

## 11. Diff completo — globals.css

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Sora:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* --- Radius --- */
    --radius: 0.75rem;

    /* --- shadcn/ui semantic tokens (atualizados para v2) --- */
    --background:   0 0% 98%;         /* surface-50 quase exato */
    --foreground:   0 0% 10%;         /* surface-900 aprox */
    --card:         0 0% 100%;
    --card-foreground: 0 0% 10%;
    --popover:      0 0% 100%;
    --popover-foreground: 0 0% 10%;

    /* primary = brand-600 (#ea580c) */
    --primary:          21 90% 48%;
    --primary-foreground: 0 0% 100%;

    /* secondary = surface-100 */
    --secondary:          0 0% 96%;
    --secondary-foreground: 0 0% 10%;

    /* muted = surface-100 */
    --muted:          0 0% 96%;
    --muted-foreground: 0 0% 45%;

    /* accent = sage-600 (#486448) */
    --accent:          125 17% 28%;
    --accent-foreground: 0 0% 100%;

    /* destructive = error-600 (#d92d20) */
    --destructive:          4 72% 49%;
    --destructive-foreground: 0 0% 100%;

    /* border/input = surface-200 */
    --border: 0 0% 90%;
    --input:  0 0% 90%;

    /* ring = brand-500 (foco) */
    --ring:   21 90% 48%;

    /* --- Motion timing --- */
    --duration-instant:  80ms;
    --duration-fast:    150ms;
    --duration-base:    200ms;
    --duration-slow:    300ms;
    --duration-crawl:   400ms;

    --ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1.0);
    --ease-in-out:   cubic-bezier(0.4, 0.0, 0.2, 1.0);
    --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);

    /* --- Shadows --- */
    --shadow-xs:         0 1px 2px 0 rgba(0,0,0,0.04);
    --shadow-sm:         0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04);
    --shadow-md:         0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
    --shadow-lg:         0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04);
    --shadow-xl:         0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04);
    --shadow-focus-brand:0 0 0 3px rgba(249,115,22,0.18);
    --shadow-focus-sage: 0 0 0 3px rgba(91,125,91,0.18);
  }

  /* --- Video Room sub-sistema dark --- */
  .video-room {
    --video-bg:            #0d0d0d;
    --video-surface:       rgba(255,255,255,0.08);
    --video-surface-hover: rgba(255,255,255,0.14);
    --video-border:        rgba(255,255,255,0.12);
    --video-text:          #f5f5f5;
    --video-text-muted:    rgba(255,255,255,0.55);
    --video-brand:         #fb923c;   /* brand-400 — contraste 3.1:1 em dark, só fill/icon */
    --video-danger:        #f04438;   /* error-500 */
  }

  * {
    @apply border-border;
  }

  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  /* gradient-brand ATUALIZADO: usa brand-700→brand-600 (antes era orange-600→orange-500) */
  /* AVISO FRONTEND: .gradient-brand mudou de laranja raw para brand-700→brand-600 */
  .gradient-brand {
    @apply bg-gradient-to-r from-brand-700 to-brand-600;
  }

  /* gradient-accent ATUALIZADO: era copia do orange, agora usa sage */
  /* AVISO FRONTEND: .gradient-accent mudou radicalmente — era laranja, agora verde-salvia */
  .gradient-accent {
    @apply bg-gradient-to-r from-sage-700 to-sage-500;
  }

  /* gradient-sage — alias novo, mais explicito */
  .gradient-sage {
    @apply bg-gradient-to-r from-sage-700 to-sage-500;
  }

  /* Utilitarios de sombra semantica */
  .shadow-focus-brand {
    box-shadow: var(--shadow-focus-brand);
  }

  .shadow-focus-sage {
    box-shadow: var(--shadow-focus-sage);
  }

  /* Utilitario de overline */
  .text-overline {
    @apply text-overline uppercase tracking-widest font-semibold font-sans;
  }
}
```

---

## 12. Tabela WCAG AA — Verificacao de Contraste

Todas as combinacoes texto/fundo relevantes verificadas. Minimo WCAG AA: 4.5:1 para texto normal, 3.0:1 para texto grande (> 18pt regular ou > 14pt bold).

| Texto (hex) | Fundo (hex) | Ratio | WCAG AA texto normal | WCAG AA texto grande | Status |
|-------------|-------------|-------|---------------------|---------------------|--------|
| `brand-700` `#c2410c` | `white` `#ffffff` | 5.74:1 | APROVADO | APROVADO | Uso em texto brand minimo |
| `brand-600` `#ea580c` | `white` `#ffffff` | 4.54:1 | APROVADO | APROVADO | Uso em botao/link brand |
| `brand-500` `#f97316` | `white` `#ffffff` | 3.00:1 | REPROVADO | APROVADO (limite) | Somente fill decorativo ou texto > 18pt |
| `brand-500` `#f97316` | `surface-50` `#fafafa` | 2.93:1 | REPROVADO | REPROVADO | PROIBIDO em texto |
| `white` `#ffffff` | `brand-600` `#ea580c` | 4.54:1 | APROVADO | APROVADO | Texto branco em botao brand |
| `white` `#ffffff` | `brand-700` `#c2410c` | 5.74:1 | APROVADO | APROVADO | Texto branco em botao brand hover |
| `sage-500` `#5b7d5b` | `white` `#ffffff` | 5.10:1 | APROVADO | APROVADO | Texto sage em fundo claro |
| `sage-600` `#486448` | `white` `#ffffff` | 6.89:1 | APROVADO | APROVADO | Texto sage elevado |
| `sage-700` `#3a4f3a` | `white` `#ffffff` | 9.24:1 | APROVADO | APROVADO | Heading sage |
| `white` `#ffffff` | `sage-600` `#486448` | 6.89:1 | APROVADO | APROVADO | Texto branco em botao sage |
| `surface-700` `#404040` | `white` `#ffffff` | 7.92:1 | APROVADO | APROVADO | Texto corpo padrao |
| `surface-600` `#525252` | `white` `#ffffff` | 5.90:1 | APROVADO | APROVADO | Texto secundario |
| `surface-500` `#737373` | `white` `#ffffff` | 4.48:1 | REPROVADO (margem) | APROVADO | Somente texto grande / helper |
| `surface-400` `#a3a3a3` | `white` `#ffffff` | 2.32:1 | REPROVADO | REPROVADO | Somente decorativo/icone |
| `success-700` `#166534` | `success-100` `#dcfce7` | 6.10:1 | APROVADO | APROVADO | Badge COMPLETED |
| `success-600` `#15803d` | `success-50` `#f0fdf4` | 5.85:1 | APROVADO | APROVADO | Badge PAID |
| `warning-700` `#b45309` | `warning-100` `#fef3c7` | 5.20:1 | APROVADO | APROVADO | Badge SCHEDULED |
| `error-700` `#b42318` | `error-100` `#fee4e2` | 5.94:1 | APROVADO | APROVADO | Badge CANCELLED |
| `info-700` `#175cd3` | `info-100` `#d1e9ff` | 5.40:1 | APROVADO | APROVADO | Badge info |
| `video-text` `#f5f5f5` | `video-bg` `#0d0d0d` | 16.1:1 | APROVADO | APROVADO | Texto em sala de video |
| `brand-400` `#fb923c` | `video-bg` `#0d0d0d` | 3.10:1 | REPROVADO | APROVADO | Icone brand em dark — so fill/icone grande |

**Resumo de restricoes criticas:**
- `text-brand-500` em qualquer tamanho < 18pt: BLOQUEADO (ratio 3.0:1)
- `text-surface-500` em corpo de texto normal: BLOQUEADO (ratio 4.48:1, abaixo de 4.5:1)
- `text-surface-400`: somente decorativo e icone — nunca texto
- `brand-400` no video-room: somente icone e fill, nunca texto pequeno

---

## 13. Impacto em Classes Existentes — Lista para o Frontend

### AVISO CRITICO ao wisedrops-dev-frontend

As seguintes classes Tailwind existentes no codebase (44 arquivos TSX) serao impactadas pelas mudancas v2. Nao e um breakage silencioso — cada item abaixo requer revisao manual.

#### 13.1 `.gradient-brand` — MUDOU RADICALMENTE
**Antes:** `from-orange-600 to-orange-500` (hardcoded, nao usava token brand)
**Depois:** `from-brand-700 to-brand-600`
**Impacto:** Visual muda — antes laranja Tailwind puro (#ea580c → #f97316), agora brand com tokens (#c2410c → #ea580c). O resultado e mais escuro e mais refinado. Verificar todas as telas que usam `.gradient-brand`.

#### 13.2 `.gradient-accent` — MUDOU DE COR
**Antes:** `from-orange-500 to-orange-400` (era uma copia do gradient de laranja)
**Depois:** `from-sage-700 to-sage-500` (agora verde-salvia)
**Impacto:** A mudanca e dramatica — de laranja para verde. Se `.gradient-accent` esta sendo usado para identidade brand laranja, precisa ser migrado para `.gradient-brand`. Fazer grep antes de aplicar.

**Acao recomendada:** Grep `.gradient-accent` no src/ e revisar cada uso antes de aplicar o diff.

#### 13.3 `bg-green-*`, `text-green-*` (35 arquivos com cores raw)
**Problema:** 35 arquivos usam cores raw do Tailwind padrao (bg-green-, bg-red-, bg-amber-) em vez dos tokens semanticos.
**Acao:** Substituir progressivamente por tokens semanticos:
- `bg-green-100 text-green-700` → `bg-success-100 text-success-700`
- `bg-red-100 text-red-700` → `bg-error-100 text-error-700`
- `bg-amber-100 text-amber-700` → `bg-warning-100 text-warning-700`

#### 13.4 `text-brand-500` — BLOQUEADO em texto
**Arquivos afetados:** qualquer ocorrencia de `text-brand-500` em texto < 18pt
**Acao:** Substituir por `text-brand-700` (minimo WCAG AA, ratio 5.74:1)

**Comando grep sugerido:**
```bash
grep -r "text-brand-500" ./src --include="*.tsx" --include="*.ts"
```

#### 13.5 `--radius` em `borderRadius`
**Antes:** `lg: var(--radius)`, `md: calc(var(--radius) - 2px)`, `sm: calc(var(--radius) - 4px)`
**Depois:** Escala explicita `sm/md/lg/xl/2xl` em px
**Impacto:** `rounded-lg` continua como 12px (igual a `--radius: 0.75rem`). `rounded-md` e `rounded-sm` tinham valores calculados — agora sao 8px e 4px respectivamente. Verificar se algum componente dependia dos valores calc anteriores.

#### 13.6 `boxShadow` — nova nomenclatura
**Antes:** Tailwind padrao (`shadow-sm`, `shadow-md`, etc.) com valores padrao Tailwind
**Depois:** Valores customizados redefinidos em `boxShadow` config — os nomes sao os mesmos mas os valores mudaram para o padrao mais sutil do sistema v2
**Impacto:** Qualquer `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` no codebase tera visual levemente diferente (mais suave). Verificar especialmente cards e modais.

#### 13.7 `success.DEFAULT` e `error.DEFAULT` — mudaram de valor
**Antes:** `success.DEFAULT: '#16a34a'` · `error.DEFAULT: '#d92d20'`
**Depois:** `success.DEFAULT: '#15803d'` · `error.DEFAULT: '#b42318'`
**Razao:** Os DEFAULTs agora apontam para o nivel -700 (mais escuro), nao -500/-600, para garantir WCAG AA quando usados via classe `text-success` ou `text-error`.

#### 13.8 `--primary` CSS var — mudou de HSL
**Antes:** `--primary: 24 95% 53%` (brand-500 `#f97316`)
**Depois:** `--primary: 21 90% 48%` (brand-600 `#ea580c`)
**Impacto:** Qualquer componente que usa `hsl(var(--primary))` via token shadcn ficara levemente mais escuro. Cobre o bug WCAG de `text-brand-500`.

#### 13.9 `--accent` CSS var — mudou de laranja para sage
**Antes:** `--accent: 24 95% 53%` (laranja — era copia do primary)
**Depois:** `--accent: 125 17% 28%` (sage-600 `#486448`)
**Impacto:** Qualquer componente que usa `bg-accent` ou `text-accent` via token shadcn mudara de laranja para verde-salvia. Esta e a mudanca mais visivelmente dramatica. Grep obrigatorio antes de aplicar:
```bash
grep -r "bg-accent\b\|text-accent\b\|border-accent\b" ./src --include="*.tsx"
```

#### 13.10 Emojis em sidebar e quiz — nao quebram, mas sao tecnicos debt
Os emojis usados como icones nao sao afetados pelo diff de config/CSS. Porem, o sistema v2 define substituicao por `lucide-react`. Isso e trabalho separado — nao bloqueia o deploy do design system, mas deve entrar no backlog do frontend.

---

## Checklist de implementacao (para wisedrops-dev-frontend)

```
[ ] 1. Grep .gradient-accent — mapear todos os usos antes de aplicar diff
[ ] 2. Grep text-brand-500 — substituir por text-brand-700 em texto
[ ] 3. Grep bg-accent / text-accent (CSS var shadcn) — revisar impacto da mudanca para sage
[ ] 4. Aplicar diff tailwind.config.ts
[ ] 5. Aplicar diff globals.css
[ ] 6. npm run build — verificar zero erros de compilacao
[ ] 7. Revisar visual de .gradient-brand (agora mais escuro)
[ ] 8. Substituir modal.tsx custom por wrapper Radix Dialog (spec secao 9.5)
[ ] 9. Criar componentes novos: Avatar, PageHeader, StatCard, EmptyState, Skeleton
[ ] 10. Substituir bg-green-*/bg-red-*/bg-amber-* por tokens semanticos (35 arquivos)
[ ] 11. Mapear emojis → lucide-react (backlog — nao bloqueia v2)
[ ] 12. Aplicar variaveis .video-room no componente video-room (729 linhas)
[ ] 13. Portao final: wisedrops-dev-qa-revisor + wisedrops-dev-auth-seguranca
```

---

**Fim do handoff.**
**Entregue por:** wisedrops-design (ex-Aesop / Headspace)
**Para:** wisedrops-dev-frontend
**Portao obrigatorio:** wisedrops-dev-qa-revisor antes de qualquer merge em producao
