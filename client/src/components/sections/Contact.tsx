import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Solicitação enviada!",
      description: "Um de nossos especialistas entrará em contato em breve.",
    });
    form.reset();
  }

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Pronto para economizar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Preencha o formulário e receba uma análise gratuita do seu potencial de economia. Sem compromisso.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">contato@otimaenergia.com.br</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium">São Paulo, SP</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-muted/30 rounded-xl border border-border">
              <h4 className="font-bold mb-2">Por que escolher a Ótima?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Atendimento personalizado</li>
                <li>• Acesso aos melhores preços do mercado</li>
                <li>• Tecnologia de ponta na gestão de energia</li>
              </ul>
            </div>
          </div>

          <Card className="shadow-lg border-muted">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
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
                          <FormLabel>Telefone / WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
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
                        <FormLabel>Email Corporativo</FormLabel>
                        <FormControl>
                          <Input placeholder="voce@empresa.com.br" {...field} />
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
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua empresa" {...field} />
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
                        <FormLabel>Mensagem (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Conte-nos sobre seu consumo de energia atual..." 
                            className="resize-none min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full text-lg h-12">
                    Solicitar Orçamento Grátis
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
