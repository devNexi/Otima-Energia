---
name: Sales OS Architecture
description: Core layout, colors, nav structure, and key patterns for the Sales OS pages
---

## Colors
- Sidebar background: `#0f0e2a`
- Primary purple: `#9e3ffd`
- Secondary pink: `#df0af2`
- Accent text purple: `#c88ff5`

## Navigation
Three sidebar items only: Queue (`/sales-os/queue`), Replies (`/sales-os/replies`), Manager (`/sales-os/manager`).
No Dialer page — the Dialer.tsx was deleted. All "Ligar" buttons call `openDialer()` which fires a toast.

## LeadCard layout (3-column)
- Left (260px): company info, DM info, phone, bill status, attempts, blocker, score, AgentRecommendationCard
- Center: tab bar (Assistência de Chamada / WhatsApp / Email / Cobrar Conta / Interrupção de Padrão) → CallAssistPanel or MessageComposer
- Right (280px): Timeline, DMEnrichmentPanel, SOPAgentPanel, SequenceTriggerPanel, MemoryPanel

## i18n
`useI18n()` from `@/lib/i18n`. All Portuguese UI strings use i18n keys that already exist.
`salesos.agent.recommendation`, `salesos.agent.execute` etc. are defined in the pt-BR locale.

## Toast
`useToast()` from `@/hooks/use-toast`. Used for "Abrindo discador..." and similar feedback.
