# Ótima Energia — ECOS™ Card Redesign Brief

## Context
The homepage currently has an ECOS™ analysis card showing a single ACL example with loose labelling. This brief does two things: (1) fixes the labels and disclaimer to be legally safe, and (2) adds a GD/ACL toggle so the card shows both products, with GD as the default.

Do not change any other part of the page. Only modify the ECOS™ card component.

---

## Important note on placeholder names

The generator and comercializadora names in this card are **illustrative placeholders only**. Do not use real partner or supplier names. The card must include a visible note making this clear. Exact wording is specified below.

---

## What to build

Replace the existing single-view ECOS™ card with a toggled two-panel card. GD panel is shown by default. ACL panel is shown when the user clicks the ACL tab. The card design, dark background, and premium aesthetic stay the same — this is a content and label change, not a visual redesign.

---

## Full component specification

### Header (unchanged structure, updated subtitle)

```
ECOS™ · ANÁLISE DE MERCADO          [● Ativo]
Exemplo ilustrativo · Dados simulados
```

- The subtitle **must read** "Exemplo ilustrativo · Dados simulados" — remove any copy that says "Gerado em tempo real" or "análise real gerada com os dados da sua empresa". Those two messages contradict the footnote and create legal risk.

---

### Toggle (new — add above the content panels)

Two-button toggle, full width, pill style:

- Button 1 (default active): `⚡ Energia por Assinatura (GD)`
- Button 2: `📈 Mercado Livre (ACL)`

Active state: solid purple background (`#9e3ffd`), white text.
Inactive state: transparent background, muted text.

---

### Panel 1 — GD (default, shown on load)

**Position bar:**
- Label: `POSIÇÃO NO MERCADO`
- Bar fill: ~28% (left side), colour `#9e3ffd`
- Below bar: `Muito abaixo` (left) · `Muito acima` (right)
- Verdict line: `Desconto disponível — oportunidade identificada` in purple

**4-metric grid:**

| Label | Value |
|---|---|
| CONTA ATUAL ESTIMADA | R$ 18.500/mês |
| DESCONTO GD APLICADO | 35% |
| NOVA CONTA ESTIMADA | R$ 12.025/mês |
| ECONOMIA POTENCIAL EST. | R$ 6.475/mês ← green |

**Offers section:**
- Section label: `GERADORES DISPONÍVEIS NA REGIÃO`
- 3 rows:

| Name | Badge | Value |
|---|---|---|
| Gerador Solar — Região Sudeste | `Melhor desconto` (purple badge) | 35% desc. |
| Gerador Solar — Interior SP | — | 28% desc. |
| Gerador Eólico — Região Nordeste | — | 22% desc. |

- Below the 3 rows, add this note in small muted text:
  > `* Nomes dos geradores são ilustrativos. Os parceiros reais são apresentados após o diagnóstico, preservando a confidencialidade comercial.`

---

### Panel 2 — ACL (shown when user clicks ACL tab)

**Position bar:**
- Same structure as GD panel
- Bar fill: ~28%
- Verdict line: `Abaixo da média — oportunidade identificada`

**4-metric grid:**

| Label | Value |
|---|---|
| CUSTO MÉDIO DE ENERGIA (R$/MWh) | R$ 847/MWh |
| MELHOR PREÇO ACL PROJETADO | R$ 678/MWh |
| CONSUMO MÉDIO | 42,8 MWh/mês |
| ECONOMIA POTENCIAL EST. | R$ 7.234/mês ← green |

**Offers section:**
- Section label: `COMPARAÇÃO DE OFERTAS ACL`
- 3 rows:

| Name | Badge | Value |
|---|---|---|
| Comercializadora A | `Melhor preço` (purple badge) | R$ 678/MWh |
| Comercializadora B | — | R$ 712/MWh |
| Comercializadora C | — | R$ 741/MWh |

- Below the 3 rows, add this note in small muted text:
  > `* Nomes das comercializadoras são ilustrativos. As ofertas reais são apresentadas após o diagnóstico, preservando a confidencialidade comercial.`

---

### Disclaimer (bottom of card — both panels)

Replace the existing footnote entirely with:

> Simulação ilustrativa baseada no componente energia. A economia real depende do perfil de consumo, distribuidora, modalidade tarifária, encargos de rede, tributos e condições contratuais finais. Análise completa fornecida após diagnóstico.

Font size: 10–11px. Colour: rgba(255,255,255,0.25). Centred. Appears below whichever panel is active.

---

## Label changes summary (what replaces what)

| Old label | New label |
|---|---|
| TARIFA ATUAL | CUSTO MÉDIO DE ENERGIA (R$/MWh) |
| MELHOR OFERTA | MELHOR PREÇO ACL PROJETADO |
| ECONOMIA PROJ. | ECONOMIA POTENCIAL EST. |
| "Melhor oferta" badge | "Melhor preço" |
| "Gerado em tempo real · Confidencial" | "Exemplo ilustrativo · Dados simulados" |
| Old footnote | New disclaimer text above |

---

## Behaviour

- GD panel is visible on page load by default — no click required.
- Clicking the ACL tab hides the GD panel and shows the ACL panel.
- Clicking the GD tab returns to the GD panel.
- No animation required — simple show/hide is fine.
- The card height will change slightly between panels — this is acceptable. Do not force a fixed height.
