import { db } from "./db";
import { sql } from "drizzle-orm";

interface DictionaryTerm {
  key: string;
  category: 'DOSSIER' | 'RFQ_QUOTES' | 'ONBOARDING_COMPLIANCE' | 'COMMISSION_REVENUE' | 'OPS_EXECUTION';
  term_pt: string;
  term_en: string;
  short_def_pt: string;
  short_def_en: string;
  why_matters_pt: string;
  why_matters_en: string;
  example_pt?: string;
  example_en?: string;
  synonyms?: string[];
  related_keys?: string[];
}

const V1_DICTIONARY_TERMS: DictionaryTerm[] = [
  // ========== DOSSIÊ ==========
  {
    key: "uc",
    category: "DOSSIER",
    term_pt: "UC (Unidade Consumidora)",
    term_en: "UC (Consumer Unit)",
    short_def_pt: "Código que identifica o ponto físico de consumo de energia do cliente.",
    short_def_en: "Identifier for the client's physical electricity consumption point.",
    why_matters_pt: "Cotações e contratos são vinculados à UC correta. Erro aqui significa proposta errada.",
    why_matters_en: "Quotes and contracts are linked to the correct UC. Wrong UC means wrong proposal.",
    example_pt: "UC 123456789 – Loja SP Centro",
    example_en: "UC 123456789 – SP Downtown Store",
    synonyms: ["unidade consumidora", "ponto de consumo", "consumer unit"],
    related_keys: ["distribuidora", "demanda", "consumo"]
  },
  {
    key: "distribuidora",
    category: "DOSSIER",
    term_pt: "Distribuidora",
    term_en: "Distributor / Utility",
    short_def_pt: "Empresa local que entrega a energia até o cliente final.",
    short_def_en: "Local utility company that delivers electricity to the end customer.",
    why_matters_pt: "Define regras técnicas, cadastro do cliente e custos de distribuição.",
    why_matters_en: "Defines technical rules, customer registration, and distribution costs.",
    example_pt: "CPFL, Enel, Cemig, Light",
    example_en: "CPFL, Enel, Cemig, Light",
    synonyms: ["concessionária", "utility", "distribution company"],
    related_keys: ["uc", "submercado"]
  },
  {
    key: "grupo_a",
    category: "DOSSIER",
    term_pt: "Grupo A",
    term_en: "Group A",
    short_def_pt: "Clientes conectados em média ou alta tensão.",
    short_def_en: "Customers connected at medium or high voltage.",
    why_matters_pt: "Apenas Grupo A pode operar no mercado livre hoje. Grupo B não é elegível.",
    why_matters_en: "Only Group A can operate in the free market today. Group B is not eligible.",
    example_pt: "Indústrias, shoppings, grandes redes",
    example_en: "Factories, shopping malls, large chains",
    synonyms: ["média tensão", "alta tensão", "cliente livre"],
    related_keys: ["demanda", "consumo", "uc"]
  },
  {
    key: "demanda",
    category: "DOSSIER",
    term_pt: "Demanda (kW)",
    term_en: "Demand (kW)",
    short_def_pt: "Potência máxima contratada com a distribuidora.",
    short_def_en: "Maximum power contracted with the utility.",
    why_matters_pt: "Impacta estrutura de preço, risco e multas por ultrapassagem.",
    why_matters_en: "Impacts price structure, risk, and overage penalties.",
    example_pt: "500 kW de demanda contratada",
    example_en: "500 kW contracted demand",
    synonyms: ["potência", "demand", "kW"],
    related_keys: ["consumo", "uc", "grupo_a"]
  },
  {
    key: "consumo",
    category: "DOSSIER",
    term_pt: "Consumo (kWh / MWh)",
    term_en: "Consumption (kWh / MWh)",
    short_def_pt: "Energia efetivamente utilizada pelo cliente no período.",
    short_def_en: "Actual energy consumed by the client during the period.",
    why_matters_pt: "Base de preço, comissão e reconciliação. Consumo errado = proposta errada.",
    why_matters_en: "Basis for pricing, commission, and reconciliation. Wrong consumption = wrong proposal.",
    example_pt: "150 MWh/mês",
    example_en: "150 MWh/month",
    synonyms: ["energia", "consumption", "MWh", "kWh"],
    related_keys: ["demanda", "variancia_consumo", "reconciliacao"]
  },
  {
    key: "submercado",
    category: "DOSSIER",
    term_pt: "Submercado",
    term_en: "Submarket / Region",
    short_def_pt: "Região elétrica do Brasil (SE/CO, Sul, NE, Norte).",
    short_def_en: "Brazilian power market region (SE/CO, South, NE, North).",
    why_matters_pt: "Preços variam fortemente por submercado. Proposta errada se submercado errado.",
    why_matters_en: "Prices vary significantly by submarket. Wrong submarket means wrong proposal.",
    example_pt: "SE/CO (Sudeste/Centro-Oeste)",
    example_en: "SE/CO (Southeast/Midwest)",
    synonyms: ["região", "region", "market area"],
    related_keys: ["distribuidora", "uc"]
  },

  // ========== RFQ / QUOTES ==========
  {
    key: "rfq",
    category: "RFQ_QUOTES",
    term_pt: "RFQ (Pedido de Cotação)",
    term_en: "RFQ (Request for Quote)",
    short_def_pt: "Solicitação formal de preço enviada ao varejista/fornecedor.",
    short_def_en: "Formal price request sent to the retailer/supplier.",
    why_matters_pt: "Padroniza competição entre fornecedores e evita ruído na negociação.",
    why_matters_en: "Standardizes competition between suppliers and avoids negotiation noise.",
    example_pt: "Enviar RFQ para 3 fornecedores com prazo de 48h",
    example_en: "Send RFQ to 3 suppliers with 48h deadline",
    synonyms: ["pedido de cotação", "request for quote", "cotação"],
    related_keys: ["energia_convencional", "energia_incentivada", "validade_proposta"]
  },
  {
    key: "energia_convencional",
    category: "RFQ_QUOTES",
    term_pt: "Energia Convencional",
    term_en: "Conventional Energy",
    short_def_pt: "Energia sem incentivo regulatório (qualquer fonte).",
    short_def_en: "Non-incentivized energy (any source).",
    why_matters_pt: "Normalmente mais barata, mas sem benefícios fiscais especiais.",
    why_matters_en: "Usually cheaper, but without special tax benefits.",
    synonyms: ["convencional", "conventional", "energia comum"],
    related_keys: ["energia_incentivada", "rfq"]
  },
  {
    key: "energia_incentivada",
    category: "RFQ_QUOTES",
    term_pt: "Energia Incentivada (50% / 100%)",
    term_en: "Incentivized Energy (50% / 100%)",
    short_def_pt: "Energia renovável com benefício regulatório (desconto na TUSD).",
    short_def_en: "Renewable energy with regulatory benefit (TUSD discount).",
    why_matters_pt: "Exigida por alguns perfis de cliente e pode ser requisito contratual.",
    why_matters_en: "Required by some client profiles and may be a contractual requirement.",
    example_pt: "Incentivada 50% = 50% de desconto na TUSD",
    example_en: "50% Incentivized = 50% discount on TUSD",
    synonyms: ["incentivada", "renovável", "renewable", "I5", "I100"],
    related_keys: ["energia_convencional", "rfq"]
  },
  {
    key: "validade_proposta",
    category: "RFQ_QUOTES",
    term_pt: "Validade da Proposta",
    term_en: "Quote Validity",
    short_def_pt: "Prazo em que o preço cotado permanece válido.",
    short_def_en: "Period during which the quoted price remains valid.",
    why_matters_pt: "Preços de energia mudam rapidamente. Proposta vencida = renegociação.",
    why_matters_en: "Energy prices change quickly. Expired quote = renegotiation needed.",
    example_pt: "Válido por 48 horas",
    example_en: "Valid for 48 hours",
    synonyms: ["prazo da proposta", "quote expiry", "validity"],
    related_keys: ["rfq"]
  },

  // ========== ONBOARDING / COMPLIANCE ==========
  {
    key: "checklist_conformidade",
    category: "ONBOARDING_COMPLIANCE",
    term_pt: "Checklist de Conformidade",
    term_en: "Compliance Checklist",
    short_def_pt: "Lista obrigatória de passos e documentos para fechamento seguro.",
    short_def_en: "Mandatory list of steps and documents for safe deal closure.",
    why_matters_pt: "Protege Ótima, o cliente e o fornecedor de erros operacionais.",
    why_matters_en: "Protects Ótima, the client, and the supplier from operational errors.",
    synonyms: ["checklist", "lista de verificação", "compliance list"],
    related_keys: ["evidencia", "signatario_autorizado", "bloqueio"]
  },
  {
    key: "evidencia",
    category: "ONBOARDING_COMPLIANCE",
    term_pt: "Evidência",
    term_en: "Evidence",
    short_def_pt: "Prova objetiva de que algo foi feito (documento, e-mail, registro).",
    short_def_en: "Objective proof that something was done (document, email, record).",
    why_matters_pt: "\"Se não está registrado, não aconteceu.\" Essencial para auditoria.",
    why_matters_en: "\"If it's not recorded, it didn't happen.\" Essential for auditing.",
    example_pt: "Print do e-mail de confirmação do cliente",
    example_en: "Screenshot of client confirmation email",
    synonyms: ["prova", "proof", "documentation", "registro"],
    related_keys: ["checklist_conformidade"]
  },
  {
    key: "signatario_autorizado",
    category: "ONBOARDING_COMPLIANCE",
    term_pt: "Signatário Autorizado",
    term_en: "Authorized Signatory",
    short_def_pt: "Pessoa legalmente habilitada a assinar contratos pela empresa.",
    short_def_en: "Person legally authorized to sign contracts on behalf of the company.",
    why_matters_pt: "Assinatura de pessoa não autorizada pode invalidar todo o contrato.",
    why_matters_en: "Signature from unauthorized person can invalidate the entire contract.",
    example_pt: "Diretor com poderes no contrato social",
    example_en: "Director with powers per company bylaws",
    synonyms: ["assinante", "signer", "representante legal"],
    related_keys: ["checklist_conformidade"]
  },

  // ========== COMISSÃO / RECEITA ==========
  {
    key: "comissao",
    category: "COMMISSION_REVENUE",
    term_pt: "Comissão",
    term_en: "Commission",
    short_def_pt: "Remuneração da Ótima pelo contrato fechado com o cliente.",
    short_def_en: "Ótima's revenue from the closed client contract.",
    why_matters_pt: "É a base do negócio. Erro na comissão = perda de receita.",
    why_matters_en: "It's the basis of the business. Commission error = revenue loss.",
    example_pt: "R$ 2,00/MWh por 36 meses",
    example_en: "R$ 2.00/MWh for 36 months",
    synonyms: ["remuneração", "revenue", "fee"],
    related_keys: ["cadencia_pagamento", "reconciliacao"]
  },
  {
    key: "cadencia_pagamento",
    category: "COMMISSION_REVENUE",
    term_pt: "Cadência de Pagamento",
    term_en: "Payment Cadence",
    short_def_pt: "Frequência com que o fornecedor paga a comissão à Ótima.",
    short_def_en: "Frequency at which the supplier pays commission to Ótima.",
    why_matters_pt: "Afeta fluxo de caixa e planejamento financeiro.",
    why_matters_en: "Affects cash flow and financial planning.",
    example_pt: "Mensal, com 30 dias de atraso",
    example_en: "Monthly, with 30-day delay",
    synonyms: ["frequência de pagamento", "payment frequency"],
    related_keys: ["comissao", "reconciliacao"]
  },
  {
    key: "reconciliacao",
    category: "COMMISSION_REVENUE",
    term_pt: "Reconciliação",
    term_en: "Reconciliation",
    short_def_pt: "Comparação entre comissão esperada e comissão efetivamente paga.",
    short_def_en: "Comparison between expected commission and actual payment received.",
    why_matters_pt: "Evita perdas financeiras. Sem reconciliação, dinheiro pode sumir.",
    why_matters_en: "Prevents financial losses. Without reconciliation, money can disappear.",
    synonyms: ["conferência", "check", "verification"],
    related_keys: ["comissao", "variancia_consumo"]
  },
  {
    key: "variancia_consumo",
    category: "COMMISSION_REVENUE",
    term_pt: "Variância de Consumo",
    term_en: "Consumption Variance",
    short_def_pt: "Diferença entre consumo previsto (na proposta) e consumo real.",
    short_def_en: "Difference between forecasted consumption (in proposal) and actual usage.",
    why_matters_pt: "Pode gerar ajuste financeiro para mais ou para menos.",
    why_matters_en: "May generate financial adjustment up or down.",
    example_pt: "Previsão: 100 MWh, Real: 85 MWh = -15% variância",
    example_en: "Forecast: 100 MWh, Actual: 85 MWh = -15% variance",
    synonyms: ["desvio de consumo", "usage variance"],
    related_keys: ["consumo", "reconciliacao"]
  },

  // ========== OPS / EXECUÇÃO ==========
  {
    key: "sla",
    category: "OPS_EXECUTION",
    term_pt: "SLA (Acordo de Nível de Serviço)",
    term_en: "SLA (Service Level Agreement)",
    short_def_pt: "Prazo acordado para execução de uma tarefa ou entrega.",
    short_def_en: "Agreed deadline for task execution or delivery.",
    why_matters_pt: "Atrasos geram risco, perda de confiança e possíveis penalidades.",
    why_matters_en: "Delays create risk, loss of trust, and possible penalties.",
    example_pt: "SLA de resposta do fornecedor: 48 horas",
    example_en: "Supplier response SLA: 48 hours",
    synonyms: ["prazo", "deadline", "service level"],
    related_keys: ["bloqueio", "caso"]
  },
  {
    key: "bloqueio",
    category: "OPS_EXECUTION",
    term_pt: "Bloqueio (Blocker)",
    term_en: "Blocker",
    short_def_pt: "Algo que impede o avanço do negócio para a próxima etapa.",
    short_def_en: "Something preventing the deal from advancing to the next stage.",
    why_matters_pt: "Prioridade máxima de Ops. Bloqueio não resolvido = deal parado.",
    why_matters_en: "Top Ops priority. Unresolved blocker = stalled deal.",
    example_pt: "Falta de documento do cliente bloqueia assinatura",
    example_en: "Missing client document blocks signature",
    synonyms: ["impedimento", "obstáculo", "stopper"],
    related_keys: ["checklist_conformidade", "caso", "sla"]
  },
  {
    key: "caso",
    category: "OPS_EXECUTION",
    term_pt: "Caso (Deal Case)",
    term_en: "Case (Deal Case)",
    short_def_pt: "Registro formal de um problema operacional que precisa ser resolvido.",
    short_def_en: "Formal record of an operational issue that needs resolution.",
    why_matters_pt: "Evita perda de controle e garante que nada seja esquecido.",
    why_matters_en: "Prevents loss of control and ensures nothing is forgotten.",
    example_pt: "Caso #1234: Comissão não paga pelo fornecedor X",
    example_en: "Case #1234: Commission not paid by supplier X",
    synonyms: ["ticket", "issue", "problema", "ocorrência"],
    related_keys: ["bloqueio", "sla"]
  }
];

function toPostgresArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "{}";
  return `{${arr.map(s => `"${s.replace(/"/g, '\\"')}"`).join(",")}}`;
}

export async function seedDictionaryTerms(): Promise<void> {
  console.log("Seeding Portal Dictionary terms...");
  
  for (const term of V1_DICTIONARY_TERMS) {
    try {
      const synonymsStr = toPostgresArray(term.synonyms);
      const relatedKeysStr = toPostgresArray(term.related_keys);
      
      await db.execute(sql`
        INSERT INTO portal_dictionary_terms (
          key, category, term_pt, term_en, short_def_pt, short_def_en,
          why_matters_pt, why_matters_en, example_pt, example_en,
          synonyms, related_keys
        ) VALUES (
          ${term.key},
          ${term.category}::dictionary_category,
          ${term.term_pt},
          ${term.term_en},
          ${term.short_def_pt},
          ${term.short_def_en},
          ${term.why_matters_pt},
          ${term.why_matters_en},
          ${term.example_pt || null},
          ${term.example_en || null},
          ${synonymsStr}::text[],
          ${relatedKeysStr}::text[]
        )
        ON CONFLICT (key) DO UPDATE SET
          category = EXCLUDED.category,
          term_pt = EXCLUDED.term_pt,
          term_en = EXCLUDED.term_en,
          short_def_pt = EXCLUDED.short_def_pt,
          short_def_en = EXCLUDED.short_def_en,
          why_matters_pt = EXCLUDED.why_matters_pt,
          why_matters_en = EXCLUDED.why_matters_en,
          example_pt = EXCLUDED.example_pt,
          example_en = EXCLUDED.example_en,
          synonyms = EXCLUDED.synonyms,
          related_keys = EXCLUDED.related_keys,
          updated_at = NOW()
      `);
    } catch (error) {
      console.error(`Error seeding term ${term.key}:`, error);
    }
  }
  
  console.log(`Seeded ${V1_DICTIONARY_TERMS.length} dictionary terms.`);
}
