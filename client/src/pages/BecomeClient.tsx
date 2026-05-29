import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, CheckCircle, Clock, TrendingDown } from "lucide-react";
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
      name: "", email: "", company: "", phone: "", cnpj: "", ucCode: "", averageBill: "", message: "",
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
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitLead.mutate(values);
  }

  const inputClass = "h-12 border-white/10 focus:border-[#9e3ffd] focus:ring-0 text-white placeholder:text-white/30";
  const inputStyle = { background: "rgba(255,255,255,0.06)" };

  return (
    <div className="min-h-screen" style={{ background: "#09081e" }}>
      <Navbar />
      
      <section className="bg-[#13112a] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-medium text-[#9e3ffd] uppercase tracking-wider mb-4">
                Sua energia. Sua escolha. Sua economia.
              </p>
              <h1 className="text-[2.5rem] lg:text-[3.5rem] leading-[1.1] font-normal tracking-tight text-[#9e3ffd] mb-6">
                Simule sua economia com um diagnóstico técnico gratuito
              </h1>
              <p className="text-lg lg:text-xl text-white/70 leading-relaxed">
                Uma análise clara, sem compromisso, para entender se, e quando, faz sentido migrar.
              </p>
              <p className="text-base text-white/50 mt-4">
                Economia potencial de até 30%. Sem obrigação de contratar.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { Icon: TrendingDown, num: "30%", label: "Economia de até" },
                { Icon: Clock, num: "IA", label: "Impulsionado" },
                { Icon: CheckCircle, num: "R$0", label: "Custo para você" },
              ].map(({ Icon, num, label }, i) => (
                <div key={i} className="rounded-lg p-6 text-center border border-white/10" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Icon className="w-8 h-8 text-[#9e3ffd] mx-auto mb-3" />
                  <p className="text-2xl font-light text-[#9e3ffd]">{num}</p>
                  <p className="text-sm text-white/50">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#09081e] py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <h2 className="text-2xl lg:text-3xl font-normal tracking-tight text-white mb-8">
                Como funciona o diagnóstico
              </h2>
              
              <div className="space-y-8">
                {[
                  { n: "1", title: "Envie sua conta", body: "Informações básicas já permitem iniciar a análise." },
                  { n: "2", title: "Diagnóstico técnico", body: "Análise de perfil, elegibilidade e cenários." },
                  { n: "3", title: "Comparação estruturada", body: "Diferenças explicadas, não escondidas." },
                  { n: "4", title: "Recomendação formal", body: "Você decide com clareza, sem pressão." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="w-10 h-10 bg-[#9e3ffd] text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                      {step.n}
                    </div>
                    <div>
                      <h3 className="font-medium text-white mb-2">{step.title}</h3>
                      <p className="text-white/60">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-lg border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                <h3 className="font-medium text-white mb-2">Elegibilidade</h3>
                <p className="text-white/60 text-sm">
                  Para migrar ao mercado livre, sua empresa precisa ter conta de luz acima de R$8.000/mês ou demanda contratada de 500kW+. Não sabe se é elegível? <a href="/faq" className="text-[#9e3ffd] hover:underline">Consulte nosso FAQ</a> ou envie seus dados que verificamos para você.
                </p>
              </div>
            </div>

            <div className="rounded-lg p-8 lg:p-10 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
              <h2 className="text-2xl font-medium text-white mb-6">
                Solicite seu diagnóstico
              </h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" data-testid="input-name" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+55 21 99999-9999" data-testid="input-phone" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/70">E-mail Corporativo *</FormLabel>
                      <FormControl>
                        <Input placeholder="voce@empresa.com.br" data-testid="input-email" className={inputClass} style={inputStyle} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="company" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" data-testid="input-company" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cnpj" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" data-testid="input-cnpj" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="ucCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">Código UC (se souber)</FormLabel>
                        <FormControl>
                          <Input placeholder="Código da Unidade Consumidora" data-testid="input-uc" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="averageBill" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-white/70">Valor médio da conta</FormLabel>
                        <FormControl>
                          <Input placeholder="R$ 10.000/mês" data-testid="input-bill" className={inputClass} style={inputStyle} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-white/70">Informações adicionais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte-nos mais sobre sua empresa e consumo de energia..."
                          className="resize-none min-h-[100px] border-white/10 focus:border-[#9e3ffd] focus:ring-0 text-white placeholder:text-white/30"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                          data-testid="input-message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-3 bg-[#9e3ffd] hover:bg-[#df0af2] text-white px-8 py-4 text-lg font-medium transition-colors"
                    disabled={submitLead.isPending}
                    data-testid="button-submit-diagnosis"
                  >
                    {submitLead.isPending ? "Enviando..." : "Solicitar Diagnóstico Gratuito"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-white/40 mt-3 text-center">
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
