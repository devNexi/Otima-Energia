import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { ArrowRight, Check, Users, Repeat, DollarSign, Building2, GraduationCap, Heart, ShoppingCart, Factory, HardHat, Briefcase, Calculator, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

interface PartnerFormData {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  profession?: string;
  referralSource: string;
  termsAccepted: boolean;
}

const SHOW_ACTIVATION_BONUS = true;

export default function RedeLucros() {
  const [submitted, setSubmitted] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PartnerFormData>();
  
  const registerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          cpfCnpj: data.cpfCnpj,
          profession: data.profession || null,
          referralSource: data.referralSource,
          termsAcceptedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao processar cadastro");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const onSubmit = (data: PartnerFormData) => {
    registerMutation.mutate(data);
  };

  const howItWorks = [
    {
      step: "1",
      title: "Você indica um cliente interessado",
      description: "Você só pode indicar empresas, instituições ou pessoas que autorizaram explicitamente o contato da Ótima Energia. Nada de listas frias, contatos aleatórios ou spam.",
    },
    {
      step: "2",
      title: "A Ótima negocia e fecha o contrato",
      description: "Nosso time cuida de toda a análise, negociação e contratação no Mercado Livre de Energia.",
    },
    {
      step: "3",
      title: "Você recebe comissões recorrentes",
      description: "20% da comissão líquida da Ótima em cada contrato indicado. 5% adicional sobre comissões geradas por parceiros que você indicar para a rede. Sempre que houver renovação, você volta a receber.",
    },
  ];

  const idealClients = [
    { icon: GraduationCap, label: "Escolas e universidades" },
    { icon: Building2, label: "Condomínios residenciais e comerciais" },
    { icon: Heart, label: "Hospitais e clínicas" },
    { icon: ShoppingCart, label: "Shoppings e supermercados" },
    { icon: Factory, label: "Fábricas e galpões industriais" },
    { icon: HardHat, label: "Grandes obras e construtoras" },
  ];

  const whoIsItFor = [
    { icon: Calculator, label: "Contadores, engenheiros, corretores e consultores" },
    { icon: Briefcase, label: "Prestadores de serviço e empresários" },
    { icon: Users, label: "Profissionais com bom networking empresarial" },
    { icon: Wrench, label: "Pessoas que valorizam ética, clareza e relações de longo prazo" },
  ];

  const whatPartnerReceives = [
    "Painel exclusivo de parceiro",
    "Link único de indicação",
    "Kit de boas-vindas com modelos de mensagem",
    "Acompanhamento das indicações",
    "Suporte da equipe Ótima",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
              Transforme suas conexões em renda passiva vitalícia.
            </h1>
            <p className="text-xl lg:text-2xl text-[#736d77] leading-relaxed mb-6">
              Indique clientes para a Ótima e ganhe comissões mensais — enquanto os contratos estiverem ativos.
            </p>
            <p className="text-lg text-[#16163f] font-medium mb-2">
              Programa de Parcerias Ótima: simples, transparente e escalável.
            </p>
            <p className="text-[#736d77]">
              Sem custo. Sem vender. Apenas indique — sempre com consentimento do cliente.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-12 text-center">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#9e3ffd] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#16163f] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#736d77] text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#736d77] text-center mt-8 italic">
            As comissões são pagas enquanto os contratos estiverem ativos e conforme os termos do programa.
          </p>
        </div>
      </section>

      {/* Illustrative Example */}
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="dcvc-section-title mb-8 text-center">
              Exemplo ilustrativo de ganhos
            </h2>
            <div className="bg-white rounded-lg p-8 lg:p-10">
              <p className="text-lg text-[#16163f] mb-6">
                Você indica um cliente que gera uma comissão de R$10.000 para a Ótima.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Você recebe R$2.000 conforme o recebimento da Ótima</span>
                </li>
                <li className="flex items-start gap-3">
                  <Repeat className="w-5 h-5 text-[#9e3ffd] flex-shrink-0 mt-0.5" />
                  <span className="text-[#736d77]">Em renovações, você volta a receber proporcionalmente</span>
                </li>
              </ul>
              <p className="text-sm text-[#736d77] italic">
                Valores meramente ilustrativos. Resultados dependem do perfil do cliente, consumo, contrato e permanência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Payments Work */}
      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="dcvc-section-title mb-8">
              Você ganha quando e como a Ótima ganha
            </h2>
            <ul className="space-y-4 text-left">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#9e3ffd] flex-shrink-0" />
                <span className="text-[#736d77]">Pagamento à vista → repasse proporcional à vista</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#9e3ffd] flex-shrink-0" />
                <span className="text-[#736d77]">Pagamento mensal → repasse mensal</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#9e3ffd] flex-shrink-0" />
                <span className="text-[#736d77]">Total transparência via painel do parceiro</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Ideal Client Profile */}
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-4 text-center">
            Perfil ideal de clientes
          </h2>
          <p className="text-center text-[#736d77] mb-12">
            Indicações com maior consumo geram maior impacto e melhores comissões.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {idealClients.map((client, index) => {
              const Icon = client.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#9e3ffd]" />
                  </div>
                  <span className="text-[#736d77] text-sm">{client.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-[#736d77] text-center mt-8 italic">
            Pequenos comércios geralmente apresentam consumo insuficiente para gerar impacto relevante.
          </p>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-12 text-center">
            Para quem é
          </h2>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
            {whoIsItFor.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#eee7f1] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[#9e3ffd]" />
                  </div>
                  <span className="text-[#736d77]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Partner Receives */}
      <section className="bg-[#eee7f1] py-16 lg:py-20 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="dcvc-section-title mb-12 text-center">
            O que o parceiro recebe
          </h2>
          <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
              {whatPartnerReceives.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#9e3ffd] flex-shrink-0" />
                  <span className="text-[#736d77]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Activation Bonus - Feature Flag */}
      {SHOW_ACTIVATION_BONUS && (
        <section className="bg-white py-16 lg:py-20 border-t border-gray-200">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center bg-gradient-to-r from-[#9e3ffd]/10 to-[#df0af2]/10 rounded-lg p-8">
              <h2 className="text-xl font-semibold text-[#16163f] mb-4">
                Bônus de ativação
              </h2>
              <p className="text-[#736d77]">
                Parceiros aprovados podem receber um bônus promocional no primeiro contrato indicado, conforme regras vigentes no momento da adesão.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Registration Form */}
      <section id="cadastro" className="bg-[#16163f] py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-xl mx-auto">
            {!submitted ? (
              <>
                <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-4 text-center">
                  Comece a transformar conexões qualificadas em renda recorrente
                </h2>
                <p className="text-gray-300 text-center mb-8">
                  Preencha o formulário abaixo para se cadastrar como parceiro.
                </p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-white text-sm mb-2">Nome completo *</label>
                    <input
                      type="text"
                      {...register("fullName", { required: "Nome é obrigatório" })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      placeholder="Seu nome completo"
                      data-testid="input-fullname"
                    />
                    {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Email *</label>
                    <input
                      type="email"
                      {...register("email", { 
                        required: "Email é obrigatório",
                        pattern: { value: /^\S+@\S+$/i, message: "Email inválido" }
                      })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      placeholder="seu@email.com"
                      data-testid="input-email"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Celular com WhatsApp *</label>
                    <input
                      type="tel"
                      {...register("phone", { required: "Telefone é obrigatório" })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      placeholder="(21) 99999-9999"
                      data-testid="input-phone"
                    />
                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">CPF ou CNPJ *</label>
                    <input
                      type="text"
                      {...register("cpfCnpj", { required: "CPF ou CNPJ é obrigatório" })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      data-testid="input-cpfcnpj"
                    />
                    {errors.cpfCnpj && <p className="text-red-400 text-sm mt-1">{errors.cpfCnpj.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Profissão ou ramo de atuação</label>
                    <input
                      type="text"
                      {...register("profession")}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      placeholder="Ex: Contador, Engenheiro, Consultor"
                      data-testid="input-profession"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm mb-2">Como conheceu a Ótima? *</label>
                    <select
                      {...register("referralSource", { required: "Selecione uma opção" })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#9e3ffd]"
                      data-testid="select-referral-source"
                    >
                      <option value="" className="text-gray-900">Selecione...</option>
                      <option value="google" className="text-gray-900">Google</option>
                      <option value="indicacao" className="text-gray-900">Indicação</option>
                      <option value="instagram" className="text-gray-900">Instagram</option>
                      <option value="outro" className="text-gray-900">Outro</option>
                    </select>
                    {errors.referralSource && <p className="text-red-400 text-sm mt-1">{errors.referralSource.message}</p>}
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      {...register("termsAccepted", { required: "Você deve aceitar os termos" })}
                      className="mt-1 w-5 h-5 text-[#9e3ffd] rounded focus:ring-[#9e3ffd]"
                      data-testid="checkbox-terms"
                    />
                    <label className="text-gray-300 text-sm">
                      Li e aceito os{" "}
                      <Link href="/termos-parcerias" className="text-[#9e3ffd] hover:underline">
                        termos do Programa de Parcerias da Ótima
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.termsAccepted && <p className="text-red-400 text-sm">{errors.termsAccepted.message}</p>}
                  
                  {registerMutation.error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                      <p className="text-red-400 text-sm">{registerMutation.error.message}</p>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full flex items-center justify-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors disabled:opacity-50"
                    data-testid="button-submit-partner"
                  >
                    {registerMutation.isPending ? "Processando..." : "Quero me cadastrar e começar"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-normal text-white mb-4">
                  Cadastro recebido com sucesso.
                </h2>
                <p className="text-gray-300 mb-6">
                  Em até 24h úteis você receberá:
                </p>
                <ul className="text-gray-300 space-y-2 mb-8">
                  <li>• Seu link exclusivo de indicação</li>
                  <li>• Kit de boas-vindas</li>
                  <li>• Acesso ao painel de parceiro</li>
                </ul>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 text-[#9e3ffd] hover:text-[#df0af2] transition-colors"
                >
                  Voltar para a página inicial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <section className="bg-[#16163f] py-8 border-t border-gray-700">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <p className="text-sm text-gray-400 text-center max-w-3xl mx-auto">
            Indicações sem consentimento do cliente ou fora do perfil mínimo de consumo poderão ser desconsideradas. A participação no programa está sujeita à aprovação e aos termos vigentes.
          </p>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
