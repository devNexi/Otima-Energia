# Ótima Energia — CTA Redesign + White Injection + Remove All Dashes

---

## PART 1 — Redesign the CTA conversion section

Replace the current CTA band entirely with the following. Do not change any surrounding sections.

### Layout
Two-column grid, equal width, full section width, min-height 380px.
Left column has a right border: `1px solid rgba(255,255,255,0.08)`.

### Section background
```css
background: #2d0f52;
position: relative;
overflow: hidden;
```

### Background texture (position: absolute, inset: 0, pointer-events: none, z-index: 0)
```css
background-image:
  repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 80px),
  repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 80px);
```

### Two glow orbs (position: absolute, pointer-events: none, border-radius: 50%)
Orb 1: `width: 400px; height: 400px; background: radial-gradient(circle, rgba(158,63,253,0.4) 0%, transparent 65%); top: -120px; left: -80px;`
Orb 2: `width: 300px; height: 300px; background: radial-gradient(circle, rgba(200,143,245,0.25) 0%, transparent 65%); bottom: -80px; right: -40px;`

### All content: position relative, z-index: 1

---

### Left column content (padding: 56px 48px 56px 52px)

**Eyebrow label:**
`font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #c88ff5; margin-bottom: 16px`
Text: "Análise 100% neutra"

**Headline:**
`font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800; color: #ffffff; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 20px`
Text: "Pare de pagar mais do que deveria. Descubra isso agora, de graça."
The phrase "de graça" should use `color: #c88ff5`

**Body copy:**
`font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.7`
Text: "Trabalhamos com todas as principais comercializadoras e geradores do país. Não temos preferência por nenhuma delas. O que importa é o que é certo para você."
The word "você" should be `color: #ffffff; font-weight: 700`

---

### Right column content (padding: 56px 48px 56px 52px)

**Neutral badge (green live dot):**
```css
display: inline-flex; align-items: center; gap: 8px;
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 8px; padding: 10px 14px; margin-bottom: 28px;
```
Green dot: `width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.6); flex-shrink: 0`
Text: `font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500; line-height: 1.4`
Content: "Parceiros em todas as frentes: GD, ACL, Gestão e Otimização. Sem vínculo, sem comissão escondida."

**Four proof points (flex column, gap: 10px, margin-bottom: 32px):**

Each item: `display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5`

Check circle: `width: 18px; height: 18px; border-radius: 50%; background: rgba(158,63,253,0.2); border: 1px solid rgba(158,63,253,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #c88ff5`
Check character: ✓

Four items (no dashes, no hyphens):
1. "Diagnóstico completo sem custo algum para sua empresa"
2. "Você escolhe o fornecedor. Nós só mostramos o quadro completo"
3. "Se não houver economia, você saberá disso também. Sem pressão"
4. "Resultado em até 5 dias úteis, sem burocracia"

**CTA Button:**
```css
background: #ffffff;
color: #2d0f52;
font-weight: 800;
font-size: 15px;
padding: 16px 28px;
border-radius: 8px;
border: none;
box-shadow: 0 4px 24px rgba(0,0,0,0.3);
display: block;
width: 100%;
text-align: center;
margin-bottom: 12px;
cursor: pointer;
transition: all 0.2s;
```
Hover: `background: #f0e8ff; transform: translateY(-1px)`
Button text: "Quero saber se estou pagando certo →"

**Below button (small reassurance line):**
`font-size: 12px; color: rgba(255,255,255,0.35); text-align: center; line-height: 1.5`
Text: "Gratuito · Sem compromisso · Sem conflito de interesse"
"Sem conflito de interesse" in `color: rgba(255,255,255,0.55); font-weight: 600`

---

## PART 2 — Inject white to break up dark sections across all pages

The site is consistently dark across all sections with very little tonal variation. Apply the following changes across every public-facing page to break the monotony without changing the overall dark design direction.

**Every other section background:** Where two adjacent sections currently both use near-black or very dark navy, change one of them to `rgba(255,255,255,0.03)` — this creates a barely-there lighter surface that the eye reads as a section break without adding a light background. Apply this alternating rhythm: dark section, slightly-less-dark section, dark section, and so on.

**Specifically, on the homepage, change these sections to `rgba(255,255,255,0.03)` overlaid on their current background** (add as a pseudo-element or wrap with a slight background shift):
- "Como funciona o diagnóstico" section
- "Construída para ser diferente" section  
- "Quem atendemos" section
- ECOS™ showcase section

**Section dividers:** Between every section, add:
```css
border-top: 1px solid rgba(255,255,255,0.05);
```
This thin line gives the eye a clean beat between sections.

**Card backgrounds:** Ensure all cards across all pages use `rgba(255,255,255,0.07)` minimum — not lower. This makes cards visibly float above their section background.

**Card borders:** `rgba(255,255,255,0.12)` — slightly more visible than current.

**Apply the same section rhythm and card treatment to all public pages:**
/, /parceiros, /seja-cliente, /diagnostico, /faq, /ecos, /sobre, /insights, /lei-mercado-livre, /renovacao-contrato, /gd-para-empresas, /mercado-livre-acl, /gestao-de-energia, /otimizacao-energetica

---

## PART 3 — Remove ALL hyphens and dashes from all copy across the entire website

Go through every page, every component, every piece of visible text content and remove all hyphens and em dashes used as punctuation in copy.

**Rules:**
- Em dashes (—) used mid-sentence: replace with a comma or full stop depending on context
- Hyphens used as separators in phrases (e.g. "sem conflito — sem viés"): replace with a comma or full stop
- Hyphens in compound words that are standard Portuguese (e.g. "pós-venda", "guarda-chuva") — keep those, they are grammatically required
- Hyphens in the navbar subtitle "Exemplo ilustrativo · Dados simulados" — the · character is not a hyphen, keep it
- The → arrow character in CTA buttons is not a dash, keep it
- The · dot separator in footer/trust strips is not a dash, keep it

**Pages to cover:** Every public-facing page and every reusable component (navbar, footer, cards, section copy, form labels, tooltips, badge text, disclaimer text).

**Examples of what changes:**
- "sem conflito, sem viés — a decisão é sua" → "sem conflito, sem viés. A decisão é sua"
- "Gerado em tempo real · Confidencial" → no change (dots not dashes)  
- "Da assinatura do contrato à ativação — cuidamos de tudo" → "Da assinatura do contrato à ativação, cuidamos de tudo"
- "ECOS™ — Inteligência que orienta cada decisão" → "ECOS™: Inteligência que orienta cada decisão"
- "Nós existimos para nivelar esse campo." → no change (already no dash)
