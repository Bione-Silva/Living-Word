# LIVING WORD — Design System & Identidade Visual
## Bloco para colar no chat inicial do Lovable

---

## DIREÇÃO VISUAL

**Conceito:** Cálido e acolhedor — comunidade, calor humano, inclusão.
**Metáfora:** Pergaminho, terra, café, luz de tarde. Parece um lugar onde você é bem-vindo, não uma ferramenta tech fria.
**Tom:** Ministerial sem ser antiquado. Moderno sem ser genérico. Acolhedor sem ser infantil.

---

## PALETA DE CORES

### Cores primárias

```
--lw-primary:       #6B4F3A   /* Café Ministerial — cor principal, botões, header mobile */
--lw-primary-dark:  #3D2B1F   /* Teca Profunda — sidebar, texto escuro, fundo dark */
--lw-amber:         #C4956A   /* Âmbar Pastoral — cor de apoio, destaques, ícones */
--lw-amber-light:   #F0E6D8   /* Linho Quente — backgrounds de cards, badges suaves */
--lw-bg:            #F5F0E8   /* Pergaminho — fundo geral da aplicação */
--lw-bg-card:       #FFFFFF   /* Branco — surface de cards e modais */
```

### Escala completa — cor primária (7 stops)

```
--lw-50:   #F7F1EC   /* lightest fill — backgrounds sutis */
--lw-100:  #EDD9C8   /* light fill — hover states, badges */
--lw-200:  #D4AE90   /* mid-light — borders em destaque */
--lw-400:  #A87455   /* mid — ícones, separadores */
--lw-600:  #6B4F3A   /* strong — COR PRIMÁRIA — botões, header */
--lw-800:  #4A3328   /* dark — texto em backgrounds claros */
--lw-900:  #3D2B1F   /* darkest — sidebar, título principal */
```

### Texto

```
--lw-text:          #3D2B1F   /* texto principal */
--lw-text-muted:    #8B6B54   /* texto secundário, metadata, placeholders */
--lw-text-light:    #B89A82   /* captions, watermarks */
```

### Bordas

```
--lw-border:        rgba(107, 79, 58, 0.15)   /* borda padrão */
--lw-border-strong: rgba(107, 79, 58, 0.30)   /* borda hover / foco */
```

### Estados semânticos

```
--lw-success-bg:    #E8F4E8   --lw-success:    #2E642E   /* confirmações, publicado */
--lw-warning-bg:    #FDF3E8   --lw-warning:    #A05C14   /* limites, atenção */
--lw-danger-bg:     #FBEEE8   --lw-danger:     #A03820   /* erros, bloqueios */
--lw-info-bg:       #EEF3F8   --lw-info:       #325082   /* informações, links */
```

---

## TIPOGRAFIA

### Fontes

```
Display / Títulos:  'Cormorant Garamond', Georgia, serif
  — usar em: logotipo, H1, taglines, citações bíblicas, títulos de artigos
  — peso: 400 Regular e 500 Medium (nunca bold pesado)

Interface / Corpo:  'DM Sans', system-ui, -apple-system, sans-serif
  — usar em: tudo interativo — botões, labels, body, navegação, formulários
  — peso: 400 Regular e 500 Medium

Código / Metadados: 'JetBrains Mono', monospace
  — usar em: watermark técnico, hex codes, datas de geração
```

### Import Google Fonts (cole no index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
```

### Escala tipográfica — mobile-first

```css
/* Display — logotipo, hero */
.text-display    { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: #3D2B1F; }

/* H1 mobile */
.text-h1         { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; line-height: 1.3; color: #3D2B1F; }

/* H2 mobile — títulos de card, passagem bíblica */
.text-h2         { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 400; line-height: 1.3; color: #3D2B1F; }

/* Label / CTA — botões, campos */
.text-label      { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; color: #3D2B1F; }

/* Body — conteúdo, descrições */
.text-body       { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.6; color: #3D2B1F; }

/* Small / Muted — metadata, watermark */
.text-small      { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400; color: #8B6B54; line-height: 1.5; }

/* Caption — datas, versão bíblica, linha doutrinária */
.text-caption    { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #B89A82; }
```

---

## TOKENS DE ESPAÇAMENTO E RAIO

```css
/* Border radius */
--lw-radius-sm:  8px    /* chips, badges */
--lw-radius-md:  12px   /* inputs, botões */
--lw-radius-lg:  16px   /* cards */
--lw-radius-xl:  24px   /* modais, sheets */
--lw-radius-pill: 999px /* pills, tags */

/* Spacing (mobile-first) */
--lw-space-xs: 4px
--lw-space-sm: 8px
--lw-space-md: 12px
--lw-space-lg: 16px
--lw-space-xl: 24px
--lw-space-2xl: 32px

/* Touch targets — NUNCA abaixo disso */
--lw-touch-min: 44px   /* altura mínima de qualquer elemento clicável */
```

---

## COMPONENTES — ESPECIFICAÇÕES MOBILE

### Botão primário (CTA principal)

```css
background: #6B4F3A
color: #FFFFFF
border-radius: 14px
padding: 14px 24px
font: 'DM Sans' 15px 500
min-height: 48px         /* mobile touch target */
width: 100%              /* full width em mobile */
```

### Botão secundário (soft)

```css
background: #F0E6D8
color: #6B4F3A
border-radius: 14px
padding: 12px 24px
font: 'DM Sans' 14px 500
min-height: 44px
```

### Card padrão

```css
background: #FFFFFF
border: 0.5px solid rgba(107,79,58,0.15)
border-radius: 16px
padding: 14px 16px
```

### Input / Campo de texto

```css
background: #F5F0E8
border: 1px solid rgba(107,79,58,0.20)
border-radius: 12px
padding: 12px 14px
font: 'DM Sans' 14px 400
color: #3D2B1F
min-height: 48px          /* mobile */
```

### Badge / Pill

```css
/* Padrão */
background: #EDD9C8; color: #6B4F3A; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 500;

/* Sucesso */
background: #E8F4E8; color: #2E642E;

/* Atenção */
background: #FDF3E8; color: #A05C14;

/* Bloqueado */
background: #FBEEE8; color: #A03820;
```

### Header mobile

```css
background: #6B4F3A
color: #FFFFFF
padding: 14px 16px
border-radius: 0 0 20px 20px   /* arredondar embaixo */
```

### Bottom navigation (mobile)

```css
background: #FFFFFF
border-top: 0.5px solid rgba(107,79,58,0.12)
height: 64px
padding-bottom: env(safe-area-inset-bottom)   /* iPhone notch */
/* 4 ícones: Dashboard, Estúdio, Blog, Biblioteca */
/* Item ativo: #6B4F3A. Inativo: #B89A82 */
```

### Sidebar desktop

```css
background: #3D2B1F
width: 220px
/* Nav item ativo: border-right 2px #C4956A + background rgba(196,149,106,0.15) */
/* Nav item hover: background rgba(255,255,255,0.05) */
/* Logotipo: Cormorant Garamond 16px #F5F0E8 */
```

---

## REGRAS MOBILE-FIRST OBRIGATÓRIAS

```
1. Todo texto tocável: mínimo 14px
2. Touch target mínimo: 44×44px em qualquer elemento clicável
3. Espaçamento entre linhas: 1.5–1.7 em corpo de texto
4. Cormorant Garamond apenas em display e títulos — nunca em corpo pequeno
5. DM Sans para tudo interativo e corpo
6. Padding horizontal da tela: 16px (mobile) / 24px (tablet) / 32px (desktop)
7. Bottom safe area: sempre usar env(safe-area-inset-bottom) no nav inferior
8. Nunca usar fonte abaixo de 11px em qualquer contexto
9. Cores do estado "bloqueado": fundo #FBEEE8, texto #A03820, ícone de cadeado
10. Barra de progresso de gerações: fundo #E8DDD4, preenchimento #6B4F3A
    Vermelho em 80%+ uso: preenchimento #A03820
```

---

## ÍCONES

Usar **Lucide React** — já incluído no shadcn/ui do Lovable.

```
Estúdio:       BookOpen
Blog:          FileText
Biblioteca:    Archive
Fila:          CalendarDays
Configurações: Settings
Upgrade:       Zap (cor #C4956A)
Bloqueado:     Lock (cor #A03820)
Publicado:     CheckCircle (cor #2E642E)
Rascunho:      Circle
Geração:       Sparkles (cor #6B4F3A)
Copiar:        Copy
Compartilhar:  Share2
```

---

## DARK MODE

O dark mode do Living Word inverte para tons escuros quentes — nunca cinza frio.

```css
@media (prefers-color-scheme: dark) {
  --lw-bg:         #1E1510;   /* quase-preto quente */
  --lw-bg-card:    #2A1F18;   /* card escuro */
  --lw-text:       #F5F0E8;   /* texto claro */
  --lw-text-muted: #C4956A;   /* texto secundário */
  --lw-border:     rgba(196, 149, 106, 0.15);
  --lw-primary:    #C4956A;   /* âmbar vira primária no dark */
  --lw-primary-dark: #6B4F3A;
}
```

---

## TAILWIND CONFIG (cole no tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lw: {
          primary:      '#6B4F3A',
          'primary-dark': '#3D2B1F',
          amber:        '#C4956A',
          'amber-light': '#F0E6D8',
          bg:           '#F5F0E8',
          card:         '#FFFFFF',
          text:         '#3D2B1F',
          muted:        '#8B6B54',
          border:       'rgba(107, 79, 58, 0.15)',
          50:           '#F7F1EC',
          100:          '#EDD9C8',
          200:          '#D4AE90',
          400:          '#A87455',
          600:          '#6B4F3A',
          800:          '#4A3328',
          900:          '#3D2B1F',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'lw-sm':  '8px',
        'lw-md':  '12px',
        'lw-lg':  '16px',
        'lw-xl':  '24px',
      },
      minHeight: {
        touch: '44px',
      }
    }
  }
}

export default config
```

---

## EXEMPLOS DE USO — CLASSES TAILWIND

```tsx
// Botão primário mobile
<button className="w-full bg-lw-primary text-white rounded-lw-md px-6 py-[14px] font-sans font-medium text-[15px] min-h-touch">
  Gerar material →
</button>

// Card padrão
<div className="bg-lw-card border border-lw-border rounded-lw-lg p-4">
  ...
</div>

// Título com Cormorant
<h1 className="font-display text-[22px] text-lw-text leading-tight">
  João 15:1-8
</h1>

// Badge bloqueado
<span className="bg-[#FBEEE8] text-[#A03820] text-[11px] font-medium px-[10px] py-[3px] rounded-full">
  🔒 Pastoral
</span>

// Fundo da aplicação
<div className="min-h-screen bg-lw-bg">
  ...
</div>

// Sidebar desktop
<aside className="w-[220px] bg-lw-primary-dark min-h-screen">
  ...
</aside>
```

---

*Design System Living Word v1.0 — Mobile-first · Cálido · Acolhedor*
*Fontes: Cormorant Garamond (display) + DM Sans (interface)*
*Cor primária: #6B4F3A (Café Ministerial)*
