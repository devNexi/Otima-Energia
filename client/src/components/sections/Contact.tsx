import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
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
  message: z.string().optional(),
});

export function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const submitLead = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        description: "Um de nossos especialistas entrará em contato em breve.",
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
    <section id="contact" className="bg-[#eee7f1] pt-20 pb-12 lg:pt-24 lg:pb-16 border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Column - Info */}
          <div>
            <h2 className="dcvc-section-title mb-6">Contato</h2>
            <p className="dcvc-statement text-gray-900 mb-12">
              Pronto para{" "}
              <span className="text-highlight">começar a economizar</span>?
            </p>
            
            <div className="space-y-6 text-[#736d77]">
              <div>
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-1">E-mail</p>
                <p className="text-lg">contato@otimaenergia.com</p>
              </div>
              <div>
                <p className="text-sm tracking-wide text-gray-500 uppercase mb-1">Localização</p>
                <p className="text-lg">Rio de Janeiro, Brasil</p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                          Nome Completo
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu nome" 
                            data-testid="input-name" 
                            className="h-12 border-gray-200 rounded-none focus:border-[#9e3ffd] focus:ring-0 bg-white"
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
                        <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+55 21 99999-9999" 
                            data-testid="input-phone" 
                            className="h-12 border-gray-200 rounded-none focus:border-[#9e3ffd] focus:ring-0 bg-white"
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
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="voce@empresa.com.br" 
                          data-testid="input-email" 
                          className="h-12 border-gray-200 rounded-none focus:border-[#9e3ffd] focus:ring-0 bg-white"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        Empresa
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome da empresa" 
                          data-testid="input-company" 
                          className="h-12 border-gray-200 rounded-none focus:border-[#9e3ffd] focus:ring-0 bg-white"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm tracking-wide text-gray-500 uppercase">
                        Mensagem (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Conte-nos sobre seu consumo de energia..." 
                          className="resize-none min-h-[120px] border-gray-200 rounded-none focus:border-[#9e3ffd] focus:ring-0 bg-white"
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
                  className="dcvc-arrow-btn group"
                  disabled={submitLead.isPending}
                  data-testid="button-submit-lead"
                >
                  <span className="arrow">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="text-[#16163f] group-hover:text-[#df0af2] transition-colors">
                    {submitLead.isPending ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}
                  </span>
                </button>
                <p className="text-xs text-[#736d77] mt-3">
                  Ao enviar, você confirma que é decisor(a) ou está autorizado(a) pela empresa a solicitar análises, cotações e avançar no processo.
                </p>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
