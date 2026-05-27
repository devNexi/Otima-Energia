import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft, Download, ChevronDown, ChevronRight, FileText,
  Target, Hash, MinusCircle, Megaphone, Puzzle, CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchType = "Exact" | "Phrase";
interface Keyword { text: string; matchType: MatchType; }
interface RSA {
  headlines: string[];   // max 15, ≤30 chars each
  descriptions: string[]; // max 4, ≤90 chars each
  path1: string;  // ≤15 chars
  path2: string;  // ≤15 chars
}
interface AdGroupData {
  name: string;
  keywords: Keyword[];
  rsa: RSA;
  adGroupNegatives?: string[];
}
interface CampaignData {
  name: string;
  theme: string;
  campaignNegatives?: string[];
  adGroups: AdGroupData[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FINAL_URL = "https://www.otimaenergia.com/reduza";
const DAILY_BUDGET = "30";
const LANGUAGE = "Portuguese";
const LOCATION = "Brazil";
const NETWORK = "Google Search";
const STATUS = "Paused";

// ─── PPC Strategy Data ────────────────────────────────────────────────────────

const CAMPAIGNS: CampaignData[] = [
  {
    name: "01_Reducao_Custo_Energia_BR",
    theme: "Redução de Conta de Energia",
    campaignNegatives: [
      "solar residencial", "painel solar", "placa solar", "energia solar casa",
      "segunda via", "boleto", "ouvidoria", "emprego", "vaga", "curso",
      "pdf", "planilha", "template", "residencial", "pessoa física",
    ],
    adGroups: [
      {
        name: "AG1_Reducao_Conta_Luz",
        keywords: [
          { text: "redução de conta de luz", matchType: "Exact" },
          { text: "reduzir conta de luz empresa", matchType: "Exact" },
          { text: "como reduzir conta de luz empresa", matchType: "Phrase" },
          { text: "conta de luz alta empresa", matchType: "Phrase" },
          { text: "reduzir conta de energia empresa", matchType: "Phrase" },
          { text: "diminuir conta de energia elétrica empresa", matchType: "Phrase" },
          { text: "solução para conta de luz cara empresa", matchType: "Phrase" },
          { text: "conta de energia cara empresa", matchType: "Exact" },
        ],
        rsa: {
          headlines: [
            "Reduza Sua Conta de Luz",
            "Desconto Direto na Fatura",
            "Análise Gratuita p/ Empresa",
            "Sem Trocar de Distribuidora",
            "Sem Instalar Placa Solar",
            "Sem Obra na Empresa",
            "Resultado em 30 a 60 Dias",
            "Diagnóstico Energético Grátis",
            "Empresa Acima de R$5 mil",
            "Pago Pelos Fornecedores",
            "Compare e Economize Energia",
            "Independente e Sem Conflito",
            "Especialistas em Energia",
            "Solicite Diagnóstico Agora",
            "Energia Mais Barata Agora",
          ],
          descriptions: [
            "Analisamos sua conta e identificamos oportunidades reais de desconto. Sem obra, sem solar.",
            "A Ótima Energia é independente: comparamos todas as opções e recomendamos o que é melhor.",
            "Serviço gratuito para empresas. Somos remunerados pelos fornecedores, não por você.",
            "Empresas com conta acima de R$5 mil/mês podem economizar. Envie sua conta e descubra.",
          ],
          path1: "reducao-conta",
          path2: "empresa",
        },
      },
      {
        name: "AG2_Economia_Energia_Empresa",
        keywords: [
          { text: "economia de energia empresa", matchType: "Exact" },
          { text: "economizar na conta de luz empresa", matchType: "Phrase" },
          { text: "economia conta de energia elétrica", matchType: "Exact" },
          { text: "reduzir gasto com energia elétrica", matchType: "Phrase" },
          { text: "custo de energia elétrica empresa", matchType: "Exact" },
          { text: "alto custo energia empresa", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Economize na Conta de Luz",
            "Reduza Gastos com Energia",
            "Análise de Energia Grátis",
            "Sem Custo para Sua Empresa",
            "Desconto Imediato na Fatura",
            "Compare Fornecedores Agora",
            "Sem Obra, Sem Instalação",
            "Resultado Real e Comprovado",
            "Pago Pelos Seus Fornecedores",
            "Independente e Transparente",
            "Especialista em Economia",
            "Consulta Energética Grátis",
            "Acima de R$5 mil por Mês",
            "Reduza Hoje Mesmo",
            "Ótima Energia — Compare Já",
          ],
          descriptions: [
            "Reduzimos o custo de energia da sua empresa sem obras, sem troca de distribuidora, sem solar.",
            "Trabalhamos com os melhores fornecedores nacionais. Você compara e escolhe com clareza.",
            "Para empresas que pagam mais de R$5 mil por mês em energia. Diagnóstico 100% gratuito.",
            "Transparência total: você sabe exatamente como e por quem somos remunerados.",
          ],
          path1: "economia",
          path2: "empresa",
        },
      },
      {
        name: "AG3_Desconto_Energia_Comercial",
        keywords: [
          { text: "desconto na conta de energia empresa", matchType: "Exact" },
          { text: "desconto conta de luz empresa", matchType: "Exact" },
          { text: "como ter desconto na energia elétrica", matchType: "Phrase" },
          { text: "desconto energia elétrica empresa", matchType: "Phrase" },
          { text: "desconto energia comercial", matchType: "Exact" },
          { text: "desconto na fatura de energia", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Desconto na Conta de Energia",
            "Até 25% de Desconto Real",
            "Sem Placa Solar Nem Obra",
            "Análise Gratuita Agora",
            "Desconto Direto na Fatura",
            "Empresa Elegível? Descubra",
            "Verificação em 24 Horas",
            "Sem Trocar Distribuidora",
            "Para Comércio e Indústria",
            "Resultado Comprovado",
            "Ótima Energia Independente",
            "Compare Suas Opções Hoje",
            "Pago Pelos Fornecedores",
            "Solicite Análise Grátis",
            "Descubra Seu Desconto Agora",
          ],
          descriptions: [
            "Analisamos sua fatura e encontramos desconto real sem obras ou instalações.",
            "Comparamos os melhores fornecedores do mercado para garantir o melhor resultado para você.",
            "Serviço 100% gratuito. Somos remunerados pelos parceiros quando geramos valor real.",
            "Envie sua conta de luz e receba análise com seu desconto potencial em até 24 horas.",
          ],
          path1: "desconto",
          path2: "diagnostico",
        },
      },
    ],
  },
  {
    name: "02_Mercado_Livre_Energia_BR",
    theme: "Mercado Livre de Energia / ACL",
    campaignNegatives: [
      "mercado livre compras", "mercado pago", "comprar no mercado livre",
      "vender no mercado livre", "mercado livre app", "mercado livre site",
      "segunda via", "boleto", "emprego", "curso", "residencial",
    ],
    adGroups: [
      {
        name: "AG1_Mercado_Livre_Energia",
        keywords: [
          { text: "mercado livre de energia", matchType: "Exact" },
          { text: "mercado livre de energia elétrica", matchType: "Exact" },
          { text: "mercado livre de energia para empresas", matchType: "Phrase" },
          { text: "como entrar no mercado livre de energia", matchType: "Phrase" },
          { text: "o que é mercado livre de energia", matchType: "Phrase" },
          { text: "mercado livre de energia empresa", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Mercado Livre de Energia",
            "Acesse o Mercado Livre",
            "Energia Livre para Empresas",
            "Compare Preços de Energia",
            "Análise Grátis p/ Empresa",
            "Independência Energética",
            "Sair do Mercado Cativo",
            "Energia Livre Agora",
            "Qual a Melhor Opção?",
            "Diagnóstico Gratuito",
            "Economize no Mercado Livre",
            "Consultoria Independente",
            "Sem Custo Para Empresa",
            "Ótima Energia — ACL",
            "Saiba Se Você É Elegível",
          ],
          descriptions: [
            "Analisamos se sua empresa pode migrar para o Mercado Livre de Energia e quanto pode economizar.",
            "No Mercado Livre (ACL), sua empresa compra energia diretamente de comercializadoras. Mais opções, mais economia.",
            "Diagnóstico gratuito: verificamos elegibilidade, potencial de economia e próximos passos para você.",
            "A Ótima é independente — sem vínculo com comercializadoras, recomendamos o que é melhor para você.",
          ],
          path1: "mercado-livre",
          path2: "energia",
        },
      },
      {
        name: "AG2_ACL_Migracao",
        keywords: [
          { text: "ACL energia empresa", matchType: "Exact" },
          { text: "migração para ACL energia", matchType: "Exact" },
          { text: "migrar mercado livre de energia", matchType: "Phrase" },
          { text: "contrato de energia ACL", matchType: "Exact" },
          { text: "energia ACL empresa", matchType: "Phrase" },
          { text: "como migrar para ACL", matchType: "Phrase" },
          { text: "migrar para mercado livre energia", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Migre para ACL Agora",
            "Migração Energia ACL",
            "Como Migrar para ACL?",
            "Análise de Migração Grátis",
            "Elegível para ACL? Descubra",
            "Migração Sem Complicação",
            "Do Cativo ao Livre",
            "Suporte Completo na Migração",
            "ACL — Compra Energia Livre",
            "Consultoria ACL Gratuita",
            "Ótima Cuida da Migração",
            "Cuidamos de Todo o Processo",
            "Sem Burocracia Para Você",
            "Resultado Garantido no ACL",
            "Solicite Análise Agora",
          ],
          descriptions: [
            "Verificamos se sua empresa é elegível para o ACL e cuidamos de todo o processo de migração.",
            "A migração para Mercado Livre pode reduzir significativamente seu custo de energia elétrica.",
            "Nossa equipe gerencia contratos, documentação e negociação — sem burocracia para você.",
            "Diagnóstico gratuito. Somos remunerados pelos fornecedores quando geramos resultado real.",
          ],
          path1: "migracao-acl",
          path2: "empresa",
        },
      },
      {
        name: "AG3_Comercializadora_Energia",
        keywords: [
          { text: "comercializadora de energia elétrica", matchType: "Exact" },
          { text: "fornecedor de energia elétrica empresa", matchType: "Phrase" },
          { text: "contrato de energia elétrica empresa", matchType: "Phrase" },
          { text: "comprar energia elétrica empresa", matchType: "Phrase" },
          { text: "fornecimento de energia empresarial", matchType: "Exact" },
          { text: "melhor comercializadora de energia", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Qual Comercializadora Escolher",
            "Compare Comercializadoras",
            "Melhor Preço de Energia ACL",
            "Análise Independente Grátis",
            "Sem Vínculo c/ Fornecedores",
            "Recomendação Neutra e Real",
            "Melhores Ofertas do Mercado",
            "Para Empresas Elegíveis ACL",
            "Diagnóstico Energético Grátis",
            "Compare Contratos de Energia",
            "Ótima — Sem Conflito",
            "Economize no Fornecimento",
            "Solicitação em 24h",
            "Processo Simples e Rápido",
            "Energia Livre Para Sua Empresa",
          ],
          descriptions: [
            "Comparamos as principais comercializadoras do Brasil e recomendamos a melhor opção para você.",
            "A Ótima não tem vínculo com nenhuma comercializadora. Nossa análise é 100% independente.",
            "Você vê todas as opções e toma a decisão com informação. Sem pressão, sem conflito.",
            "Para empresas elegíveis ao ACL. Envie sua conta e veja se você já pode economizar.",
          ],
          path1: "comercializadora",
          path2: "compare",
        },
      },
    ],
  },
  {
    name: "03_Comparativo_ACR_ACL_GDL",
    theme: "ACR vs ACL vs Geração Distribuída",
    campaignNegatives: [
      "segunda via", "boleto", "emprego", "vaga", "curso", "residencial",
      "mercado livre compras", "mercado pago", "solar residencial",
    ],
    adGroups: [
      {
        name: "AG1_ACR_vs_ACL",
        keywords: [
          { text: "diferença entre ACR e ACL energia", matchType: "Exact" },
          { text: "ACR ACL energia empresa", matchType: "Exact" },
          { text: "mercado cativo vs mercado livre energia", matchType: "Phrase" },
          { text: "energia cativa vs energia livre empresa", matchType: "Phrase" },
          { text: "sair do mercado cativo de energia", matchType: "Phrase" },
          { text: "ACR ACL GDL diferença", matchType: "Exact" },
          { text: "comparar opções de energia empresa", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "ACR vs ACL: Qual Escolher?",
            "Entenda ACR ACL GDL",
            "Compare Suas Opções Agora",
            "Análise Independente Grátis",
            "Mercado Cativo vs Livre",
            "Qual a Melhor Energia?",
            "Diagnóstico Energético Grátis",
            "Sem Vínculo c/ Fornecedores",
            "Especialistas em Energia",
            "Compare Todos os Caminhos",
            "Ótima Mostra Todas Opções",
            "Você Decide Com Informação",
            "Para Empresas Elegíveis",
            "Solicite Análise Hoje",
            "GDL ACL: Veja o Melhor",
          ],
          descriptions: [
            "Analisamos ACR, ACL e GDL e mostramos qual é o melhor caminho para reduzir custos da sua empresa.",
            "A Ótima Energia não empurra solução: mostramos o quadro completo para você decidir com dados.",
            "Diagnóstico gratuito com análise de elegibilidade para ACL e GDL, com projeção de economia real.",
            "Sem conflito de interesse. Recomendamos o que realmente gera mais valor para sua empresa.",
          ],
          path1: "acr-acl-gdl",
          path2: "compare",
        },
      },
      {
        name: "AG2_GDL_Geracao_Distribuida",
        keywords: [
          { text: "geração distribuída energia empresa", matchType: "Exact" },
          { text: "energia por assinatura empresa", matchType: "Exact" },
          { text: "GDL energia empresa", matchType: "Exact" },
          { text: "como funciona geração distribuída", matchType: "Phrase" },
          { text: "crédito de energia geração distribuída", matchType: "Phrase" },
          { text: "energia renovável por assinatura empresa", matchType: "Phrase" },
          { text: "assinatura de energia renovável", matchType: "Exact" },
        ],
        rsa: {
          headlines: [
            "Geração Distribuída p/ Empresa",
            "Energia por Assinatura GDL",
            "Sem Instalar Nada na Empresa",
            "Créditos de Energia Renovável",
            "Como Funciona o GDL?",
            "Análise Grátis de GDL",
            "Desconto Sem Painel Solar",
            "Energia Limpa Sem Obra",
            "GDL: Economia Imediata",
            "Elegível para GDL? Saiba Já",
            "Usinas Parceiras Nacionais",
            "Sem Instalação, Sem Obra",
            "Desconto Direto na Fatura",
            "Processo Simples e Rápido",
            "Ótima — Especialistas GDL",
          ],
          descriptions: [
            "Na Geração Distribuída (GDL), sua empresa recebe créditos de energia sem instalar nada.",
            "Sem obra, sem painel solar, sem trocar de distribuidora. O desconto aparece direto na fatura.",
            "Conectamos sua empresa às melhores usinas parceiras. Diagnóstico de elegibilidade grátis.",
            "Verificamos se sua empresa pode acessar GDL e qual desconto real você pode obter hoje.",
          ],
          path1: "gdl",
          path2: "assinatura",
        },
      },
      {
        name: "AG3_Opcoes_Energia_Empresa",
        keywords: [
          { text: "qual melhor opção de energia para empresa", matchType: "Phrase" },
          { text: "opções de energia para empresa", matchType: "Exact" },
          { text: "tipos de contrato de energia empresa", matchType: "Phrase" },
          { text: "melhores opções de energia elétrica empresa", matchType: "Phrase" },
          { text: "consultoria opções de energia", matchType: "Exact" },
        ],
        rsa: {
          headlines: [
            "Qual a Melhor Opção p/ Você",
            "GDL, ACL ou Permanecer?",
            "Compare Todas as Opções",
            "Análise Completa e Grátis",
            "Diagnóstico Independente",
            "Sem Pressão Para Decidir",
            "Veja Todas as Saídas",
            "Você Escolhe Com Dados",
            "Consultoria Energética Grátis",
            "Especialistas em Energia",
            "Resultado em 24 Horas",
            "Sem Conflito de Interesse",
            "Análise Neutra de Mercado",
            "Ótima — Compare e Decida",
            "Solicite Diagnóstico Agora",
          ],
          descriptions: [
            "Analisamos GDL, ACL e todas as opções viáveis para sua empresa. Você vê tudo e escolhe.",
            "A Ótima Energia não tem vínculo com fornecedores. Recomendamos o que é melhor para você.",
            "Diagnóstico gratuito com projeção de economia para cada opção disponível no mercado.",
            "Decisão boa é decisão com dados. Elimine a assimetria de informação do mercado de energia.",
          ],
          path1: "opcoes",
          path2: "empresa",
        },
      },
    ],
  },
  {
    name: "04_Reducao_Custos_Empresariais",
    theme: "Redução de Custos Empresariais",
    campaignNegatives: [
      "contabilidade", "folha de pagamento", "imposto", "nota fiscal",
      "ERP", "software", "CRM", "marketing digital", "redes sociais",
      "segunda via", "boleto", "emprego", "curso", "residencial",
    ],
    adGroups: [
      {
        name: "AG1_Gestao_Energia",
        keywords: [
          { text: "gestão de energia empresarial", matchType: "Exact" },
          { text: "gestão energética empresa", matchType: "Exact" },
          { text: "gerenciamento de energia empresa", matchType: "Phrase" },
          { text: "otimização de energia empresa", matchType: "Phrase" },
          { text: "eficiência energética empresa", matchType: "Exact" },
          { text: "controle de gastos com energia", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Gestão de Energia Empresarial",
            "Otimize Seus Gastos c/ Energia",
            "Eficiência Energética Agora",
            "Análise Energética Grátis",
            "Controle Total de Energia",
            "Reduza Custos Operacionais",
            "Gestão Inteligente de Energia",
            "Para Empresas Exigentes",
            "Diagnóstico Grátis Agora",
            "Resultado Mensurável",
            "Sem Conflito de Interesse",
            "Ótima — Gestão de Energia",
            "Tecnologia e Expertise",
            "Do Diagnóstico à Execução",
            "Solicite Análise Hoje",
          ],
          descriptions: [
            "Analisamos sua operação energética e identificamos oportunidades de redução de custos.",
            "Gestão completa: diagnóstico, comparação de fornecedores, contratos e acompanhamento.",
            "A Ótima cuida de toda a gestão energética da sua empresa. Você foca no seu negócio.",
            "Diagnóstico gratuito. Processo completo do diagnóstico à implementação, sem burocracia.",
          ],
          path1: "gestao",
          path2: "energia",
        },
      },
      {
        name: "AG2_Consultoria_Energia",
        keywords: [
          { text: "consultoria de energia para empresas", matchType: "Exact" },
          { text: "consultoria energética empresarial", matchType: "Exact" },
          { text: "diagnóstico energético empresa", matchType: "Exact" },
          { text: "análise de conta de energia empresa", matchType: "Phrase" },
          { text: "especialista em energia empresarial", matchType: "Phrase" },
          { text: "assessoria energética empresa", matchType: "Exact" },
        ],
        rsa: {
          headlines: [
            "Consultoria de Energia Grátis",
            "Especialistas em Energia",
            "Diagnóstico Energético",
            "Análise Independente",
            "Sem Custo Para Empresa",
            "Engenheiros e Analistas",
            "Do Diagnóstico à Execução",
            "Assessoria Energética",
            "Sem Vínculo c/ Fornecedores",
            "Consultoria Neutra e Honesta",
            "Resultado Comprovado",
            "Para Empresas B2B",
            "Análise em 24 Horas",
            "Ótima — Consultores Experts",
            "Solicite Diagnóstico Agora",
          ],
          descriptions: [
            "Nossa equipe de engenheiros e analistas analisa sua conta e identifica oportunidades reais.",
            "Consultoria 100% gratuita para empresas. Somos remunerados pelos fornecedores parceiros.",
            "Análise neutra, sem conflito de interesse. Mostramos todas as opções disponíveis para você.",
            "Do diagnóstico à implementação: cuidamos de contratos, migração e acompanhamento contínuo.",
          ],
          path1: "consultoria",
          path2: "diagnostico",
        },
      },
      {
        name: "AG3_Reducao_Custos_Operacionais",
        keywords: [
          { text: "redução de custos operacionais empresa", matchType: "Phrase" },
          { text: "reduzir custos de energia empresa", matchType: "Phrase" },
          { text: "gestão de gastos com energia empresa", matchType: "Phrase" },
          { text: "como reduzir custo operacional empresa", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Reduza Custos Operacionais",
            "Energia é Custo Controlável",
            "Diagnóstico Grátis p/ Empresa",
            "Reduza Até 25% em Energia",
            "Análise de Custo Energético",
            "Sem Obra, Sem Instalação",
            "Resultado Rápido e Real",
            "Para Empresas Acima R$5 mil",
            "Comparação Independente",
            "Pago Pelos Fornecedores",
            "Ótima Energia — Economia",
            "Transparência Total",
            "Solicite Análise Agora",
            "Comece Hoje a Economizar",
            "Identifique Seu Desconto",
          ],
          descriptions: [
            "Energia é um dos maiores custos operacionais da empresa. Podemos ajudar a reduzir.",
            "Identificamos o melhor caminho — GDL, ACL ou otimização contratual — sem viés.",
            "Serviço gratuito para sua empresa. Diagnóstico completo, sem compromisso.",
            "Empresas com conta acima de R$5 mil/mês têm acesso a opções reais de desconto.",
          ],
          path1: "reducao",
          path2: "custos",
        },
      },
    ],
  },
  {
    name: "05_Condominios",
    theme: "Condomínios",
    campaignNegatives: [
      "solar residencial", "painel solar residencial", "segunda via",
      "boleto", "emprego", "vaga", "curso", "pdf", "template",
      "imposto condomínio", "taxa condomínio administradora",
    ],
    adGroups: [
      {
        name: "AG1_Condominio_Energia",
        keywords: [
          { text: "reduzir conta de luz condomínio", matchType: "Exact" },
          { text: "desconto energia condomínio", matchType: "Exact" },
          { text: "economia conta de luz condomínio", matchType: "Phrase" },
          { text: "como reduzir conta de luz condomínio", matchType: "Phrase" },
          { text: "conta de energia condomínio cara", matchType: "Phrase" },
          { text: "reduzir custo energia área comum", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Reduza Energia do Condomínio",
            "Desconto p/ Condomínio",
            "Área Comum Mais Barata",
            "Análise Grátis p/ Condomínio",
            "Sem Obra no Condomínio",
            "Sem Trocar Distribuidora",
            "Desconto Direto na Fatura",
            "Para Síndicos e Gestoras",
            "Resultado em 30 a 60 Dias",
            "Diagnóstico Energético Grátis",
            "Pago Pelos Fornecedores",
            "Condomínios em Todo Brasil",
            "Processo Simples e Rápido",
            "Solicite Diagnóstico Agora",
            "Ótima — Energia p/ Condo",
          ],
          descriptions: [
            "Analisamos a conta de energia das áreas comuns do condomínio e identificamos desconto real.",
            "Sem obra, sem placa solar, sem trocar de distribuidora. Desconto direto na fatura do condomínio.",
            "Serviço gratuito para condomínios. Somos remunerados pelos fornecedores parceiros.",
            "Atendemos condomínios residenciais e comerciais em todo o Brasil. Análise em 24 horas.",
          ],
          path1: "condominio",
          path2: "energia",
        },
      },
      {
        name: "AG2_Sindico_Gestor",
        keywords: [
          { text: "síndico conta de energia", matchType: "Exact" },
          { text: "gestora de condomínio energia", matchType: "Exact" },
          { text: "administradora condomínio energia", matchType: "Phrase" },
          { text: "reduzir custos condomínio energia", matchType: "Phrase" },
          { text: "síndico como reduzir conta de luz", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Para Síndicos e Gestoras",
            "Reduza Energia do Condo",
            "Gestão de Energia p/ Síndico",
            "Análise Grátis para Síndico",
            "Apresente Economia ao Condo",
            "Sem Custo Para o Condo",
            "Diagnóstico Independente",
            "Resultado Real e Mensurável",
            "Pago Pelos Fornecedores",
            "Processo Simples p/ Gestor",
            "Condomínios em Todo Brasil",
            "Desconto na Área Comum",
            "Do Diagnóstico à Economia",
            "Ótima — Parceiro do Síndico",
            "Solicite Análise Hoje",
          ],
          descriptions: [
            "Ajudamos síndicos e gestoras a reduzir o custo de energia das áreas comuns com análise grátis.",
            "Diagnóstico completo: verificamos elegibilidade, calculamos desconto e cuidamos do processo.",
            "O serviço é gratuito para o condomínio. Somos remunerados pelos fornecedores parceiros.",
            "Atendemos condomínios de todos os tamanhos. Envie a conta e veja o desconto possível.",
          ],
          path1: "sindico",
          path2: "condominio",
        },
      },
      {
        name: "AG3_Gestora_Multicondominio",
        keywords: [
          { text: "gestora de condomínios energia elétrica", matchType: "Phrase" },
          { text: "administradora de condomínios energia", matchType: "Phrase" },
          { text: "energia para múltiplos condomínios", matchType: "Phrase" },
          { text: "carteira de condomínios energia", matchType: "Exact" },
        ],
        rsa: {
          headlines: [
            "Gestoras de Condomínios",
            "Carteira de Condos — Economia",
            "Visão Consolidada de Energia",
            "Múltiplos Condomínios",
            "Análise para Toda Carteira",
            "Sem Custo para Gestora",
            "Desconto em Escala",
            "Parceiro de Gestão Energética",
            "Relatório por Condomínio",
            "Processo Centralizado",
            "Ótima — Gestor de Energia",
            "Para Carteiras Grandes",
            "Diagnóstico Multiativo",
            "Solicite Parceria Hoje",
            "Do Diagnóstico à Economia",
          ],
          descriptions: [
            "Para gestoras com carteira de condomínios: análise consolidada e gestão centralizada de energia.",
            "Identificamos desconto em todos os ativos da carteira. Relatórios individuais por condomínio.",
            "Parceria gratuita para gestoras. Somos remunerados pelos fornecedores quando geramos resultado.",
            "Atendemos gestoras de pequenas e grandes carteiras. Processo simples, resultado mensurável.",
          ],
          path1: "gestora",
          path2: "condominio",
        },
      },
    ],
  },
  {
    name: "06_Verticais_Industria_Comercio",
    theme: "Indústria e Comércio",
    campaignNegatives: [
      "segunda via", "boleto", "emprego", "vaga", "curso",
      "solar residencial", "imposto", "nota fiscal", "software",
      "residencial", "pessoa física",
    ],
    adGroups: [
      {
        name: "AG1_Industria_Energia",
        keywords: [
          { text: "energia para indústria", matchType: "Exact" },
          { text: "reduzir conta de luz indústria", matchType: "Exact" },
          { text: "custo energia industrial", matchType: "Exact" },
          { text: "gestão energia industrial", matchType: "Phrase" },
          { text: "conta de energia indústria cara", matchType: "Phrase" },
          { text: "energia barata para indústria", matchType: "Phrase" },
          { text: "redução de energia setor industrial", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Energia Mais Barata p/ Indústria",
            "Reduza Energia Industrial",
            "ACL para Indústria",
            "Análise Industrial Grátis",
            "Gestão de Energia Industrial",
            "Desconto na Conta Industrial",
            "Para Galpões e Indústrias",
            "Alta Demanda, Mais Desconto",
            "Diagnóstico Energético Grátis",
            "Sem Conflito de Interesse",
            "Especialistas em Indústria",
            "Processo Simples e Rápido",
            "Ótima — Energia Industrial",
            "Solicite Análise Agora",
            "Reduza Custo Operacional",
          ],
          descriptions: [
            "Indústrias e galpões com alta demanda têm maior potencial de economia no Mercado Livre.",
            "Analisamos seu perfil industrial: conexão, demanda, modalidade tarifária e melhores opções.",
            "Diagnóstico gratuito. Nossa equipe tem experiência em clientes industriais de grande porte.",
            "Do diagnóstico à migração: cuidamos de todo o processo para que você foque na produção.",
          ],
          path1: "industria",
          path2: "energia",
        },
      },
      {
        name: "AG2_Comercio_Varejo",
        keywords: [
          { text: "energia para comércio", matchType: "Exact" },
          { text: "reduzir conta de luz comércio", matchType: "Exact" },
          { text: "desconto energia estabelecimento comercial", matchType: "Phrase" },
          { text: "energia para supermercado", matchType: "Exact" },
          { text: "conta de luz supermercado", matchType: "Exact" },
          { text: "energia para varejo", matchType: "Exact" },
          { text: "reduzir energia comércio", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Energia Mais Barata p/ Comércio",
            "Desconto p/ Estabelecimento",
            "Para Supermercados e Varejo",
            "Análise Grátis p/ Comércio",
            "Reduza Energia Comercial",
            "Desconto na Conta Comercial",
            "Sem Obra Sem Instalação",
            "Sem Trocar Distribuidora",
            "Diagnóstico Grátis Hoje",
            "Para Lojistas e Redes",
            "Pago Pelos Fornecedores",
            "Resultado em 30 a 60 Dias",
            "Ótima — Energia p/ Comércio",
            "Solicite Análise Agora",
            "Compare Suas Opções",
          ],
          descriptions: [
            "Comércio, supermercados e varejo com conta acima de R$5 mil/mês podem ter desconto.",
            "Analisamos refrigeração, iluminação e carga instalada para encontrar o melhor desconto.",
            "Sem obra, sem instalação, sem trocar de distribuidora. Desconto direto na fatura.",
            "Diagnóstico gratuito. Somos remunerados pelos fornecedores quando geramos resultado real.",
          ],
          path1: "comercio",
          path2: "energia",
        },
      },
      {
        name: "AG3_Outros_Verticais",
        keywords: [
          { text: "energia para hospital", matchType: "Exact" },
          { text: "conta de luz hotel", matchType: "Exact" },
          { text: "energia para escola", matchType: "Exact" },
          { text: "reduzir conta de luz clínica", matchType: "Phrase" },
          { text: "energia para shopping", matchType: "Exact" },
          { text: "energia para universidade", matchType: "Exact" },
          { text: "conta de energia alta hospital", matchType: "Phrase" },
          { text: "reduzir energia hotelaria", matchType: "Phrase" },
        ],
        rsa: {
          headlines: [
            "Energia p/ Saúde, Hotel, Edu",
            "Hospitais e Clínicas",
            "Hotéis e Pousadas",
            "Escolas e Universidades",
            "Desconto p/ Setor de Saúde",
            "Conta Cara? Veja Opções",
            "Análise Setorial Grátis",
            "Diagnóstico Para Seu Setor",
            "Sem Obra Sem Instalação",
            "Pago Pelos Fornecedores",
            "Especialistas por Vertical",
            "Resultado Comprovado",
            "Ótima — Todos os Setores",
            "Compare Hoje",
            "Solicite Análise Agora",
          ],
          descriptions: [
            "Atendemos hospitais, clínicas, hotéis, escolas, shoppings e outros setores de alto consumo.",
            "Operação contínua ou sazonalidade previsível? Temos a solução certa para seu setor.",
            "Diagnóstico gratuito adaptado ao perfil de consumo do seu segmento.",
            "Sem obra, sem instalação, sem trocar de distribuidora. Desconto direto na fatura.",
          ],
          path1: "verticais",
          path2: "energia",
        },
      },
    ],
  },
];

// ─── Master Negative Keywords ─────────────────────────────────────────────────

const MASTER_NEGATIVES: string[] = [
  // Utility support / billing confusion
  "segunda via", "boleto", "segunda via conta", "agência", "número do cliente",
  "ouvidoria", "reclamação", "código de cliente", "falta de luz",
  "queda de energia", "religação", "medidor de energia", "troca de medidor",
  // Residential / consumer
  "residencial", "minha casa", "apartamento", "pessoa física",
  "casa própria", "minha residência", "energia residencial",
  // Jobs / careers
  "emprego", "vaga de emprego", "trabalho", "cargo", "salário",
  "trainee", "estágio", "concurso público", "curriculo",
  // Education
  "curso", "graduação", "faculdade", "universidade", "pós-graduação",
  "MBA", "certificação", "aula", "apostila", "matrícula",
  // Documents / templates
  "PDF", "modelo", "planilha", "template", "grátis download",
  "TCC", "monografia", "trabalho acadêmico", "pesquisa", "artigo científico",
  "tese", "dissertação", "relatório escolar",
  // Solar B2C
  "painel solar residencial", "placa solar casa", "energia solar residencial",
  "sistema fotovoltaico residencial", "inversor solar",
  // Marketplace Mercado Livre confusion
  "mercado livre compras", "mercado pago", "mercado livre app",
  "comprar no mercado livre", "vender no mercado livre",
  "mercado livre site", "anúncio mercado livre", "mercado livre loja",
  // Accounting / tax / HR / software / general business noise
  "contabilidade", "folha de pagamento", "imposto de renda",
  "nota fiscal", "ERP", "software de gestão", "CRM empresarial",
  "gestão de pessoas", "departamento pessoal", "receita federal",
  "CNPJ grátis", "abertura de empresa", "SIMPLES nacional",
  // Marketing / digital noise
  "marketing digital", "redes sociais", "vendas online",
  "e-commerce", "loja virtual", "tráfego pago",
];

// ─── Sitelinks / Callouts / Structured Snippets ───────────────────────────────

const SITELINKS = [
  { text: "Como Funciona", desc1: "Veja o passo a passo do diagnóstico", desc2: "Gratuito e sem compromisso", url: FINAL_URL },
  { text: "GD por Assinatura", desc1: "Sem instalar placa solar", desc2: "Desconto direto na fatura", url: FINAL_URL },
  { text: "Mercado Livre ACL", desc1: "Migre para o mercado livre", desc2: "Análise de elegibilidade grátis", url: FINAL_URL },
  { text: "Para Condomínios", desc1: "Redução na conta das áreas comuns", desc2: "Para síndicos e gestoras", url: FINAL_URL },
  { text: "Para Indústria", desc1: "Alto consumo, mais desconto", desc2: "Diagnóstico industrial grátis", url: FINAL_URL },
  { text: "Política de Privacidade", desc1: "Seus dados estão seguros", desc2: "Conformidade LGPD", url: "https://www.otimaenergia.com/privacidade" },
];

const CALLOUTS = [
  "Serviço 100% Gratuito",
  "Sem Trocar Distribuidora",
  "Sem Instalar Placa Solar",
  "Sem Obra na Empresa",
  "Análise Independente",
  "Pagamos os Fornecedores",
  "Atendemos Todo Brasil",
  "Diagnóstico em 24 Horas",
  "Transparência Total",
  "Resultado Comprovado",
];

const STRUCTURED_SNIPPETS = [
  { header: "Serviços", values: ["Diagnóstico Energético", "Consultoria ACL", "Geração Distribuída", "Gestão de Contratos", "Acompanhamento Contínuo"] },
  { header: "Segmentos", values: ["Comércio", "Indústria", "Condomínios", "Saúde", "Hotelaria", "Educação"] },
];

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function escapeCsvCell(cell: string): string {
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function rowsToCsv(rows: string[][]): string {
  return rows.map(r => r.map(escapeCsvCell).join(",")).join("\n");
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = "\uFEFF" + rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCampaignsCsv(bidStrategy: string): string[][] {
  const header = [
    "Campaign", "Campaign Status", "Campaign Type",
    "Budget", "Bid Strategy Type", "Networks",
    "Languages", "Locations",
  ];
  const rows = CAMPAIGNS.map(c => [
    c.name, STATUS, "Search",
    DAILY_BUDGET, bidStrategy, NETWORK,
    LANGUAGE, LOCATION,
  ]);
  return [header, ...rows];
}

function buildAdGroupsCsv(): string[][] {
  const header = ["Campaign", "Ad Group", "Ad Group Status", "Default Max. CPC"];
  const rows: string[][] = [];
  for (const camp of CAMPAIGNS) {
    for (const ag of camp.adGroups) {
      rows.push([camp.name, ag.name, "Enabled", "2.00"]);
    }
  }
  return [header, ...rows];
}

function buildKeywordsCsv(): string[][] {
  const header = ["Campaign", "Ad Group", "Keyword", "Match Type", "Keyword Status", "Max CPC", "Final URL"];
  const rows: string[][] = [];
  for (const camp of CAMPAIGNS) {
    for (const ag of camp.adGroups) {
      for (const kw of ag.keywords) {
        rows.push([camp.name, ag.name, kw.text, kw.matchType, "Enabled", "", FINAL_URL]);
      }
    }
  }
  return [header, ...rows];
}

function buildNegativeKeywordsCsv(): string[][] {
  const header = ["Campaign", "Ad Group", "Keyword", "Match Type", "Level"];
  const rows: string[][] = [];
  // Account-level master
  for (const kw of MASTER_NEGATIVES) {
    rows.push(["", "", kw, "Broad", "Account"]);
  }
  // Campaign-level
  for (const camp of CAMPAIGNS) {
    for (const kw of camp.campaignNegatives ?? []) {
      rows.push([camp.name, "", kw, "Broad", "Campaign"]);
    }
    // Ad group-level
    for (const ag of camp.adGroups) {
      for (const kw of ag.adGroupNegatives ?? []) {
        rows.push([camp.name, ag.name, kw, "Exact", "AdGroup"]);
      }
    }
  }
  return [header, ...rows];
}

function buildRsaCsv(): string[][] {
  const maxHeadlines = 15;
  const maxDescs = 4;
  const headlineHeaders = Array.from({ length: maxHeadlines }, (_, i) => `Headline ${i + 1}`);
  const descHeaders = Array.from({ length: maxDescs }, (_, i) => `Description ${i + 1}`);
  const header = [
    "Campaign", "Ad Group", "Ad Final URL",
    ...headlineHeaders, ...descHeaders,
    "Path 1", "Path 2", "Status",
  ];
  const rows: string[][] = [];
  for (const camp of CAMPAIGNS) {
    for (const ag of camp.adGroups) {
      const { headlines, descriptions, path1, path2 } = ag.rsa;
      const paddedHeadlines = [...headlines];
      while (paddedHeadlines.length < maxHeadlines) paddedHeadlines.push("");
      const paddedDescs = [...descriptions];
      while (paddedDescs.length < maxDescs) paddedDescs.push("");
      rows.push([
        camp.name, ag.name, FINAL_URL,
        ...paddedHeadlines.slice(0, maxHeadlines),
        ...paddedDescs.slice(0, maxDescs),
        path1, path2, "Enabled",
      ]);
    }
  }
  return [header, ...rows];
}

function buildAssetsCsv(): string[][] {
  const header = [
    "Campaign", "Asset Type", "Asset Text",
    "Description 1", "Description 2", "Final URL",
    "Snippet Header", "Snippet Values",
  ];
  const rows: string[][] = [];
  // Sitelinks (account-level — no campaign)
  for (const sl of SITELINKS) {
    rows.push(["", "Sitelink", sl.text, sl.desc1, sl.desc2, sl.url, "", ""]);
  }
  // Callouts (account-level)
  for (const co of CALLOUTS) {
    rows.push(["", "Callout", co, "", "", "", "", ""]);
  }
  // Structured Snippets (account-level)
  for (const ss of STRUCTURED_SNIPPETS) {
    rows.push(["", "Structured Snippet", "", "", "", "", ss.header, ss.values.join("; ")]);
  }
  return [header, ...rows];
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function totalAdGroups() {
  return CAMPAIGNS.reduce((s, c) => s + c.adGroups.length, 0);
}
function totalKeywords() {
  return CAMPAIGNS.reduce((s, c) => c.adGroups.reduce((ss, ag) => ss + ag.keywords.length, 0) + s, 0);
}
function totalNegatives() {
  let n = MASTER_NEGATIVES.length;
  for (const c of CAMPAIGNS) {
    n += (c.campaignNegatives?.length ?? 0);
    for (const ag of c.adGroups) n += (ag.adGroupNegatives?.length ?? 0);
  }
  return n;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoogleAdsLaunchPack() {
  const { user } = useAuth();
  const [bidStrategy, setBidStrategy] = useState<"Maximize Clicks" | "Maximize Conversions">("Maximize Clicks");
  const [openCamps, setOpenCamps] = useState<Record<string, boolean>>({});

  if (!user || !["admin", "ops"].includes(user.role)) {
    return <Redirect to="/admin" />;
  }

  function toggle(name: string) {
    setOpenCamps(p => ({ ...p, [name]: !p[name] }));
  }

  const files = [
    {
      label: "Campaigns.csv",
      icon: <Target className="h-4 w-4" />,
      desc: "6 campaigns — Paused",
      fn: () => downloadCsv(buildCampaignsCsv(bidStrategy), "Campaigns.csv"),
    },
    {
      label: "AdGroups.csv",
      icon: <Hash className="h-4 w-4" />,
      desc: `${totalAdGroups()} ad groups`,
      fn: () => downloadCsv(buildAdGroupsCsv(), "AdGroups.csv"),
    },
    {
      label: "Keywords.csv",
      icon: <FileText className="h-4 w-4" />,
      desc: `${totalKeywords()} exact + phrase keywords`,
      fn: () => downloadCsv(buildKeywordsCsv(), "Keywords.csv"),
    },
    {
      label: "NegativeKeywords.csv",
      icon: <MinusCircle className="h-4 w-4" />,
      desc: `${totalNegatives()} negatives (account + campaign)`,
      fn: () => downloadCsv(buildNegativeKeywordsCsv(), "NegativeKeywords.csv"),
    },
    {
      label: "ResponsiveSearchAds.csv",
      icon: <Megaphone className="h-4 w-4" />,
      desc: `${totalAdGroups()} RSAs — 15 headlines, 4 descriptions each`,
      fn: () => downloadCsv(buildRsaCsv(), "ResponsiveSearchAds.csv"),
    },
    {
      label: "Assets.csv",
      icon: <Puzzle className="h-4 w-4" />,
      desc: `${SITELINKS.length} sitelinks, ${CALLOUTS.length} callouts, ${STRUCTURED_SNIPPETS.length} snippets`,
      fn: () => downloadCsv(buildAssetsCsv(), "Assets.csv"),
    },
  ];

  function downloadAll() {
    files.forEach(f => setTimeout(f.fn, 100));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Google Ads Launch Pack</h1>
            <p className="text-xs text-slate-500">Offline mode — generate Google Ads Editor CSVs for manual upload</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
            API Pending Approval
          </Badge>
          <Button onClick={downloadAll} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4" /> Download All CSVs
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Bidding strategy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Bidding Strategy</CardTitle>
            <CardDescription className="text-xs">Applied to all campaigns in the exported Campaigns.csv</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["Maximize Clicks", "Maximize Conversions"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setBidStrategy(s)}
                  data-testid={`bid-strategy-${s.replace(/ /g, "-").toLowerCase()}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    bidStrategy === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Conversion goal: <span className="font-mono text-slate-600">lead_form_submit</span> · Final URL: <span className="font-mono text-slate-600">{FINAL_URL}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Campaigns", value: CAMPAIGNS.length, color: "text-blue-600" },
            { label: "Ad Groups", value: totalAdGroups(), color: "text-indigo-600" },
            { label: "Keywords", value: totalKeywords(), color: "text-emerald-600" },
            { label: "Negatives", value: totalNegatives(), color: "text-red-600" },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Download files */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Export Files</CardTitle>
            <CardDescription className="text-xs">
              Import each CSV into Google Ads Editor · All campaigns set to <span className="font-semibold text-red-600">Paused</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {files.map(f => (
              <div key={f.label} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{f.label}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={f.fn}
                  data-testid={`download-${f.label.replace(".csv", "").toLowerCase()}`}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaign preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">Campaign Structure Preview</CardTitle>
            <CardDescription className="text-xs">Expand each campaign to review keywords and RSAs before export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {CAMPAIGNS.map(camp => (
              <Collapsible key={camp.name} open={!!openCamps[camp.name]}>
                <CollapsibleTrigger asChild>
                  <button
                    onClick={() => toggle(camp.name)}
                    data-testid={`campaign-toggle-${camp.name}`}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{camp.name}</p>
                        <p className="text-xs text-slate-400">{camp.theme} · {camp.adGroups.length} ad groups · {camp.adGroups.reduce((s, ag) => s + ag.keywords.length, 0)} keywords</p>
                      </div>
                    </div>
                    {openCamps[camp.name] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 ml-4 space-y-3 pb-2">
                    {camp.campaignNegatives && camp.campaignNegatives.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                          <MinusCircle className="h-3.5 w-3.5" /> Campaign-Level Negatives
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {camp.campaignNegatives.map(kw => (
                            <span key={kw} className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-mono">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {camp.adGroups.map(ag => (
                      <div key={ag.name} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-indigo-500" /> {ag.name}
                        </p>
                        {/* Keywords */}
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {ag.keywords.map(kw => (
                              <span key={kw.text} className={`text-xs px-2 py-0.5 rounded font-mono ${kw.matchType === "Exact" ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"}`}>
                                {kw.matchType === "Exact" ? `[${kw.text}]` : `"${kw.text}"`}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* RSA headlines */}
                        <div>
                          <p className="text-xs text-slate-500 mb-1">RSA Headlines ({ag.rsa.headlines.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {ag.rsa.headlines.map((h, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded ${h.length > 30 ? "bg-red-100 text-red-700 border border-red-300" : "bg-emerald-50 text-emerald-700"}`}>
                                {h.length > 30 && <span className="font-bold">⚠ </span>}{h}
                                <span className="text-slate-400 ml-1">({h.length})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* RSA descriptions */}
                        <div>
                          <p className="text-xs text-slate-500 mb-1">RSA Descriptions ({ag.rsa.descriptions.length})</p>
                          <div className="space-y-1">
                            {ag.rsa.descriptions.map((d, i) => (
                              <p key={i} className={`text-xs p-2 rounded ${d.length > 90 ? "bg-red-50 text-red-700 border border-red-200" : "bg-white text-slate-600 border border-slate-100"}`}>
                                {d.length > 90 && <span className="font-bold text-red-600">⚠ OVER 90 chars ({d.length}): </span>}{d}
                              </p>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">
                          Paths: <span className="font-mono text-slate-600">{ag.rsa.path1}</span> / <span className="font-mono text-slate-600">{ag.rsa.path2}</span> · URL: <span className="font-mono text-slate-600">{FINAL_URL}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Master negatives preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MinusCircle className="h-4 w-4 text-red-500" />
              Master Negative List — MASTER_NEG_OTIMA
            </CardTitle>
            <CardDescription className="text-xs">
              {MASTER_NEGATIVES.length} account-level negatives applied to all campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {MASTER_NEGATIVES.map(kw => (
                <span key={kw} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded font-mono">{kw}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assets preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-purple-500" /> Assets Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Sitelinks ({SITELINKS.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SITELINKS.map((sl, i) => (
                  <div key={i} className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <p className="font-semibold text-blue-700">{sl.text}</p>
                    <p className="text-slate-500">{sl.desc1}</p>
                    <p className="text-slate-400">{sl.desc2}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Callouts ({CALLOUTS.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {CALLOUTS.map(co => (
                  <span key={co} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded">{co}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Structured Snippets</p>
              {STRUCTURED_SNIPPETS.map((ss, i) => (
                <div key={i} className="text-xs text-slate-600">
                  <span className="font-semibold">{ss.header}: </span>
                  {ss.values.join(" · ")}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">
              <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
              Google Ads Editor Import Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-xs text-blue-700 space-y-1.5 list-decimal ml-4">
              <li>Open Google Ads Editor and select the account</li>
              <li>Go to <strong>File → Import → Import CSV</strong></li>
              <li>Import in this order: <strong>Campaigns → AdGroups → Keywords → NegativeKeywords → ResponsiveSearchAds → Assets</strong></li>
              <li>Review the import preview — check for yellow warnings on character limits</li>
              <li>All campaigns are set to <strong>Paused</strong> — review and enable individually before posting</li>
              <li>After import, post changes to Google Ads</li>
              <li>Once API developer token is approved, switch to the PPC Manager for automated workflows</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
