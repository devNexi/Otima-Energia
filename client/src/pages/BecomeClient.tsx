import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { ArrowRight, Upload, CheckCircle, Clock, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  company: z.string().min(2, "Nome da empresa é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  cnpj: z.string().optional(),
  ucCode: z.string().optional(),
  averageBill: z.string().optional(),
  message: z.string().optional(),
});

export default function BecomeClient() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      cnpj: "",
      ucCode: "",
      averageBill: "",
      message: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const additionalInfo = [
        data.cnpj ? `CNPJ: ${data.cnpj}` : null,
        data.ucCode ? `Código UC: ${data.ucCode}` : null,
        data.averageBill ? `Valor médio da conta: ${data.averageBill}` : null,
        data.message ? `Mensagem: ${data.message}` : null,
      ].filter(Boolean).join('\n');

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          companyName: data.company,
          message: additionalInfo || null,
          source: "seja-cliente",
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao enviar");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Um de nossos especialistas entrará em contato em até 24 horas.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitLead.mutate(values);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#eee7f1] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-medium text-[#9e3ffd] uppercase tracking-wider mb-4">
                Sua energia. Sua escolha. Sua economia.
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
                Simule sua economia com um diagnóstico técnico gratuito
              </h1>
              <p className="text-lg lg:text-xl text-[#736d77] leading-relaxed">
                Uma análise clara, sem compromisso, para entender se, e quando, faz sentido migrar.
              </p>
              <p className="text-base text-[#736d77] mt-4">
                Economia potencial de até 40%. Sem obrigação de contratar.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-6 text-center">
                <TrendingDown className="w-8 h-8 text-[#9e3ffd] mx-auto mb-3" />
                <p className="text-2xl font-light text-[#9e3ffd]">40%</p>
                <p className="text-sm text-[#736d77]">Economia de até</p>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <Clock className="w-8 h-8 text-[#9e3ffd] mx-auto mb-3" />
                <p className="text-2xl font-light text-[#9e3ffd]">IA</p>
                <p className="text-sm text-[#736d77]">Impulsionado</p>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <CheckCircle className="w-8 h-8 text-[#9e3ffd] mx-auto mb-3" />
                <p className="text-2xl font-light text-[#9e3ffd]">R$0</p>
                <p className="text-sm text-[#736d77]">Custo para você</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left Column - Benefits */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#16163f] mb-8">
                Como funciona o diagnóstico
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-[#16163f] mb-2">Envie sua conta</h3>
                    <p className="text-[#736d77]">Informações básicas já permitem iniciar a análise.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-[#16163f] mb-2">Diagnóstico técnico</h3>
                    <p className="text-[#736d77]">Análise de perfil, elegibilidade e cenários.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-[#16163f] mb-2">Comparação estruturada</h3>
                    <p className="text-[#736d77]">Diferenças explicadas, não escondidas.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-[#16163f] mb-2">Recomendação formal</h3>
                    <p className="text-[#736d77]">Você decide com clareza, sem pressão.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-[#eee7f1] rounded-lg">
                <h3 className="font-medium text-[#16163f] mb-2">Elegibilidade</h3>
                <p className="text-[#736d77] text-sm">
                  Para migrar ao mercado livre, sua empresa precisa ter conta de luz acima de R$8.000/mês ou demanda contratada de 500kW+. Não sabe se é elegível? <a href="/faq" className="text-[#9e3ffd] hover:underline">Consulte nosso FAQ</a> ou envie seus dados que verificamos para você.
                </p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="bg-[#eee7f1] rounded-lg p-8 lg:p-10">
              <h2 className="text-2xl font-medium text-[#16163f] mb-6">
                Solicite seu diagnóstico
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">Nome Completo *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Seu nome" 
                              data-testid="input-name" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">Telefone *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+55 21 99999-9999" 
                              data-testid="input-phone" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-[#16163f]">E-mail Corporativo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="voce@empresa.com.br" 
                            data-testid="input-email" 
                            className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">Empresa *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome da empresa" 
                              data-testid="input-company" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">CNPJ</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00" 
                              data-testid="input-cnpj" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="ucCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">Código UC (se souber)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Código da Unidade Consumidora" 
                              data-testid="input-uc" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="averageBill"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-[#16163f]">Valor médio da conta</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="R$ 10.000/mês" 
                              data-testid="input-bill" 
                              className="h-12 border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-[#16163f]">Informações adicionais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Conte-nos mais sobre sua empresa e consumo de energia..." 
                            className="resize-none min-h-[100px] border-gray-300 focus:border-[#9e3ffd] focus:ring-0 bg-white"
                            data-testid="input-message"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                    disabled={submitLead.isPending}
                    data-testid="button-submit-diagnosis"
                  >
                    {submitLead.isPending ? "Enviando..." : "Solicitar Diagnóstico Gratuito"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-[#736d77] mt-3 text-center">
                    Ao enviar, você confirma que é decisor(a) ou está autorizado(a) pela empresa a solicitar análises, cotações e avançar no processo.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
