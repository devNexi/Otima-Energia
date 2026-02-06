import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  DollarSign,
  Send,
  CheckCircle,
  Building,
  Receipt,
  Shield,
  Zap,
  ExternalLink,
  AlertTriangle,
  Lock,
  Star,
  Eye,
  Mail,
} from "lucide-react";

interface WalkthroughStep {
  number: number;
  title: string;
  description: string;
  actions: string[];
  link?: string;
  linkLabel?: string;
  tip?: string;
}

interface WalkthroughSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: WalkthroughStep[];
}

const sections: WalkthroughSection[] = [
  {
    id: "starting",
    title: "1. Iniciando um Negócio",
    icon: <FileText className="h-5 w-5" />,
    description: "Um novo negócio pode vir do Zoho CRM ou ser criado manualmente.",
    steps: [
      {
        number: 1,
        title: "Entrada via Zoho CRM (automático)",
        description: "Quando um lead é qualificado no Zoho, o sistema cria automaticamente um negócio no portal.",
        actions: [
          "O Zoho envia os dados via integração (POST /api/intake/zoho/deal)",
          "O portal cria o negócio com todos os campos do lead",
          "Um banner aparece: 'Originado do Zoho CRM • Controle operacional na Ótima'",
          "Os campos do Zoho ficam somente leitura no portal"
        ],
        tip: "Negócios do Zoho aparecem automaticamente na lista de negócios."
      },
      {
        number: 2,
        title: "Criação Manual",
        description: "Para leads que chegam fora do Zoho (indicações, WhatsApp, etc).",
        actions: [
          "Acesse Negócios no menu lateral",
          "Clique em 'Novo Negócio'",
          "Preencha: nome do cliente, empresa, contato, segmento",
          "Selecione o responsável pelo negócio",
          "Salve o negócio"
        ],
        link: "/admin/deals",
        linkLabel: "Ir para Negócios"
      }
    ]
  },
  {
    id: "dossier",
    title: "2. Criando o Dossiê do Cliente",
    icon: <Upload className="h-5 w-5" />,
    description: "O dossiê é o perfil energético do cliente. Sem ele, não há como fazer cotação.",
    steps: [
      {
        number: 3,
        title: "Upload da Conta de Energia",
        description: "Faça upload da fatura de energia do cliente para extrair os dados de consumo.",
        actions: [
          "Abra o negócio desejado",
          "Clique na aba 'Dossiê'",
          "Faça upload da conta de energia (PDF ou imagem)",
          "O sistema extrai automaticamente os dados via OCR",
          "Revise os dados extraídos e corrija se necessário"
        ],
        tip: "Quanto melhor a qualidade do scan, mais precisa será a extração automática."
      },
      {
        number: 4,
        title: "Verificar e Travar o Dossiê",
        description: "Após validar todos os dados, trave o dossiê para garantir integridade.",
        actions: [
          "Confirme: CNPJ, razão social, distribuidora, submercado",
          "Confirme: consumo mensal/anual (MWh), demanda (kW)",
          "Confirme: classe tarifária (A4, A3, etc)",
          "Mude o status de RASCUNHO → PRONTO → TRAVADO",
          "Uma vez travado, os dados não podem ser alterados"
        ],
        tip: "O dossiê travado é a base para todas as cotações e propostas."
      }
    ]
  },
  {
    id: "quotes",
    title: "3. Recebendo Cotações",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Receba cotações dos fornecedores e registre no sistema.",
    steps: [
      {
        number: 5,
        title: "Entrada de Cotações",
        description: "Registre as cotações recebidas dos fornecedores (WhatsApp, email, etc).",
        actions: [
          "No negócio, acesse a aba 'Cotações'",
          "Clique em 'Nova Cotação'",
          "Selecione o fornecedor",
          "Preencha: preço (R$/MWh), prazo (meses), tipo de produto",
          "O sistema gera automaticamente um hash SHA-256 para imutabilidade",
          "A cotação fica registrada como registro imutável"
        ],
        link: "/admin/deals",
        linkLabel: "Ver Negócios"
      },
      {
        number: 6,
        title: "Definir Preço ao Cliente (OBRIGATÓRIO)",
        description: "Para cada cotação que vai para proposta, defina o preço com margem da Ótima.",
        actions: [
          "Na cotação, clique em 'Definir Preço ao Cliente'",
          "Escolha o tipo de margem: R$/MWh ou Percentual (%)",
          "Digite o valor da margem (ex: R$ 5,00/MWh ou 3%)",
          "Veja o preview do preço ao cliente calculado automaticamente",
          "Clique em 'Confirmar Preço' para salvar",
          "O badge muda para 'Pronto' (verde) = elegível para proposta"
        ],
        tip: "Este passo é OBRIGATÓRIO. Propostas só podem ser criadas com cotações que têm preço ao cliente definido."
      }
    ]
  },
  {
    id: "proposals",
    title: "4. Preparando a Proposta",
    icon: <Star className="h-5 w-5" />,
    description: "Monte a proposta comercial usando o assistente guiado.",
    steps: [
      {
        number: 7,
        title: "Abrir o Módulo de Propostas",
        description: "Acesse o módulo dedicado de propostas.",
        actions: [
          "Clique em 'Propostas' no menu lateral",
          "Ou na aba 'Propostas' dentro do negócio",
          "Veja a lista de todas as propostas com status"
        ],
        link: "/admin/proposals",
        linkLabel: "Ir para Propostas"
      },
      {
        number: 8,
        title: "Assistente de Proposta (4 Passos)",
        description: "O sistema guia você passo a passo para montar a proposta.",
        actions: [
          "Passo 1: Selecione o Negócio",
          "Passo 2: Escolha as Cotações Elegíveis (só aparecem as que têm preço ao cliente)",
          "  → Se múltiplas: marque a recomendada e explique o motivo",
          "Passo 3: Configure validade (7/15/30/45/60 dias)",
          "Passo 4: Revise tudo e clique em 'Gerar Proposta'",
          "O sistema gera o link público e o PDF automaticamente"
        ],
        tip: "A proposta mostra: preço ao cliente, custo mensal estimado, custo anual estimado, economia versus conta atual."
      },
      {
        number: 9,
        title: "Enviar a Proposta ao Cliente",
        description: "Envie a proposta por email diretamente do portal.",
        actions: [
          "Na proposta gerada, clique em 'Enviar por Email'",
          "Digite o email do destinatário",
          "Adicione uma mensagem personalizada (opcional)",
          "Clique em 'Enviar'",
          "Status muda para 'ENVIADA'",
          "Quando o cliente abrir o link, status muda para 'VISUALIZADA'"
        ],
        tip: "Você pode acompanhar quantas vezes o cliente visualizou a proposta."
      }
    ]
  },
  {
    id: "closing",
    title: "5. Fechamento e Pagamento",
    icon: <Receipt className="h-5 w-5" />,
    description: "Feche o negócio e receba comissões com o modelo 50/50.",
    steps: [
      {
        number: 10,
        title: "Aceite e Assinatura do Contrato",
        description: "Quando o cliente aceita a proposta e assina o contrato.",
        actions: [
          "Marque a proposta como 'ACEITA'",
          "Avance o negócio para status 'CONTRATO ASSINADO'",
          "O sistema cria automaticamente um rascunho de fatura para 50% da comissão (Milestone 1)"
        ],
        tip: "Milestone 1 = 50% da comissão, disparada na assinatura do contrato."
      },
      {
        number: 11,
        title: "Ativação CCEE (Suprimento Ativo)",
        description: "Quando o fornecedor ativa o suprimento na CCEE.",
        actions: [
          "Avance o negócio para status 'CCEE ATIVO'",
          "O sistema cria automaticamente um rascunho de fatura para os 50% restantes (Milestone 2)",
          "Revise os rascunhos de fatura em Comissão",
          "Envie as faturas e acompanhe o pagamento"
        ],
        link: "/admin/commission",
        linkLabel: "Ver Comissões",
        tip: "Milestone 2 = 50% restante, disparada quando o suprimento está ativo na CCEE."
      },
      {
        number: 12,
        title: "Acompanhamento de Pagamentos",
        description: "Gerencie o ciclo de vida das faturas de comissão.",
        actions: [
          "Acesse 'Comissão' no menu lateral",
          "Veja faturas pendentes, enviadas e pagas",
          "Marque faturas como pagas quando o pagamento for confirmado",
          "Exporte relatórios em CSV para controle financeiro"
        ]
      }
    ]
  }
];

export default function RenanWalkthrough() {
  const { user } = useAuth();

  if (user?.role !== "admin" && user?.role !== "sales" && user?.role !== "ops") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Este guia é apenas para equipe interna.</p>
            <Link href="/admin">
              <Button>Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/deals">
              <Button variant="ghost" size="sm" data-testid="link-back-admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-violet-600" />
            Como Renan Usa o Portal Ótima
          </h1>
          <p className="text-gray-600 mt-2">
            Guia passo a passo do fluxo completo: do lead ao pagamento da comissão.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Badge className="bg-violet-100 text-violet-700">12 passos</Badge>
            <Badge className="bg-emerald-100 text-emerald-700">5 etapas</Badge>
            <Badge className="bg-blue-100 text-blue-700">Modelo 50/50</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Summary */}
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Fluxo Resumido
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">Lead/Zoho</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">Dossiê</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">Cotações</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">Preço ao Cliente</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">Proposta</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="outline">Contrato</Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge className="bg-emerald-100 text-emerald-700">Comissão 50/50</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Protection Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Proteção de Receita</h3>
                <p className="text-sm text-amber-800 mt-1">
                  O sistema tem 3 camadas de preço: <strong>Preço do Fornecedor</strong> (interno) → <strong>Preço ao Cliente</strong> (com margem) → <strong>Proposta</strong> (documento final). 
                  O cliente NUNCA vê o preço base do fornecedor nem a margem da Ótima. Os PDFs e links públicos são verificados automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Model */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Receipt className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Modelo de Comissão 50/50</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">MILESTONE 1 — 50%</p>
                    <p className="text-sm text-blue-900 mt-1">Disparada quando o negócio atinge <strong>CONTRATO ASSINADO</strong></p>
                    <p className="text-xs text-blue-600 mt-2">Fatura de rascunho criada automaticamente</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-semibold">MILESTONE 2 — 50%</p>
                    <p className="text-sm text-blue-900 mt-1">Disparada quando o negócio atinge <strong>CCEE ATIVO</strong></p>
                    <p className="text-xs text-blue-600 mt-2">Fatura de rascunho criada automaticamente</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4" data-testid={`section-${section.id}`}>
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600">
                {section.icon}
              </span>
              {section.title}
            </h2>
            <p className="text-gray-600 mb-4 ml-10">{section.description}</p>

            <div className="space-y-4 ml-10">
              {section.steps.map((step) => (
                <Card key={step.number} data-testid={`step-${step.number}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex-shrink-0">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                        <ul className="mt-3 space-y-1.5">
                          {step.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>

                        {step.tip && (
                          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
                            <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Dica:</strong> {step.tip}</span>
                          </div>
                        )}

                        {step.link && (
                          <Link href={step.link}>
                            <Button variant="outline" size="sm" className="mt-3" data-testid={`link-step-${step.number}`}>
                              <ExternalLink className="h-3 w-3 mr-2" />
                              {step.linkLabel || "Ir para a página"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="mt-8" />
          </div>
        ))}
      </div>
    </div>
  );
}