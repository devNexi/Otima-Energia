import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
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

const fieldStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#ffffff",
  padding: "12px 16px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.9rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s, background 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Sora', sans-serif",
  fontWeight: 600,
  fontSize: "0.72rem",
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.4)",
  textTransform: "uppercase",
  display: "block",
  marginBottom: "6px",
};

export function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", message: "" },
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
      toast({ title: "Solicitação enviada!", description: "Um de nossos especialistas entrará em contato em breve." });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitLead.mutate(values);
  }

  return (
    <section
      id="contact"
      style={{ background: "#13112a" }}
      className="pt-20 pb-12 lg:pt-24 lg:pb-16 border-t border-[rgba(255,255,255,0.04)]"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">

          {/* Left Column */}
          <div>
            <div
              className="inline-block mb-4"
              style={{
                background: "rgba(158,63,253,0.12)",
                border: "1px solid rgba(158,63,253,0.3)",
                color: "#c88ff5",
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: "99px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Contato
            </div>
            <p
              className="dcvc-statement text-white mb-8"
              style={{ marginTop: "8px" }}
            >
              Pronto para{" "}
              <span className="text-highlight">começar a economizar</span>?
            </p>

            <div className="space-y-5">
              <div>
                <p
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    color: "#c88ff5",
                    textTransform: "uppercase",
                    background: "rgba(158,63,253,0.12)",
                    border: "1px solid rgba(158,63,253,0.3)",
                    borderRadius: "99px",
                    display: "inline-block",
                    padding: "3px 10px",
                    marginBottom: "6px",
                  }}
                >
                  E-mail
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>
                  contato@otimaenergia.com
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    letterSpacing: "0.12em",
                    color: "#c88ff5",
                    textTransform: "uppercase",
                    background: "rgba(158,63,253,0.12)",
                    border: "1px solid rgba(158,63,253,0.3)",
                    borderRadius: "99px",
                    display: "inline-block",
                    padding: "3px 10px",
                    marginBottom: "6px",
                  }}
                >
                  Localização
                </p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>
                  Rio de Janeiro, Brasil
                </p>
              </div>
            </div>
          </div>

          {/* Right Column — Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={labelStyle}>Nome Completo</FormLabel>
                        <FormControl>
                          <input
                            placeholder="Seu nome"
                            data-testid="input-name"
                            style={fieldStyle}
                            onFocus={e => { e.currentTarget.style.borderColor = "rgba(158,63,253,0.5)"; e.currentTarget.style.background = "rgba(158,63,253,0.05)"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={labelStyle}>Telefone</FormLabel>
                        <FormControl>
                          <input
                            placeholder="+55 21 99999-9999"
                            data-testid="input-phone"
                            style={fieldStyle}
                            onFocus={e => { e.currentTarget.style.borderColor = "rgba(158,63,253,0.5)"; e.currentTarget.style.background = "rgba(158,63,253,0.05)"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={labelStyle}>E-mail</FormLabel>
                      <FormControl>
                        <input
                          placeholder="voce@empresa.com.br"
                          data-testid="input-email"
                          style={fieldStyle}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(158,63,253,0.5)"; e.currentTarget.style.background = "rgba(158,63,253,0.05)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={labelStyle}>Empresa</FormLabel>
                      <FormControl>
                        <input
                          placeholder="Nome da empresa"
                          data-testid="input-company"
                          style={fieldStyle}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(158,63,253,0.5)"; e.currentTarget.style.background = "rgba(158,63,253,0.05)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={labelStyle}>Mensagem (Opcional)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Conte-nos sobre seu consumo de energia..."
                          data-testid="input-message"
                          rows={4}
                          style={{ ...fieldStyle, resize: "none", minHeight: "110px" }}
                          onFocus={e => { e.currentTarget.style.borderColor = "rgba(158,63,253,0.5)"; e.currentTarget.style.background = "rgba(158,63,253,0.05)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={submitLead.isPending}
                  data-testid="button-submit-lead"
                  className="w-full inline-flex items-center justify-center gap-3 font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    background: "#9e3ffd",
                    color: "#ffffff",
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "0.9rem",
                    letterSpacing: "0.02em",
                    padding: "13px 26px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(158,63,253,0.35)",
                  }}
                >
                  {submitLead.isPending ? "Enviando..." : "Enviar Solicitação"}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>
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
