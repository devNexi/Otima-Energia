import { storage } from "./storage";

export interface PlaybookStep {
  order: number;
  action: string;
  description: string;
  dueHours?: number;
}

export interface PlaybookData {
  scenarioKey: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  applicableStages: string[];
  actionSteps: PlaybookStep[];
  escalationPath?: {
    afterHours: number;
    escalateTo: string;
    method: string;
  };
}

export const OPS_PLAYBOOKS: PlaybookData[] = [
  {
    scenarioKey: "supplier_no_response",
    title: "Varejista não respondeu RFQ",
    description: "O varejista não respondeu à RFQ dentro do prazo esperado. Isso pode atrasar o processo e prejudicar o cliente.",
    severity: "HIGH",
    applicableStages: ["RFQ_SENT", "QUOTE_ANALYSIS"],
    actionSteps: [
      { order: 1, action: "Verificar SLA do varejista", description: "Consulte o playbook do varejista para confirmar o SLA esperado (normalmente 24-48h).", dueHours: 1 },
      { order: 2, action: "Primeiro follow-up", description: "Envie um lembrete por email/WhatsApp perguntando sobre a cotação pendente.", dueHours: 2 },
      { order: 3, action: "Segundo follow-up (telefone)", description: "Ligue para o contato principal do varejista se não houver resposta após 4h.", dueHours: 4 },
      { order: 4, action: "Contato alternativo", description: "Tente o contato secundário do varejista se o principal não responder.", dueHours: 8 },
      { order: 5, action: "Registrar SLA breach", description: "Marque o varejista como 'SLA breach' no sistema para tracking de performance.", dueHours: 24 }
    ],
    escalationPath: { afterHours: 48, escalateTo: "gerente_ops", method: "slack" }
  },
  {
    scenarioKey: "quote_price_inconsistent",
    title: "Preço da cotação parece inconsistente",
    description: "A cotação recebida tem preço muito diferente do benchmark ou de cotações anteriores do mesmo varejista.",
    severity: "MEDIUM",
    applicableStages: ["QUOTE_ANALYSIS"],
    actionSteps: [
      { order: 1, action: "Verificar benchmark atual", description: "Compare com o preço médio de mercado no painel de benchmarks.", dueHours: 0.5 },
      { order: 2, action: "Revisar histórico do varejista", description: "Verifique cotações anteriores deste varejista para o mesmo submercado.", dueHours: 1 },
      { order: 3, action: "Confirmar com varejista", description: "Entre em contato pedindo confirmação do preço e condições.", dueHours: 2 },
      { order: 4, action: "Documentar análise", description: "Registre sua análise nos comentários da cotação para auditoria.", dueHours: 0.5 }
    ]
  },
  {
    scenarioKey: "dossier_incomplete",
    title: "Dossiê do cliente incompleto",
    description: "O dossiê está faltando informações críticas necessárias para enviar RFQ ou avançar a negociação.",
    severity: "HIGH",
    applicableStages: ["DOSSIER_BUILDING", "RFQ_PREPARATION"],
    actionSteps: [
      { order: 1, action: "Identificar campos faltantes", description: "Use o checklist do dossiê para listar exatamente o que está faltando.", dueHours: 0.5 },
      { order: 2, action: "Contatar cliente", description: "Envie mensagem clara listando os documentos/informações necessárias.", dueHours: 1 },
      { order: 3, action: "Oferecer ajuda", description: "Pergunte se o cliente precisa de ajuda para obter os documentos (ex: modelo de carta para concessionária).", dueHours: 2 },
      { order: 4, action: "Definir prazo", description: "Estabeleça um prazo claro para recebimento e registre no sistema.", dueHours: 2 }
    ],
    escalationPath: { afterHours: 72, escalateTo: "comercial_responsavel", method: "email" }
  },
  {
    scenarioKey: "credit_rejected",
    title: "Crédito do cliente rejeitado",
    description: "O varejista rejeitou o crédito do cliente. Isso pode bloquear o deal ou exigir garantias adicionais.",
    severity: "CRITICAL",
    applicableStages: ["CREDIT_ANALYSIS", "NEGOTIATION"],
    actionSteps: [
      { order: 1, action: "Obter motivo específico", description: "Pergunte ao varejista o motivo exato da rejeição (score, histórico, garantias).", dueHours: 2 },
      { order: 2, action: "Avaliar alternativas", description: "Verifique se há outros varejistas com critérios de crédito diferentes.", dueHours: 4 },
      { order: 3, action: "Discutir garantias", description: "Pergunte ao varejista quais garantias seriam aceitas (depósito, fiança, seguro).", dueHours: 4 },
      { order: 4, action: "Comunicar cliente", description: "Explique a situação ao cliente de forma clara e proponha alternativas.", dueHours: 8 },
      { order: 5, action: "Registrar no ECOS", description: "Atualize o status do lead/cliente no ECOS com a informação de crédito.", dueHours: 2 }
    ],
    escalationPath: { afterHours: 24, escalateTo: "diretor_comercial", method: "call" }
  },
  {
    scenarioKey: "wrong_signer",
    title: "Assinante incorreto no contrato",
    description: "O contrato foi enviado para assinatura, mas o signatário indicado não tem poderes para assinar.",
    severity: "CRITICAL",
    applicableStages: ["CONTRACT_PREPARATION", "CONTRACT_SENT"],
    actionSteps: [
      { order: 1, action: "Verificar contrato social", description: "Consulte o contrato social do cliente para identificar quem tem poderes de assinatura.", dueHours: 1 },
      { order: 2, action: "Contatar cliente urgente", description: "Ligue imediatamente para esclarecer quem deve assinar o contrato.", dueHours: 2 },
      { order: 3, action: "Solicitar novo documento", description: "Se necessário, peça procuração ou documento que comprove poderes do signatário.", dueHours: 4 },
      { order: 4, action: "Cancelar assinatura atual", description: "Se o contrato já foi enviado, cancele a solicitação de assinatura atual.", dueHours: 1 },
      { order: 5, action: "Reenviar para signatário correto", description: "Após confirmação, envie nova solicitação de assinatura.", dueHours: 8 }
    ],
    escalationPath: { afterHours: 24, escalateTo: "juridico", method: "email" }
  },
  {
    scenarioKey: "commission_dispute",
    title: "Disputa de comissão com varejista",
    description: "Há discrepância entre a comissão esperada e o valor reportado pelo varejista.",
    severity: "HIGH",
    applicableStages: ["COMMISSION_TRACKING", "BILLING"],
    actionSteps: [
      { order: 1, action: "Coletar evidências", description: "Reúna o snapshot de comissão acordado, proposta original, e relatório do varejista.", dueHours: 2 },
      { order: 2, action: "Calcular diferença", description: "Quantifique exatamente a diferença entre esperado e recebido.", dueHours: 1 },
      { order: 3, action: "Abrir caso formal", description: "Crie um 'Case' no sistema com toda a documentação.", dueHours: 1 },
      { order: 4, action: "Contatar varejista", description: "Envie email formal com evidências pedindo esclarecimento.", dueHours: 4 },
      { order: 5, action: "Negociar resolução", description: "Busque acordo para correção (crédito, ajuste no próximo mês, etc).", dueHours: 48 }
    ],
    escalationPath: { afterHours: 72, escalateTo: "financeiro_senior", method: "email" }
  },
  {
    scenarioKey: "bill_ocr_failed",
    title: "OCR da fatura falhou",
    description: "O sistema não conseguiu extrair dados automaticamente da fatura de energia do cliente.",
    severity: "LOW",
    applicableStages: ["DOSSIER_BUILDING", "QUALIFICATION"],
    actionSteps: [
      { order: 1, action: "Verificar qualidade do arquivo", description: "Confira se o PDF está legível, não está corrompido ou protegido.", dueHours: 0.5 },
      { order: 2, action: "Solicitar nova cópia", description: "Peça ao cliente uma nova cópia da fatura (preferencialmente PDF nativo, não foto).", dueHours: 2 },
      { order: 3, action: "Extração manual", description: "Se necessário, extraia os dados manualmente e preencha no sistema.", dueHours: 1 },
      { order: 4, action: "Reportar padrão problemático", description: "Se é uma concessionária específica que sempre falha, reporte para melhorar o OCR.", dueHours: 24 }
    ]
  },
  {
    scenarioKey: "rfq_attachment_missing",
    title: "Anexo obrigatório faltando na RFQ",
    description: "O varejista exige um documento específico que não foi incluído no pacote de RFQ.",
    severity: "MEDIUM",
    applicableStages: ["RFQ_PREPARATION", "RFQ_SENT"],
    actionSteps: [
      { order: 1, action: "Verificar playbook do varejista", description: "Consulte os requisitos de RFQ do varejista no playbook.", dueHours: 0.5 },
      { order: 2, action: "Verificar dossiê", description: "Confirme se o documento está disponível no dossiê do cliente.", dueHours: 0.5 },
      { order: 3, action: "Solicitar ao cliente", description: "Se não estiver no dossiê, solicite ao cliente com urgência.", dueHours: 2 },
      { order: 4, action: "Reenviar RFQ", description: "Após obter o documento, reenvie a RFQ com o anexo correto.", dueHours: 4 }
    ]
  },
  {
    scenarioKey: "consumption_variance_high",
    title: "Variação alta no consumo do cliente",
    description: "O consumo real do cliente está muito diferente do previsto, podendo gerar multas ou ajustes.",
    severity: "MEDIUM",
    applicableStages: ["COMMISSION_TRACKING", "BILLING"],
    actionSteps: [
      { order: 1, action: "Quantificar variação", description: "Calcule a diferença percentual entre consumo previsto e real.", dueHours: 1 },
      { order: 2, action: "Verificar política do varejista", description: "Consulte como o varejista trata variações (true-up, clawback, offset).", dueHours: 1 },
      { order: 3, action: "Alertar cliente", description: "Informe o cliente sobre a variação e possíveis impactos financeiros.", dueHours: 4 },
      { order: 4, action: "Ajustar previsão futura", description: "Se for tendência, atualize a projeção de consumo no sistema.", dueHours: 8 }
    ]
  },
  {
    scenarioKey: "deal_stalled",
    title: "Deal parado há muito tempo",
    description: "O deal não progride há vários dias e pode estar em risco de ser perdido.",
    severity: "MEDIUM",
    applicableStages: ["PROSPECTING", "QUALIFICATION", "NEGOTIATION"],
    actionSteps: [
      { order: 1, action: "Revisar histórico", description: "Verifique a última ação tomada e por que parou.", dueHours: 0.5 },
      { order: 2, action: "Identificar bloqueio", description: "Descubra se está esperando cliente, varejista, ou é bloqueio interno.", dueHours: 1 },
      { order: 3, action: "Fazer follow-up proativo", description: "Entre em contato com a parte que está atrasando o processo.", dueHours: 2 },
      { order: 4, action: "Definir próximo passo", description: "Registre claramente qual é a próxima ação e quem é responsável.", dueHours: 1 },
      { order: 5, action: "Considerar perda", description: "Se não há progresso após 14 dias sem resposta, considere marcar como 'Lost'.", dueHours: 336 }
    ],
    escalationPath: { afterHours: 168, escalateTo: "gerente_comercial", method: "slack" }
  }
];

export const OPS_CHECKLISTS = [
  {
    dealStage: "DOSSIER_BUILDING",
    name: "Preparação do Dossiê",
    items: [
      { itemKey: "cnpj_verified", label: "CNPJ verificado e ativo", description: "Confirme que o CNPJ está ativo na Receita Federal", helpText: "Acesse https://servicos.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp", isBlocking: true },
      { itemKey: "bills_uploaded", label: "Mínimo 3 faturas recentes", description: "Pelo menos 3 faturas dos últimos 6 meses", helpText: "Peça ao cliente via portal ou email", isBlocking: true },
      { itemKey: "consumption_profile", label: "Perfil de consumo extraído", description: "Dados de consumo foram extraídos das faturas", helpText: "Use o OCR automático ou preencha manualmente", isBlocking: true },
      { itemKey: "contract_social", label: "Contrato social disponível", description: "Documento necessário para verificar signatários", helpText: "Solicite ao cliente se não tiver", isBlocking: false }
    ]
  },
  {
    dealStage: "RFQ_PREPARATION",
    name: "Preparação da RFQ",
    items: [
      { itemKey: "dossier_ready", label: "Dossiê marcado como READY", description: "O dossiê foi revisado e está completo", helpText: "Vá ao dossiê e clique em 'Marcar como Pronto'", isBlocking: true },
      { itemKey: "suppliers_selected", label: "Varejistas selecionados", description: "Escolha pelo menos 3 varejistas para enviar RFQ", helpText: "Use o scorecard de varejistas para escolher os melhores", isBlocking: true },
      { itemKey: "rfq_template_reviewed", label: "Template da RFQ revisado", description: "Confirme que os dados do cliente estão corretos no template", helpText: "Verifique especialmente CNPJ, UCs e período de suprimento", isBlocking: false }
    ]
  },
  {
    dealStage: "QUOTE_ANALYSIS",
    name: "Análise de Cotações",
    items: [
      { itemKey: "min_quotes_received", label: "Mínimo de cotações recebidas", description: "Recebeu pelo menos 2 cotações para comparação", helpText: "Faça follow-up com varejistas que não responderam", isBlocking: true },
      { itemKey: "benchmark_compared", label: "Comparado com benchmark", description: "Cotações foram comparadas com preço médio de mercado", helpText: "Veja o painel de benchmarks", isBlocking: false },
      { itemKey: "client_notified", label: "Cliente informado das opções", description: "O cliente foi apresentado às opções disponíveis", helpText: "Envie proposta comparativa", isBlocking: false }
    ]
  },
  {
    dealStage: "CONTRACT_PREPARATION",
    name: "Preparação do Contrato",
    items: [
      { itemKey: "signer_confirmed", label: "Signatário confirmado", description: "Verificou quem tem poderes para assinar o contrato", helpText: "Consulte contrato social ou procuração", isBlocking: true },
      { itemKey: "terms_reviewed", label: "Termos revisados com cliente", description: "O cliente entendeu e concordou com todos os termos", helpText: "Destaque cláusulas importantes", isBlocking: true },
      { itemKey: "credit_approved", label: "Crédito aprovado pelo varejista", description: "O varejista confirmou aprovação de crédito", helpText: "Se rejeitado, siga o playbook de crédito rejeitado", isBlocking: true }
    ]
  },
  {
    dealStage: "CONTRACT_SIGNED",
    name: "Contrato Assinado",
    items: [
      { itemKey: "signatures_complete", label: "Todas as assinaturas obtidas", description: "Contrato assinado por todas as partes", helpText: "Verifique no sistema de assinatura digital", isBlocking: true },
      { itemKey: "commission_snapshot", label: "Snapshot de comissão criado", description: "Termos de comissão foram registrados e congelados", helpText: "Isso acontece automaticamente ao marcar assinado", isBlocking: true },
      { itemKey: "onboarding_initiated", label: "Onboarding iniciado", description: "O varejista foi notificado para iniciar onboarding", helpText: "Envie os dados do cliente ao varejista", isBlocking: false }
    ]
  }
];

export async function seedOpsPlaybooks(): Promise<{ playbooks: number; checklists: number; items: number }> {
  let playbooksCreated = 0;
  let checklistsCreated = 0;
  let itemsCreated = 0;

  for (const playbook of OPS_PLAYBOOKS) {
    const existing = await storage.getPlaybookByKey(playbook.scenarioKey);
    if (existing) continue;

    await storage.createOpsPlaybook({
      scenarioKey: playbook.scenarioKey,
      title: playbook.title,
      description: playbook.description,
      severity: playbook.severity,
      applicableStages: playbook.applicableStages,
      actionSteps: playbook.actionSteps,
      escalationPath: playbook.escalationPath,
      isActive: true,
      sortOrder: OPS_PLAYBOOKS.indexOf(playbook)
    });
    playbooksCreated++;
  }

  for (const checklist of OPS_CHECKLISTS) {
    const existing = await storage.getChecklists(checklist.dealStage);
    if (existing.length > 0) continue;

    const created = await storage.createOpsChecklist({
      dealStage: checklist.dealStage,
      name: checklist.name,
      isActive: true,
      sortOrder: OPS_CHECKLISTS.indexOf(checklist)
    });
    checklistsCreated++;

    for (const item of checklist.items) {
      await storage.createOpsChecklistItem({
        checklistId: created.id,
        itemKey: item.itemKey,
        label: item.label,
        description: item.description,
        helpText: item.helpText,
        isBlocking: item.isBlocking,
        requiresEvidence: false,
        sortOrder: checklist.items.indexOf(item),
        isActive: true
      });
      itemsCreated++;
    }
  }

  return { playbooks: playbooksCreated, checklists: checklistsCreated, items: itemsCreated };
}
