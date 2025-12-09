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
