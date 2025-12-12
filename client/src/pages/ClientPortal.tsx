import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { ArrowRight, BarChart2, FileText, TrendingDown, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function ClientPortal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Portal login would be handled here
    alert("Portal em desenvolvimento. Entre em contato conosco para mais informações.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#16163f] pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-white mb-6">
                Portal do Cliente
              </h1>
              <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                Acesse sua área exclusiva para enviar contas de energia e acompanhar sua jornada conosco. Nosso serviço de comparação é gratuito e focado em ajudar sua empresa a economizar com total transparência.
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-lg p-8 lg:p-10">
              <h2 className="text-2xl font-medium text-[#16163f] mb-6">
                Acessar o sistema
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-[#16163f] mb-2">E-mail</label>
                  <Input 
                    type="email"
                    placeholder="seu@email.com.br" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0"
                    data-testid="input-portal-email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#16163f] mb-2">Senha</label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0"
                    data-testid="input-portal-password"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[#9e3ffd] focus:ring-[#9e3ffd]" />
                    <span className="text-[#736d77]">Lembrar-me</span>
                  </label>
                  <a href="#" className="text-[#9e3ffd] hover:text-[#df0af2]">
                    Esqueci a senha
                  </a>
                </div>

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                  data-testid="button-portal-login"
                >
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <p className="text-center text-sm text-[#736d77] mt-6">
                Ainda não é cliente?{" "}
                <Link href="/seja-cliente" className="text-[#9e3ffd] hover:text-[#df0af2]">
                  Solicite seu diagnóstico gratuito
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-16 text-center">
            O que você encontra no Portal
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#eee7f1] rounded-lg flex items-center justify-center mx-auto mb-6">
                <TrendingDown className="w-8 h-8 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-3">
                Economia em Tempo Real
              </h3>
              <p className="text-[#736d77]">
                Acompanhe quanto você está economizando mês a mês comparado ao mercado cativo.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#eee7f1] rounded-lg flex items-center justify-center mx-auto mb-6">
                <BarChart2 className="w-8 h-8 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-3">
                Histórico de Consumo
              </h3>
              <p className="text-[#736d77]">
                Visualize seu perfil de consumo com gráficos detalhados e comparativos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#eee7f1] rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-3">
                Documentos e Contratos
              </h3>
              <p className="text-[#736d77]">
                Acesse faturas, contratos e certificados de energia renovável.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#eee7f1] rounded-lg flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-[#9e3ffd]" />
              </div>
              <h3 className="text-xl font-medium text-[#16163f] mb-3">
                Alertas e Notificações
              </h3>
              <p className="text-[#736d77]">
                Receba avisos sobre vencimentos, oportunidades e novidades do mercado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#eee7f1] py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-normal tracking-tight text-[#16163f] mb-6">
            Ainda não é cliente?
          </h2>
          <p className="text-xl text-[#736d77] mb-12 max-w-2xl mx-auto">
            Faça um diagnóstico gratuito e descubra quanto sua empresa pode economizar no mercado livre de energia.
          </p>
          <Link 
            href="/seja-cliente"
            className="inline-flex items-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
          >
            Solicitar Diagnóstico Gratuito
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
