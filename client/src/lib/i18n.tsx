import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "pt" | "en";

const translations = {
  pt: {
    "admin.title": "Ótima Energia",
    "admin.subtitle": "Painel Administrativo",
    "admin.sync_zoho": "Sincronizar com Zoho",
    "admin.stats.leads": "Leads",
    "admin.stats.clients": "Clientes",
    "admin.stats.rfqs": "Cotações",
    "admin.tab.leads": "Leads",
    "admin.tab.clients": "Clientes",
    "admin.tab.rfqs": "Cotações",
    "admin.leads.title": "Leads Recebidos",
    "admin.leads.description": "Leads capturados do site",
    "admin.leads.empty": "Nenhum lead ainda",
    "admin.leads.convert": "Converter",
    "admin.clients.title": "Clientes",
    "admin.clients.description": "Gerenciar clientes e gerar links de upload",
    "admin.clients.new": "Novo Cliente",
    "admin.clients.empty": "Nenhum cliente ainda",
    "admin.clients.generate_link": "Gerar Link",
    "admin.clients.dialog.title": "Adicionar Novo Cliente",
    "admin.clients.dialog.description": "Preencha os dados do cliente",
    "admin.clients.dialog.company": "Empresa *",
    "admin.clients.dialog.cnpj": "CNPJ",
    "admin.clients.dialog.contact": "Contato",
    "admin.clients.dialog.email": "Email",
    "admin.clients.dialog.phone": "Telefone",
    "admin.clients.dialog.uc_code": "Código UC",
    "admin.clients.dialog.save": "Salvar Cliente",
    "admin.rfqs.title": "Solicitações de Cotação",
    "admin.rfqs.description": "Gerenciar RFQs e cotações de fornecedores",
    "admin.rfqs.empty": "Nenhuma cotação ainda",
    "admin.rfqs.view_details": "Ver Detalhes",
    "admin.toast.client_created": "Cliente criado com sucesso!",
    "admin.toast.lead_converted": "Lead convertido em cliente!",
    "admin.toast.link_generated": "Link de upload gerado!",
    "admin.toast.link_copied": "Link copiado!",
    "admin.toast.access_code": "Código de acesso:",
    "admin.toast.sync_initiated": "Sincronização Zoho",
    "status.prospect": "Prospecto",
    "status.awaiting_quote": "Aguardando Cotação",
    "status.negotiating": "Negociando",
    "status.active": "Ativo",
    "status.closed": "Fechado",
    "status.lost": "Perdido",
    "language.toggle": "English",
    "quotes.title": "Cotações de Fornecedores",
    "quotes.avg_consumption": "Consumo médio",
    "quotes.current_price": "Preço atual",
    "quotes.not_informed": "Não informado",
    "quotes.new_quote": "Nova Cotação",
    "quotes.add_quote_title": "Adicionar Cotação de Fornecedor",
    "quotes.add_quote_desc": "Insira os dados da proposta recebida",
    "quotes.supplier": "Fornecedor *",
    "quotes.supplier_placeholder": "Selecione ou digite o nome...",
    "quotes.supplier_hint": "Digite para adicionar um novo fornecedor",
    "quotes.quote_reference": "Referência da Proposta",
    "quotes.valid_until": "Válido até *",
    "quotes.price_type": "Tipo de Preço",
    "quotes.fixed_price": "Preço Fixo (R$/MWh)",
    "quotes.pld_spread": "PLD + Spread",
    "quotes.price_rmwh": "Preço (R$/MWh)",
    "quotes.spread_rmwh": "Spread sobre PLD (R$/MWh)",
    "quotes.demand_price": "Demanda (R$/kW/mês)",
    "quotes.contract_duration": "Duração do Contrato",
    "quotes.contract_type": "Tipo de Contrato",
    "quotes.our_commission": "Nossa Comissão (R$/MWh)",
    "quotes.commission_paid_by": "Comissão Paga Por",
    "quotes.by_supplier": "Fornecedor",
    "quotes.by_client": "Cliente",
    "quotes.calculate": "Calcular",
    "quotes.calculating": "Calculando...",
    "quotes.calc_result": "Resultado do Cálculo",
    "quotes.annual_cost": "Custo Anual Cliente",
    "quotes.annual_commission": "Nossa Comissão Anual",
    "quotes.annual_savings": "Economia Anual Cliente",
    "quotes.effective_price": "Preço Efetivo",
    "quotes.cancel": "Cancelar",
    "quotes.save_quote": "Salvar Cotação",
    "quotes.no_quotes": "Nenhuma cotação cadastrada",
    "quotes.no_quotes_hint": "Clique em \"Nova Cotação\" para adicionar",
    "quotes.best_price": "Melhor Preço",
    "quotes.mark_won": "Marcar Ganha",
    "quotes.price": "Preço",
    "quotes.validity": "Validade",
    "quotes.duration": "Duração",
    "quotes.type": "Tipo",
    "quotes.savings": "Economia",
    "quotes.paid_by": "Paga por",
    "quotes.commission_summary": "Resumo de Comissões",
    "quotes.best_quote": "Melhor cotação",
    "quotes.annual_commission_label": "Comissão anual",
    "quotes.status.won": "Ganha",
    "quotes.status.active": "Ativa",
    "quotes.status.expired": "Expirada",
    "quotes.status.lost": "Perdida",
    "quotes.status.draft": "Rascunho",
    "quotes.toast.added": "Cotação adicionada com sucesso!",
    "quotes.toast.won": "Cotação marcada como ganha!",
    "quotes.toast.error": "Erro",
    "quotes.toast.fill_required": "Preencha fornecedor e data de validade",
    "quotes.months": "meses",
    "quotes.per_year": "/ano",
    "quotes.upload_bill": "Upload Fatura",
    "quotes.quotes_btn": "Cotações",
  },
  en: {
    "admin.title": "Ótima Energia",
    "admin.subtitle": "Admin Dashboard",
    "admin.sync_zoho": "Sync with Zoho",
    "admin.stats.leads": "Leads",
    "admin.stats.clients": "Clients",
    "admin.stats.rfqs": "Quotes",
    "admin.tab.leads": "Leads",
    "admin.tab.clients": "Clients",
    "admin.tab.rfqs": "Quotes",
    "admin.leads.title": "Received Leads",
    "admin.leads.description": "Leads captured from website",
    "admin.leads.empty": "No leads yet",
    "admin.leads.convert": "Convert",
    "admin.clients.title": "Clients",
    "admin.clients.description": "Manage clients and generate upload links",
    "admin.clients.new": "New Client",
    "admin.clients.empty": "No clients yet",
    "admin.clients.generate_link": "Generate Link",
    "admin.clients.dialog.title": "Add New Client",
    "admin.clients.dialog.description": "Fill in client details",
    "admin.clients.dialog.company": "Company *",
    "admin.clients.dialog.cnpj": "Tax ID",
    "admin.clients.dialog.contact": "Contact",
    "admin.clients.dialog.email": "Email",
    "admin.clients.dialog.phone": "Phone",
    "admin.clients.dialog.uc_code": "UC Code",
    "admin.clients.dialog.save": "Save Client",
    "admin.rfqs.title": "Quote Requests",
    "admin.rfqs.description": "Manage RFQs and supplier quotes",
    "admin.rfqs.empty": "No quotes yet",
    "admin.rfqs.view_details": "View Details",
    "admin.toast.client_created": "Client created successfully!",
    "admin.toast.lead_converted": "Lead converted to client!",
    "admin.toast.link_generated": "Upload link generated!",
    "admin.toast.link_copied": "Link copied!",
    "admin.toast.access_code": "Access code:",
    "admin.toast.sync_initiated": "Zoho Sync",
    "status.prospect": "Prospect",
    "status.awaiting_quote": "Awaiting Quote",
    "status.negotiating": "Negotiating",
    "status.active": "Active",
    "status.closed": "Closed",
    "status.lost": "Lost",
    "language.toggle": "Português",
    "quotes.title": "Supplier Quotes",
    "quotes.avg_consumption": "Avg consumption",
    "quotes.current_price": "Current price",
    "quotes.not_informed": "Not informed",
    "quotes.new_quote": "New Quote",
    "quotes.add_quote_title": "Add Supplier Quote",
    "quotes.add_quote_desc": "Enter the proposal details",
    "quotes.supplier": "Supplier *",
    "quotes.supplier_placeholder": "Select or type name...",
    "quotes.supplier_hint": "Type to add a new supplier",
    "quotes.quote_reference": "Quote Reference",
    "quotes.valid_until": "Valid until *",
    "quotes.price_type": "Price Type",
    "quotes.fixed_price": "Fixed Price (R$/MWh)",
    "quotes.pld_spread": "PLD + Spread",
    "quotes.price_rmwh": "Price (R$/MWh)",
    "quotes.spread_rmwh": "Spread over PLD (R$/MWh)",
    "quotes.demand_price": "Demand (R$/kW/month)",
    "quotes.contract_duration": "Contract Duration",
    "quotes.contract_type": "Contract Type",
    "quotes.our_commission": "Our Commission (R$/MWh)",
    "quotes.commission_paid_by": "Commission Paid By",
    "quotes.by_supplier": "Supplier",
    "quotes.by_client": "Client",
    "quotes.calculate": "Calculate",
    "quotes.calculating": "Calculating...",
    "quotes.calc_result": "Calculation Result",
    "quotes.annual_cost": "Annual Client Cost",
    "quotes.annual_commission": "Our Annual Commission",
    "quotes.annual_savings": "Annual Client Savings",
    "quotes.effective_price": "Effective Price",
    "quotes.cancel": "Cancel",
    "quotes.save_quote": "Save Quote",
    "quotes.no_quotes": "No quotes registered",
    "quotes.no_quotes_hint": "Click \"New Quote\" to add",
    "quotes.best_price": "Best Price",
    "quotes.mark_won": "Mark as Won",
    "quotes.price": "Price",
    "quotes.validity": "Validity",
    "quotes.duration": "Duration",
    "quotes.type": "Type",
    "quotes.savings": "Savings",
    "quotes.paid_by": "Paid by",
    "quotes.commission_summary": "Commission Summary",
    "quotes.best_quote": "Best quote",
    "quotes.annual_commission_label": "Annual commission",
    "quotes.status.won": "Won",
    "quotes.status.active": "Active",
    "quotes.status.expired": "Expired",
    "quotes.status.lost": "Lost",
    "quotes.status.draft": "Draft",
    "quotes.toast.added": "Quote added successfully!",
    "quotes.toast.won": "Quote marked as won!",
    "quotes.toast.error": "Error",
    "quotes.toast.fill_required": "Fill in supplier and validity date",
    "quotes.months": "months",
    "quotes.per_year": "/year",
    "quotes.upload_bill": "Upload Bill",
    "quotes.quotes_btn": "Quotes",
  }
};

type TranslationKey = keyof typeof translations.pt;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_language");
      if (saved === "en" || saved === "pt") return saved;
    }
    return "pt";
  });

  useEffect(() => {
    localStorage.setItem("admin_language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
